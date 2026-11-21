import { apiGet, apiPost, getBaseUrl } from "./client";
import {
  CloudPackageRecord,
  MaintainerResponse,
  PackageDetailResponse,
  PublishArtifactResponse,
  RegistrySearchResponse,
  RegistryStats
} from "../../types/api";

/**
 * NxMirror Package Registry (Demoapi netlify/lib/registry.mjs + registry-npm.mjs).
 * All read endpoints are PUBLIC (no login) for artifacts published with
 * visibility "public". Package detail sends the session token when present so
 * the owner also sees their private versions.
 */

export const fetchRegistryStats = () =>
  apiGet<{ success: boolean; stats: RegistryStats }>("registry/stats");

export interface RegistrySearchParams {
  q?: string;
  kind?: "all" | "package" | "plugin";
  sort?: "downloads" | "newest" | "name";
  limit?: number;
}

export const searchRegistry = (params: RegistrySearchParams = {}) => {
  const { q = "", kind = "all", sort = "downloads", limit = 24 } = params;
  return apiGet<RegistrySearchResponse>("registry/search", {
    query: { q, kind, sort, limit }
  });
};

/** id = "<owner>/<name>" */
export const fetchPackage = (id: string) => {
  const [owner, name] = splitPackageId(id);
  return apiGet<PackageDetailResponse>(`registry/package/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, {
    auth: true
  });
};

export const fetchMaintainer = (owner: string) =>
  apiGet<MaintainerResponse>(`registry/user/${encodeURIComponent(owner)}`);

/**
 * Direct artifact download URL (public packages need no login). The backend
 * answers with the artifact bytes (npm-store) or a 302 to the site's file
 * proxy — both work with FileSystem.downloadAsync.
 */
export const packageDownloadUrl = (owner: string, name: string, version?: string) => {
  const base = getBaseUrl().replace(/\/+$/, "");
  return `${base}/api/registry/download/${encodeURIComponent(owner)}/${encodeURIComponent(name)}${version ? "/" + encodeURIComponent(version) : ""}`;
};

export function splitPackageId(id: string): [string, string] {
  const cleaned = decodeURIComponent(String(id || ""));
  const slash = cleaned.indexOf("/");
  if (slash <= 0 || slash === cleaned.length - 1) throw new Error("Invalid package reference.");
  return [cleaned.slice(0, slash), cleaned.slice(slash + 1)];
}

/* ---------- publishing (login required) ---------- */

export interface PublishPayload {
  type: "package" | "plugin";
  name: string;
  version: string;
  filename: string;
  visibility: "public" | "private";
  description?: string;
  license?: string;
  readme?: string;
  tags?: string[];
  base64: string;
  sha256?: string;
}

/** POST /api/cloud/publish — 4 MiB artifact limit, immutable versions. */
export const publishArtifact = (payload: PublishPayload) =>
  apiPost<PublishArtifactResponse>("cloud/publish", payload, { auth: true });

/** GET /api/cloud/packages | /api/cloud/plugins — the signed-in account's artifacts. */
export const fetchMyCloudArtifacts = (kind: "packages" | "plugins") =>
  apiGet<{ success: boolean; items: CloudPackageRecord[] }>(`cloud/${kind}`, { auth: true });

/** GET /api/cloud/public/packages | /api/cloud/public/plugins — public catalog, no login. */
export const fetchPublicArtifacts = (kind: "packages" | "plugins") =>
  apiGet<{ success: boolean; visibility: string; items: CloudPackageRecord[] }>(`cloud/public/${kind}`);
