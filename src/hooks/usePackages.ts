import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMaintainer,
  fetchMyCloudArtifacts,
  fetchPackage,
  fetchPublicArtifacts,
  fetchRegistryStats,
  publishArtifact,
  searchRegistry,
  PublishPayload
} from "../services/api/registry";
import { useAuthStore } from "../stores/auth";

const STALE = { staleTime: 60_000, gcTime: 10 * 60_000, retry: 1 };

export function useRegistryStats(enabled = true) {
  return useQuery({ queryKey: ["registry", "stats"], queryFn: fetchRegistryStats, enabled, ...STALE });
}

export function useRegistrySearch(params: { q?: string; kind?: "all" | "package" | "plugin"; sort?: "downloads" | "newest" | "name"; limit?: number }, enabled = true) {
  return useQuery({
    queryKey: ["registry", "search", params.q ?? "", params.kind ?? "all", params.sort ?? "downloads", params.limit ?? 24],
    queryFn: () => searchRegistry(params),
    enabled,
    ...STALE
  });
}

export function usePackage(id: string, enabled = true) {
  return useQuery({ queryKey: ["registry", "package", id], queryFn: () => fetchPackage(id), enabled: enabled && !!id, ...STALE });
}

export function useMaintainer(owner: string, enabled = true) {
  return useQuery({ queryKey: ["registry", "maintainer", owner], queryFn: () => fetchMaintainer(owner), enabled: enabled && !!owner, ...STALE });
}

export function useMyArtifacts(kind: "packages" | "plugins") {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["cloud", "mine", kind, token],
    queryFn: () => fetchMyCloudArtifacts(kind),
    enabled: !!token,
    ...STALE
  });
}

export function usePublicArtifacts(kind: "packages" | "plugins") {
  return useQuery({ queryKey: ["cloud", "public", kind], queryFn: () => fetchPublicArtifacts(kind), ...STALE });
}

export function usePublishArtifact() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: PublishPayload) => publishArtifact(payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["registry"] });
      client.invalidateQueries({ queryKey: ["cloud"] });
    }
  });
}
