import { REQUEST_TIMEOUT_MS } from "../../constants/config";
import { useSettingsStore } from "../../stores/settings";

/**
 * Centralized NxMirror API client.
 *
 * - One configurable base URL (Settings > API server).
 * - JSON in/out with tolerant parsing of backend error shapes
 *   ({ success: false, error } and { error }).
 * - Bearer auth header injection (token kept in SecureStore by the auth store).
 * - Timeouts, safe-request retry (GET only), status validation.
 * - 401 handling through registered listeners (auth store clears the session).
 */

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export function getBaseUrl(): string {
  return useSettingsStore.getState().apiBaseUrl;
}

export function buildUrl(path: string, query?: Record<string, string | number | undefined | null>): string {
  const base = getBaseUrl().replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  let url = `${base}/api/${cleanPath}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && String(value).length) params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }
  return url;
}

let authHeaderProvider: () => Record<string, string> = () => ({});

/** The auth store registers this at startup to avoid a circular import. */
export function setAuthHeaderProvider(provider: () => Record<string, string>) {
  authHeaderProvider = provider;
}

function authHeaders(): Record<string, string> {
  return authHeaderProvider();
}

function isNetworkFailure(error: unknown): boolean {
  return error instanceof TypeError || (error instanceof ApiError && error.status === 0);
}

async function parseJson(response: Response): Promise<any> {
  const raw = await response.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new ApiError(
      `The server returned an invalid response (${response.status}).`,
      response.status
    );
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  let message = `Request failed (${response.status}).`;
  let code: string | undefined;
  try {
    const data = JSON.parse(await response.text());
    if (data?.error) message = String(data.error);
    if (data?.code) code = String(data.code);
    if (data?.message && !data?.error) message = String(data.message);
  } catch {
    /* keep default message */
  }
  return new ApiError(message, response.status, code);
}

export interface RequestOptions {
  auth?: boolean;
  query?: Record<string, string | number | undefined | null>;
  timeoutMs?: number;
  retries?: number;
  signal?: AbortSignal;
}

async function request<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const { auth = false, query, timeoutMs = REQUEST_TIMEOUT_MS, retries = 0, signal } = options;
  const url = buildUrl(path, query);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (auth) Object.assign(headers, authHeaders());
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onOuterAbort = () => controller.abort();
    signal?.addEventListener("abort", onOuterAbort, { once: true });
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal
      });
      if (response.status === 401) unauthorizedListeners.forEach((fn) => fn());
      if (!response.ok) throw await toApiError(response);
      const data = await parseJson(response);
      if (data && typeof data === "object" && data.success === false) {
        throw new ApiError(String(data.error || "Request failed."), response.status, data.code);
      }
      return data as T;
    } catch (error) {
      lastError = error;
      if (signal?.aborted) throw error;
      if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429) throw error;
      const recoverable = isNetworkFailure(error) || (error instanceof ApiError && (error.status >= 500 || error.status === 0 || error.status === 429));
      if (!recoverable || attempt === retries) throw normalizeError(error);
      await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onOuterAbort);
    }
  }
  throw normalizeError(lastError);
}

export function normalizeError(error: unknown): Error {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) {
    if (error.name === "AbortError") return new ApiError("The request timed out. Check your connection and try again.", 0);
    if (error.message === "Network request failed" || error instanceof TypeError) {
      return new ApiError("Cannot reach the NxMirror server. Check your internet connection.", 0);
    }
    return error;
  }
  return new Error("Unexpected error.");
}

export const apiGet = <T>(path: string, options: RequestOptions = {}): Promise<T> =>
  request<T>("GET", path, undefined, { retries: 1, ...options });

export const apiPost = <T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> =>
  request<T>("POST", path, body, options);

export const apiPut = <T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> =>
  request<T>("PUT", path, body, options);

export const apiPatch = <T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> =>
  request<T>("PATCH", path, body, options);

export const apiDelete = <T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> =>
  request<T>("DELETE", path, body, options);

/**
 * Multipart upload backed by expo-file-system uploadAsync (works reliably on
 * Android with real file URIs, unlike fetch FormData).
 * Returns the parsed JSON response.
 */
export async function uploadMultipart<T>(params: {
  path: string;
  query?: Record<string, string | undefined | null>;
  fileUri: string;
  fieldName?: string;
  filename?: string;
  mimeType?: string;
  fields?: Record<string, string>;
  auth?: boolean;
  timeoutMs?: number;
}): Promise<T> {
  const FS = await import("expo-file-system");
  const url = buildUrl(params.path, params.query);
  const headers: Record<string, string> = params.auth ? authHeaders() : {};
  const result = await FS.uploadAsync(url, params.fileUri, {
    httpMethod: "POST",
    uploadType: FS.FileSystemUploadType.MULTIPART,
    fieldName: params.fieldName ?? "file",
    mimeType: params.mimeType,
    parameters: params.fields,
    headers
  });
  if (result.status === 401) unauthorizedListeners.forEach((fn) => fn());
  let data: any = {};
  try {
    data = result.body ? JSON.parse(result.body) : {};
  } catch {
    throw new ApiError(`The server returned an invalid upload response (${result.status}).`, result.status);
  }
  if (result.status < 200 || result.status >= 300) throw new ApiError(String(data.error || `Upload failed (${result.status}).`), result.status);
  if (data.success === false) throw new ApiError(String(data.error || "Upload failed."), result.status, data.code);
  return data as T;
}

/** Raw binary upload (used for profile avatar: body is the raw image bytes). */
export async function uploadBinary<T>(params: {
  path: string;
  query?: Record<string, string | undefined | null>;
  fileUri: string;
  mimeType: string;
  auth?: boolean;
}): Promise<T> {
  const FS = await import("expo-file-system");
  const url = buildUrl(params.path, params.query);
  const result = await FS.uploadAsync(url, params.fileUri, {
    httpMethod: "POST",
    uploadType: FS.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      "Content-Type": params.mimeType,
      ...(params.auth ? authHeaders() : {})
    }
  });
  let data: any = {};
  try {
    data = result.body ? JSON.parse(result.body) : {};
  } catch {
    throw new ApiError(`The server returned an invalid upload response (${result.status}).`, result.status);
  }
  if (result.status < 200 || result.status >= 300) throw new ApiError(String(data.error || `Upload failed (${result.status}).`), result.status);
  return data as T;
}

export { buildUrl as apiUrl };
