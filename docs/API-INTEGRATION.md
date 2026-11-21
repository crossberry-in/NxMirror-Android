# NxMirror Android — API Integration

Every endpoint used by this app, as implemented in the real backend
(**crossberry-in/Demoapi**) and verified against its source code
(`netlify/functions/api.mjs`, `netlify/lib/*.mjs`) and the live deployment at
`https://nxmirror.netlify.app`.

- **Base URL** (configurable in Settings): `https://nxmirror.netlify.app`
- **Auth**: `Authorization: Bearer <token>` — JWT issued by the backend
  (7-day expiry) or `nxsk_…` API token. Stored only in Expo SecureStore.
- **Error shape**: non-OK responses return `{ success: false, error: string }`
  (optionally `code`). The client surfaces `error` verbatim.

---

## 1. Authentication — `netlify/lib/account-auth.mjs`

| Method | Path | Auth | Request | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | — | `{ username, password }` (username `^[a-z0-9_]{3,30}$`, password 8–128) | `201 { success, user: { id, username, createdAt }, token }` |
| POST | `/api/auth/login` | — | `{ username, password }` | `200 { success, user, token }` — 401 `Invalid username or password.` |
| GET | `/api/auth/me` | Bearer | — | `{ success, user }` — 401 `Authentication required.` |

> Registering provisions the personal AnonDrop storage account server-side.
> The app stores only the returned token (SecureStore) — never passwords.

## 2. Account API tokens

| Method | Path | Auth | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/account/tokens` | Bearer | — | `{ success, tokens: [{ id, name, scopes, createdAt, lastUsedAt }] }` |
| POST | `/api/account/tokens` | Bearer | `{ name, scopes?: ["full"|"read"] }` | `201 { success, tokenValue, token }` (value shown once) |
| DELETE | `/api/account/tokens/:id` | Bearer | — | `{ success, revoked, id }` |

## 3. Package Registry (public catalog) — `netlify/lib/registry.mjs`

All read endpoints work **without login** for artifacts published as `public`.

| Method | Path | Auth | Query | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/registry/stats` | — | — | `{ stats: { packages, plugins, versions, downloads, maintainers, updatedAt, latest: RegistryPackage[] } }` |
| GET | `/api/registry/search` | — | `q, kind=all\|package\|plugin, sort=downloads\|newest\|name, limit≤60` | `{ total, tags: [{ tag, count }], items: RegistryPackage[] }` |
| GET | `/api/registry/package/:owner/:name` | optional Bearer (owner sees private versions) | — | `{ package: RegistryPackage & { readme }, versions: PackageVersion[] }` — 404 when unknown |
| GET | `/api/registry/user/:owner` | — | — | `{ owner, stats, tags, items }` |
| GET | `/api/registry/download/:owner/:name[/:version]` | — (private: owner Bearer) | — | artifact bytes (`application/gzip`) **or** `302` → site file proxy; bumps the real download counter |

`RegistryPackage` = `{ owner, type: "package"|"plugin", name, version, filename,
size, sha256, description, tags, license, visibility, publishedAt,
firstPublishedAt, versions, downloads, downloadUrl }`.

## 4. Package publishing (login required) — `netlify/lib/package-cloud.mjs`

| Method | Path | Auth | Request | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/cloud/publish` | Bearer | `{ type, name, version, filename, visibility, description?, license?, readme?, tags?, base64, sha256? }` — artifact ≤ **4 MiB** | `201 { success, artifact }` — 409 when `name@version` already exists (immutable) |
| GET | `/api/cloud/packages` | Bearer | — | `{ items: CloudPackageRecord[] }` (own artifacts) |
| GET | `/api/cloud/plugins` | Bearer | — | same, filtered to plugins |
| GET | `/api/cloud/public/packages` | — | — | `{ visibility: "public", items }` |
| GET | `/api/cloud/public/plugins` | — | — | same |

The npm-pack flow (`POST /api/registry` with a raw `.tgz`, `?visibility=`) also
exists in the backend but the Android app publishes through `/api/cloud/publish`.

## 5. Cloud files (`/api/mirror`) — `netlify/functions/api.mjs`

All mirror routes require the session.

| Method | Path | Body / Query | Response |
| --- | --- | --- | --- |
| GET | `/api/mirror?action=list&path=` | — | `{ path, directories: string[], files: MirrorFile[], partial?, warning? }` |
| GET | `/api/mirror?action=profile` | — | `{ profile: { displayName, bio, avatarData, avatarUpdatedAt } }` |
| POST | `/api/mirror?action=folder` | `{ path, name }` | `201 { ok, path }` — 409 when exists |
| POST | `/api/mirror?action=init` | `{ filename, folder }` | `{ sessionHash }` |
| POST | `/api/mirror?action=chunk&session=<hash>` | multipart field `chunk` (≤5 MiB) | `{ ok }` |
| POST | `/api/mirror?action=finish` | `{ sessionHash }` | `{ ok, url, mirrorUrl, fileId, filename, folder }` |
| POST | `/api/mirror?action=direct` | multipart `file` (≤4 MiB) + `folder` | `{ ok, url, mirrorUrl, shareUrl, fileId, filename, folder }` |
| POST | `/api/mirror?action=urlinit` | `{ url, folder }` | `{ ok, sessionHash, filename, totalSize, finalUrl }` (server-to-server link import) |
| POST | `/api/mirror?action=urlchunk` | `{ sessionHash, index }` | `{ ok, done, bytes, uploaded }` |
| POST | `/api/mirror?action=delete` | `{ id }` | `{ ok, deleted, id }` |
| POST | `/api/mirror?action=rename` | `{ id, filename }` | `{ ok, id, filename, metadataOnly }` |
| POST | `/api/mirror?action=profile` | `{ displayName, bio }` | `{ ok, profile }` |
| POST | `/api/mirror?action=avatar` | raw image bytes (`image/jpeg|png|webp|gif`, ≤1.5 MB) | `{ ok, avatarUrl, updatedAt }` |

**Public file URL** (download/stream, no login):
`<origin>/<fileId>/<filename>` — served by the `anondrop-proxy` edge function
with the correct MIME type and download disposition. The app shows only this
NxMirror URL, never internal storage-provider URLs.

> Not implemented by the backend (and therefore not in the app): moving files,
> deleting/renaming folders.

## 6. Git Cloud (`/api/git`) — `netlify/lib/git-cloud.mjs`

All routes need the session; owner-only actions are enforced server-side.
`repo` references accept `<name>` or `<owner>/<name>`.

| Method | Path | Body / Query | Response |
| --- | --- | --- | --- |
| GET | `?action=list` | — | `{ repositories: GitRepository[] }` (own + public) |
| GET | `?action=repo` | `repo` | `{ repository, starred, branches, tags, issues, releases, files, commits(≤100) }` |
| GET | `?action=file` | `repo, path` | `{ path, content, encoding: "text"\|"base64", mime, metadata }` |
| GET | `?action=raw` | `repo, path` | bytes (`inline` for text/images, else attachment) |
| GET | `?action=zip` | `repo` | repository ZIP |
| GET | `?action=sql` | `repo` | SQL snapshot download |
| POST | `?action=create` | `{ name, description?, visibility, readme? }` | `201 { repository }` (initial README commit) |
| PATCH | `?action=repo` | `{ description?, visibility?, defaultBranch? }` | owner only |
| DELETE | `?action=repo` | `repo` | owner only — removes everything |
| POST | `?action=file` | `{ path, content, encoding?, message? }` | `{ file }` (creates a commit) |
| DELETE | `?action=file` | `repo, path, message?` | `{ deleted }` (creates a delete commit) |
| POST | `?action=star` | `{ star? }` | `{ stars, starred }` |
| POST | `?action=fork` | — | `201 { repository }` |
| POST | `?action=branch\|tag\|issue\|release` | per-kind body | `201 { branch\|tag\|issue\|release }` |

`GitRepository` = `{ id, owner, name, description, visibility, defaultBranch,
createdAt, updatedAt, stars, forks, features, forkedFrom? }`.

## 7. NxMirror DB (NxDB) — `netlify/lib/nxdb-api.mjs`

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/db` | — | — | service info (`{ service: "NxDB", engines, auth, apiBase }`) |
| GET | `/api/db/health` | — | — | `{ status: "online", engine: "sqlite", persistent }` |
| GET | `/api/db/list` | Bearer | — | `{ databases: NxDatabase[] }` (own only) |
| GET | `/api/db/overview` | Bearer | — | `{ overview: { databases, tables, records, storageBytes, sqlStorageBytes, objectStorageBytes, apiRequests, activity } }` |
| POST | `/api/db/tables` | Bearer | `{ databaseId }` | `{ tables: NxDbTableStats[] }` |
| POST | `/api/db/query` | Bearer | `{ databaseId, sql, params? }` | `{ columns?, rows?, mutation }` — SQL errors surfaced verbatim |
| GET | `/api/db/storage/list` | Bearer | `db, folder?, q?` | `{ folder, files: NxDbStorageFile[], folders }` |

The app exposes only account-scoped, read/write-query operations the backend
authorizes — no administrative endpoints.

## 8. Health / service discovery

| Method | Path | Auth | Response |
| --- | --- | --- | --- |
| GET | `/api/db` | — | used as the lightweight **API reachability probe** |
| GET | `/api/health` | — | legacy demo API info (`{ status: "online" }`) |

## 9. Client behaviour

- **Timeouts**: 30 s default (60 s for SQL), `AbortController`.
- **Retries**: only idempotent GETs (1 retry, 700 ms backoff) on network/5xx.
- **401 handling**: any 401 clears the local session (SecureStore wipe) and
  routes the user back to guest mode.
- **Uploads**: chunked (`init → chunk×N → finish`, 4 MiB chunks read as base64
  and sent as multipart temp files) for anything over 4 MiB; direct multipart
  upload for small files.
- **Downloads**: `expo-file-system downloadAsync` + Android share sheet.
- **Base URL override**: Settings > API server — validated as `https://…`
  and probed with a real request before status is shown.
