import { apiDelete, apiGet, apiPost } from "./client";
import { AuthResponse, NxUser } from "../../types/api";

/**
 * Demoapi authentication (see netlify/lib/account-auth.mjs in the backend).
 * - POST /api/auth/register { username, password } -> { success, user, token }
 * - POST /api/auth/login    { username, password } -> { success, user, token }
 * - GET  /api/auth/me       (Bearer)               -> { success, user }
 * Tokens are persisted by the auth store in Expo SecureStore, never logged.
 */
export const registerUser = (username: string, password: string) =>
  apiPost<AuthResponse>("auth/register", { username, password });

export const loginUser = (username: string, password: string) =>
  apiPost<AuthResponse>("auth/login", { username, password });

export const fetchCurrentUser = (token: string) =>
  apiGet<{ success: boolean; user: NxUser }>("auth/me", { auth: true });

export interface ApiTokenRecord {
  id: string;
  name: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
}

/** GET /api/account/tokens */
export const listApiTokens = () =>
  apiGet<{ success: boolean; tokens: ApiTokenRecord[] }>("account/tokens", { auth: true });

/** POST /api/account/tokens { name, scopes } -> full value returned exactly once. */
export const createApiToken = (name: string, scopes: string[] = ["full"]) =>
  apiPost<{ success: boolean; tokenValue: string; token: Omit<ApiTokenRecord, "lastUsedAt"> }>(
    "account/tokens",
    { name, scopes },
    { auth: true }
  );

/** DELETE /api/account/tokens/:id */
export const revokeApiToken = (id: string) =>
  apiDelete<{ success: boolean; revoked: boolean; id: string }>(
    `account/tokens/${encodeURIComponent(id)}`,
    undefined,
    { auth: true }
  );
