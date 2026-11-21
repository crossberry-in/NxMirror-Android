# Releasing NxMirror Android

Releases are built by **GitHub Actions** with plain Gradle — no Expo EAS, no
cloud APK service. The workflow is `.github/workflows/android-release.yml`.

## Version bump

1. Edit `app.json`:
   - `expo.version` → new semver (shows as `versionName`)
   - `expo.android.versionCode` → increment (shows as `versionCode`)
2. Keep `package.json` `version` in sync.

## Tag and release

```bash
git tag v1.0.1
git push origin v1.0.1
```

The `Android Release` workflow then runs:

1. `npm ci`
2. `npx tsc --noEmit` (TypeScript gate — build fails on type errors)
3. `npx expo-doctor`
4. `npx expo config --type public` (Expo configuration validation)
5. `npx expo prebuild --platform android --no-install`
6. `cd android && ./gradlew --no-daemon assembleRelease`
7. APK existence + size verification (fails the job if missing/empty)
8. Upload `app-release.apk` as a workflow artifact
9. On `v*` tags: create the GitHub Release **NxMirror Android v<ver>** with
   `NxMirror-Android-v<ver>.apk` attached and release notes published.

Manual runs are possible via **Actions → Android Release → Run workflow**
(dispatch builds produce artifacts but no Release).

## Signing policy

- If no signing secrets are configured (current state), the APK is signed with
  the **development (debug) keystore** and the release notes say so explicitly —
  the app never silently claims a production signature.
- For production signing, add these repository secrets and extend the workflow
  before the Gradle step:

  | Secret | Meaning |
  | --- | --- |
  | `ANDROID_KEYSTORE_BASE64` | base64 of your release `.keystore` |
  | `ANDROID_KEYSTORE_PASSWORD` | keystore password |
  | `ANDROID_KEY_ALIAS` | key alias |
  | `ANDROID_KEY_PASSWORD` | key password |

  Decode into `android/app/release.keystore`, wire a `signingConfigs.release`
  block (see `docs/LOCAL-BUILD.md`), and pass the values as Gradle properties.
  Secrets are never printed to logs.

## Rules enforced by the workflow

- A failed build **never** creates a Release (Release step depends on build +
  verification steps succeeding).
- Only stable, pinned major GitHub Actions versions are used
  (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/setup-java@v4`,
  `android-actions/setup-android@v3`, `actions/upload-artifact@v4`).
- `GITHUB_TOKEN` with `contents: write` is the only credential used for
  Releases.
