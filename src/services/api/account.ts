import { apiDelete, apiGet, apiPut } from "./client";
import { MirrorProfile } from "../../types/api";

/**
 * Account-level endpoints: profile (mirror), generic cloud data KV and
 * account API tokens. Profile details live in /api/mirror?action=profile.
 */
export { listApiTokens, createApiToken, revokeApiToken } from "./auth";
export type { ApiTokenRecord } from "./auth";

export const fetchProfile = () => apiGet<MirrorProfile>("mirror", { auth: true, query: { action: "profile" } });

/** GET /api/cloud/data — the account's generic JSON document (≤500 KB). */
export const fetchCloudData = () =>
  apiGet<{ success: boolean; data: Record<string, unknown> }>("cloud/data", { auth: true });

/** PUT /api/cloud/data — persist the account's JSON document. */
export const saveCloudData = (data: Record<string, unknown>) =>
  apiPut<{ success: boolean; saved: boolean }>("cloud/data", { data }, { auth: true });
