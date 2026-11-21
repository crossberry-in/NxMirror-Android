import { useQuery } from "@tanstack/react-query";
import { fetchDbOverview, fetchDbServiceInfo, fetchDbTables, fetchDatabases, fetchDbStorage } from "../services/api/nxdb";
import { useAuthStore } from "../stores/auth";

const STALE = { staleTime: 60_000, gcTime: 10 * 60_000, retry: 1 };

export function useDbService(enabled = true) {
  return useQuery({ queryKey: ["nxdb", "service"], queryFn: fetchDbServiceInfo, enabled, staleTime: 10 * 60_000 });
}

export function useDatabases(enabled = true) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["nxdb", "list", token],
    queryFn: fetchDatabases,
    enabled: enabled && !!token,
    ...STALE
  });
}

export function useDbOverview(enabled = true) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["nxdb", "overview", token],
    queryFn: fetchDbOverview,
    enabled: enabled && !!token,
    ...STALE
  });
}

export function useDbTables(databaseId: string, enabled = true) {
  return useQuery({
    queryKey: ["nxdb", "tables", databaseId],
    queryFn: () => fetchDbTables(databaseId),
    enabled: enabled && !!databaseId,
    ...STALE
  });
}

export function useDbStorage(databaseId: string, folder = "", q = "", enabled = true) {
  return useQuery({
    queryKey: ["nxdb", "storage", databaseId, folder, q],
    queryFn: () => fetchDbStorage(databaseId, folder, q),
    enabled: enabled && !!databaseId,
    ...STALE
  });
}
