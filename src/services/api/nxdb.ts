import { apiGet, apiPost } from "./client";
import {
  NxDatabase,
  NxDbOverview,
  NxDbQueryResult,
  NxDbServiceInfo,
  NxDbStorageListResponse,
  NxDbTableStats
} from "../../types/api";

/**
 * NxMirror DB — NxDB (Demoapi netlify/lib/nxdb-api.mjs).
 * Account-level routes use the signed-in session; database-scoped routes
 * additionally check ownership/tokens server-side. This client only exposes
 * operations the account session is allowed to run — no admin bypasses.
 */

export const fetchDbServiceInfo = () => apiGet<NxDbServiceInfo>("db");

export const fetchDbHealth = () =>
  apiGet<{ success: boolean; service: string; status: string; engine: string; persistent: boolean }>("db/health");

export const fetchDatabases = () =>
  apiGet<{ success: boolean; databases: NxDatabase[] }>("db/list", { auth: true });

export const fetchDbOverview = () =>
  apiGet<{ success: boolean; overview: NxDbOverview }>("db/overview", { auth: true });

export const fetchDbDetails = (databaseId: string) =>
  apiPost<{ success: boolean; database: NxDatabase; credentials?: unknown }>(
    "db/details",
    { databaseId },
    { auth: true }
  );

export const fetchDbTables = (databaseId: string) =>
  apiPost<{ success: boolean; tables: NxDbTableStats[] }>("db/tables", { databaseId }, { auth: true });

export const runDbQuery = (databaseId: string, sql: string, params: unknown[] = []) =>
  apiPost<NxDbQueryResult>("db/query", { databaseId, sql, params }, { auth: true, timeoutMs: 60000 });

export const fetchDbStorage = (databaseId: string, folder = "", q = "") =>
  apiGet<NxDbStorageListResponse>("db/storage/list", {
    auth: true,
    query: { db: databaseId, folder: folder || undefined, q: q || undefined }
  });
