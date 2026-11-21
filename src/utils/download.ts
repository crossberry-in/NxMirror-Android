import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { normalizeError } from "../services/api/client";

/**
 * Download-to-device helper. Files land in the app cache directory and are
 * handed to the Android share sheet (Files app / Save to device), which works
 * without any extra storage permissions.
 */

export interface DownloadProgress {
  receivedBytes: number;
  totalBytes: number | null;
  done: boolean;
  error?: string;
}

export async function downloadAndShare(params: {
  url: string;
  filename: string;
  onProgress?: (progress: DownloadProgress) => void;
  headers?: Record<string, string>;
}): Promise<{ fileUri: string }> {
  const targetUri = `${FileSystem.cacheDirectory}${params.filename.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 160)}`;
  let settled = false;
  let received = 0;

  const poll = async (expected: number | null) => {
    while (!settled) {
      try {
        const info = await FileSystem.getInfoAsync(targetUri);
        if (info.exists && info.size !== received) {
          received = info.size;
          params.onProgress?.({ receivedBytes: received, totalBytes: expected, done: false });
        }
      } catch {
        /* polling is best-effort */
      }
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  };

  try {
    let expected: number | null = null;
    try {
      const head = await fetch(params.url, { method: "HEAD", headers: params.headers });
      const length = Number(head.headers.get("content-length") || 0);
      if (length > 0) expected = length;
    } catch {
      /* HEAD probe optional */
    }
    const poller = params.onProgress ? poll(expected) : Promise.resolve();

    const result = await FileSystem.downloadAsync(params.url, targetUri, { headers: params.headers });
    settled = true;
    await poller.catch(() => undefined);

    if (result.status < 200 || result.status >= 300) {
      await FileSystem.deleteAsync(targetUri, { idempotent: true }).catch(() => undefined);
      throw new Error(`Download failed (HTTP ${result.status}).`);
    }
    params.onProgress?.({ receivedBytes: result.headers["content-length"] ? Number(result.headers["content-length"]) : received, totalBytes: expected, done: true });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(result.uri, {
        mimeType: "application/octet-stream",
        dialogTitle: params.filename,
        UTI: "public.data"
      });
    }
    return { fileUri: result.uri };
  } catch (error) {
    settled = true;
    throw normalizeError(error);
  }
}

/** Copies a local file into the cache dir under a clean name (upload prep). */
export async function stageUploadFile(sourceUri: string, filename: string): Promise<string> {
  const clean = filename.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 160) || "upload.bin";
  const targetUri = `${FileSystem.cacheDirectory}${Date.now()}-${clean}`;
  await FileSystem.copyAsync({ from: sourceUri, to: targetUri });
  return targetUri;
}

/** Reads one byte range of a local file as base64 (for chunked uploads). */
export async function readChunkBase64(fileUri: string, position: number, length: number): Promise<string> {
  return FileSystem.readAsStringAsync(fileUri, {
    position,
    length,
    encoding: FileSystem.EncodingType.Base64
  });
}

/** Writes base64 bytes to a cache file — used to send upload chunks. */
export async function writeChunkFile(base64: string, name: string): Promise<string> {
  const targetUri = `${FileSystem.cacheDirectory}chunk-${Date.now()}-${name}`;
  await FileSystem.writeAsStringAsync(targetUri, base64, { encoding: FileSystem.EncodingType.Base64 });
  return targetUri;
}

export async function fileSizeOf(fileUri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(fileUri);
  return info.exists && "size" in info ? (info as { size: number }).size : 0;
}
