import { apiDelete, apiGet, apiPatch, apiPost, getBaseUrl } from "./client";
import {
  GitCommit,
  GitFileContentResponse,
  GitRepoDetailResponse,
  GitRepository
} from "../../types/api";

/**
 * Noxs Git Cloud (Demoapi netlify/lib/git-cloud.mjs). Every route requires the
 * signed-in session; owner-only operations are enforced server-side and the
 * client surfaces the backend's error messages verbatim.
 */

export const fetchRepositories = () =>
  apiGet<{ success: boolean; repositories: GitRepository[] }>("git", { auth: true, query: { action: "list" } });

/** repoRef = "<name>" or "<owner>/<name>". */
export const fetchRepository = (repoRef: string) =>
  apiGet<GitRepoDetailResponse>("git", { auth: true, query: { action: "repo", repo: repoRef } });

export const fetchRepoFile = (repoRef: string, path: string) =>
  apiGet<GitFileContentResponse>("git", { auth: true, query: { action: "file", repo: repoRef, path } });

export const fetchRepoZipUrl = (repoRef: string) => {
  const base = getBaseUrl().replace(/\/+$/, "");
  return `${base}/api/git?action=zip&repo=${encodeURIComponent(repoRef)}`;
};

export interface CreateRepoPayload {
  name: string;
  description?: string;
  visibility: "public" | "private";
  readme?: boolean;
}

export const createRepository = (payload: CreateRepoPayload) =>
  apiPost<{ success: boolean; repository: GitRepository; alreadyExists?: boolean }>(
    "git",
    payload,
    { auth: true, query: { action: "create" } }
  );

export const updateRepository = (repoRef: string, patch: { description?: string; visibility?: "public" | "private"; defaultBranch?: string }) =>
  apiPatch<{ success: boolean; repository: GitRepository }>(
    "git",
    patch,
    { auth: true, query: { action: "repo", repo: repoRef } }
  );

export const deleteRepository = (repoRef: string) =>
  apiDelete<{ success: boolean; deleted: boolean }>(
    "git",
    undefined,
    { auth: true, query: { action: "repo", repo: repoRef } }
  );

export const toggleStar = (repoRef: string, star?: boolean) =>
  apiPost<{ success: boolean; stars: number; starred: boolean }>(
    "git",
    star === undefined ? {} : { star },
    { auth: true, query: { action: "star", repo: repoRef } }
  );

export const forkRepository = (repoRef: string) =>
  apiPost<{ success: boolean; repository: GitRepository }>(
    "git",
    {},
    { auth: true, query: { action: "fork", repo: repoRef } }
  );

export interface SaveFilePayload {
  path: string;
  content: string;
  encoding?: "text" | "base64";
  message?: string;
  mime?: string;
}

export const saveRepoFile = (repoRef: string, payload: SaveFilePayload) =>
  apiPost<{ success: boolean; file: { path: string; size: number; updatedAt: string; mime: string } }>(
    "git",
    payload,
    { auth: true, query: { action: "file", repo: repoRef } }
  );

export const deleteRepoFile = (repoRef: string, path: string, message?: string) =>
  apiDelete<{ success: boolean; deleted: string }>(
    "git",
    undefined,
    { auth: true, query: { action: "file", repo: repoRef, path, message } }
  );

export interface CreateRefPayload {
  name: string;
  head?: string;
  target?: string;
  title?: string;
  body?: string;
  tagName?: string;
  draft?: boolean;
  prerelease?: boolean;
}

export const createBranch = (repoRef: string, name: string, head?: string) =>
  apiPost<{ success: boolean; branch: { name: string } }>("git", { name, head } as CreateRefPayload, {
    auth: true,
    query: { action: "branch", repo: repoRef }
  });

export const createTag = (repoRef: string, name: string, target?: string) =>
  apiPost<{ success: boolean; tag: { name: string } }>("git", { name, target } as CreateRefPayload, {
    auth: true,
    query: { action: "tag", repo: repoRef }
  });

export const createIssue = (repoRef: string, title: string, body?: string) =>
  apiPost<{ success: boolean; issue: { number: number; title: string } }>(
    "git",
    { title, body } as CreateRefPayload,
    { auth: true, query: { action: "issue", repo: repoRef } }
  );

export const createRelease = (repoRef: string, tagName: string, title: string, body?: string) =>
  apiPost<{ success: boolean; release: { tagName: string; title: string } }>(
    "git",
    { tagName, title, body } as CreateRefPayload,
    { auth: true, query: { action: "release", repo: repoRef } }
  );

export const commitUrl = (repo: GitRepository, commit: GitCommit): string | null => {
  // Git Cloud stores commits internally; there is no public commit URL — null
  // keeps the UI honest instead of inventing links.
  return null;
};

/** Display ref: prefer owner/name for cross-owner lookups (clone-style). */
export const repoRef = (repo: Pick<GitRepository, "owner" | "name">, currentUsername?: string | null) =>
  repo.owner && currentUsername && repo.owner !== currentUsername ? `${repo.owner}/${repo.name}` : repo.name;
