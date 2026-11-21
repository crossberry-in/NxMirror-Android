import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBranch,
  createIssue,
  createRelease,
  createRepository,
  createTag,
  deleteRepoFile,
  deleteRepository,
  fetchRepositories,
  fetchRepoFile,
  fetchRepository,
  forkRepository,
  saveRepoFile,
  toggleStar,
  updateRepository
} from "../services/api/git";
import { useAuthStore } from "../stores/auth";

const STALE = { staleTime: 45_000, gcTime: 5 * 60_000, retry: 1 };

export function useRepositories(enabled = true) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["git", "list", token],
    queryFn: fetchRepositories,
    enabled: enabled && !!token,
    ...STALE
  });
}

export function useRepository(repoRef: string, enabled = true) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["git", "repo", repoRef, token],
    queryFn: () => fetchRepository(repoRef),
    enabled: enabled && !!repoRef && !!token,
    ...STALE
  });
}

export function useRepoFile(repoRef: string, path: string, enabled = true) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["git", "file", repoRef, path, token],
    queryFn: () => fetchRepoFile(repoRef, path),
    enabled: enabled && !!repoRef && !!path && !!token,
    staleTime: 30_000
  });
}

export function useGitMutations(repoRef: string) {
  const client = useQueryClient();
  const invalidateRepo = () => {
    client.invalidateQueries({ queryKey: ["git", "repo"] });
    client.invalidateQueries({ queryKey: ["git", "list"] });
    client.invalidateQueries({ queryKey: ["git", "file"] });
  };

  const star = useMutation({ mutationFn: (star?: boolean) => toggleStar(repoRef, star), onSuccess: invalidateRepo });
  const fork = useMutation({ mutationFn: () => forkRepository(repoRef), onSuccess: invalidateRepo });
  const update = useMutation({
    mutationFn: (patch: { description?: string; visibility?: "public" | "private"; defaultBranch?: string }) =>
      updateRepository(repoRef, patch),
    onSuccess: invalidateRepo
  });
  const remove = useMutation({ mutationFn: () => deleteRepository(repoRef), onSuccess: invalidateRepo });
  const saveFile = useMutation({ mutationFn: (payload: { path: string; content: string; message?: string; encoding?: "text" | "base64"; mime?: string }) => saveRepoFile(repoRef, payload), onSuccess: invalidateRepo });
  const removeFile = useMutation({
    mutationFn: ({ path, message }: { path: string; message?: string }) => deleteRepoFile(repoRef, path, message),
    onSuccess: invalidateRepo
  });
  const newBranch = useMutation({ mutationFn: (name: string) => createBranch(repoRef, name), onSuccess: invalidateRepo });
  const newTag = useMutation({ mutationFn: ({ name, target }: { name: string; target?: string }) => createTag(repoRef, name, target), onSuccess: invalidateRepo });
  const newIssue = useMutation({ mutationFn: ({ title, body }: { title: string; body?: string }) => createIssue(repoRef, title, body), onSuccess: invalidateRepo });
  const newRelease = useMutation({
    mutationFn: ({ tagName, title, body }: { tagName: string; title: string; body?: string }) =>
      createRelease(repoRef, tagName, title, body),
    onSuccess: invalidateRepo
  });
  const create = useMutation({ mutationFn: createRepository, onSuccess: invalidateRepo });

  return { star, fork, update, remove, saveFile, removeFile, newBranch, newTag, newIssue, newRelease, create };
}
