import { apiGet, apiPost, getBaseUrl, uploadBinary, uploadMultipart } from "./client";
import { MirrorListResponse, MirrorProfile, UploadFinishResponse } from "../../types/api";

/**
 * NxMirror cloud file manager (Demoapi netlify/functions/api.mjs — mirrorHandler).
 * All routes need the signed-in session. Files download through the site's
 * NxMirror URL:  <origin>/<fileId>/<filename>  (anondrop-proxy edge function).
 */

export const fetchDirectory = (path = "") =>
  apiGet<MirrorListResponse>("mirror", { auth: true, query: { action: "list", path } });

export const fetchMirrorProfile = () =>
  apiGet<MirrorProfile>("mirror", { auth: true, query: { action: "profile" } });

export const saveMirrorProfile = (displayName: string, bio: string) =>
  apiPost<{ ok: boolean; profile: { displayName: string; bio: string } }>(
    "mirror",
    { displayName, bio },
    { auth: true, query: { action: "profile" } }
  );

export const uploadAvatar = (fileUri: string, mimeType: string) =>
  uploadBinary<{ ok: boolean; avatarUrl: string; updatedAt: number }>({
    path: "mirror",
    query: { action: "avatar" },
    fileUri,
    mimeType,
    auth: true
  });

export const createFolder = (path: string, name: string) =>
  apiPost<{ ok: boolean; path: string }>("mirror", { path, name }, { auth: true, query: { action: "folder" } });

/** Opens a chunked upload session on the backend. */
export const initUpload = (filename: string, folder: string) =>
  apiPost<{ sessionHash: string }>("mirror", { filename, folder }, { auth: true, query: { action: "init" } });

/** Sends one ≤4 MiB chunk (multipart field "chunk") into the session. */
export const uploadChunk = (params: { sessionHash: string; fileUri: string; filename: string }) =>
  uploadMultipart<{ ok: boolean }>({
    path: "mirror",
    query: { action: "chunk", session: params.sessionHash },
    fileUri: params.fileUri,
    fieldName: "chunk",
    filename: params.filename,
    auth: true
  });

export const finishUpload = (sessionHash: string) =>
  apiPost<UploadFinishResponse>("mirror", { sessionHash }, { auth: true, query: { action: "finish" } });

/** Direct upload for small files (≤4 MiB, multipart field "file" + folder field). */
export const directUpload = (params: { fileUri: string; filename: string; mimeType: string; folder: string }) =>
  uploadMultipart<UploadFinishResponse & { shareUrl?: string }>({
    path: "mirror",
    query: { action: "direct" },
    fileUri: params.fileUri,
    fieldName: "file",
    filename: params.filename,
    mimeType: params.mimeType,
    fields: { folder: params.folder },
    auth: true
  });

export const deleteFile = (id: string) =>
  apiPost<{ ok: boolean; deleted: boolean; id: string }>("mirror", { id }, { auth: true, query: { action: "delete" } });

export const renameFile = (id: string, filename: string) =>
  apiPost<{ ok: boolean; id: string; filename: string }>("mirror", { id, filename }, { auth: true, query: { action: "rename" } });

/** Public NxMirror download/stream URL for a stored file. */
export const mirrorFileUrl = (fileId: string, filename: string): string => {
  const base = getBaseUrl().replace(/\/+$/, "");
  return `${base}/${encodeURIComponent(fileId)}/${encodeURIComponent(filename)}`;
};
