import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import {
  createFolder,
  deleteFile,
  fetchDirectory,
  fetchMirrorProfile,
  finishUpload,
  initUpload,
  renameFile,
  saveMirrorProfile,
  directUpload,
  uploadChunk,
  uploadAvatar
} from "../services/api/files";
import { fileSizeOf, readChunkBase64, stageUploadFile, writeChunkFile } from "../utils/download";
import { LIMITS } from "../constants/config";
import { useAuthStore } from "../stores/auth";

const STALE = { staleTime: 20_000, gcTime: 5 * 60_000, retry: 1 };

export interface UploadProgress {
  loadedBytes: number;
  totalBytes: number;
  phase: "preparing" | "uploading" | "finishing" | "done";
}

/**
 * Chunked upload implementation against /api/mirror:
 * init -> N x chunk (≤4 MiB each) -> finish. Each chunk is read from disk as
 * base64, staged into a temp file and sent as the multipart "chunk" field.
 */
export async function runChunkedUpload(params: {
  localUri: string;
  filename: string;
  folder: string;
  onProgress?: (progress: UploadProgress) => void;
}): Promise<{ mirrorUrl: string; fileId: string; filename: string }> {
  const total = await fileSizeOf(params.localUri);
  const chunkSize = LIMITS.uploadChunkBytes;
  const chunkCount = Math.max(1, Math.ceil(total / chunkSize));

  const { sessionHash } = await initUpload(params.filename, params.folder);
  for (let index = 0; index < chunkCount; index++) {
    const start = index * chunkSize;
    const length = Math.min(chunkSize, total - start);
    const base64 = await readChunkBase64(params.localUri, start, length);
    const chunkUri = await writeChunkFile(base64, `${index}.part`);
    await uploadChunk({ sessionHash, fileUri: chunkUri, filename: params.filename });
    await FileSystem.deleteAsync(chunkUri, { idempotent: true }).catch(() => undefined);
    params.onProgress?.({
      loadedBytes: Math.min(total, start + length),
      totalBytes: total,
      phase: "uploading"
    });
  }
  params.onProgress?.({ loadedBytes: total, totalBytes: total, phase: "finishing" });
  const finish = await finishUpload(sessionHash);
  params.onProgress?.({ loadedBytes: total, totalBytes: total, phase: "done" });
  return { mirrorUrl: finish.mirrorUrl || finish.url, fileId: finish.fileId, filename: finish.filename };
}

/** Direct multipart upload for small files (≤4 MiB). */
export async function runDirectUpload(params: {
  localUri: string;
  filename: string;
  mimeType: string;
  folder: string;
  onProgress?: (progress: UploadProgress) => void;
}): Promise<{ mirrorUrl: string; fileId: string; filename: string }> {
  params.onProgress?.({ loadedBytes: 0, totalBytes: 1, phase: "uploading" });
  const staged = await stageUploadFile(params.localUri, params.filename);
  const result = await directUpload({
    fileUri: staged,
    filename: params.filename,
    mimeType: params.mimeType,
    folder: params.folder
  });
  await FileSystem.deleteAsync(staged, { idempotent: true }).catch(() => undefined);
  params.onProgress?.({ loadedBytes: 1, totalBytes: 1, phase: "done" });
  return { mirrorUrl: result.mirrorUrl || result.url, fileId: result.fileId, filename: result.filename };
}

export function useDirectory(path: string, enabled = true) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["mirror", "list", path, token],
    queryFn: () => fetchDirectory(path),
    enabled: enabled && !!token,
    ...STALE
  });
}

export function useMirrorProfile(enabled = true) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["mirror", "profile", token],
    queryFn: fetchMirrorProfile,
    enabled: enabled && !!token,
    staleTime: 5 * 60_000
  });
}

export function useFileMutations(path: string) {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ["mirror", "list"] });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => createFolder(path, name),
    onSuccess: invalidate
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFile(id),
    onSuccess: invalidate
  });
  const renameMutation = useMutation({
    mutationFn: ({ id, filename }: { id: string; filename: string }) => renameFile(id, filename),
    onSuccess: invalidate
  });
  const saveProfileMutation = useMutation({
    mutationFn: ({ displayName, bio }: { displayName: string; bio: string }) => saveMirrorProfile(displayName, bio),
    onSuccess: () => client.invalidateQueries({ queryKey: ["mirror", "profile"] })
  });
  const avatarMutation = useMutation({
    mutationFn: ({ uri, mime }: { uri: string; mime: string }) => uploadAvatar(uri, mime),
    onSuccess: () => client.invalidateQueries({ queryKey: ["mirror", "profile"] })
  });

  return { createFolderMutation, deleteMutation, renameMutation, saveProfileMutation, avatarMutation };
}
