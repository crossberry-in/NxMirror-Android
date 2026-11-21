import Constants from "expo-constants";

/**
 * Central NxMirror API configuration.
 *
 * The backend is the Demoapi project (https://github.com/crossberry-in/Demoapi),
 * deployed at https://nxmirror.netlify.app — every endpoint used by this app
 * is documented in docs/API-INTEGRATION.md.
 */
export const DEFAULT_API_BASE_URL =
  (Constants.expoConfig?.extra as { nxmirror?: { defaultApiBaseUrl?: string } | undefined })
    ?.nxmirror?.defaultApiBaseUrl ?? "https://nxmirror.netlify.app";

/** Hard limits enforced by the Demoapi backend — surfaced in the UI honestly. */
export const LIMITS = {
  /** POST /api/cloud/publish body base64 limit (4 MiB artifact). */
  publishMaxBytes: 4 * 1024 * 1024,
  /** POST /api/mirror?action=direct multipart limit (4 MiB). */
  directUploadMaxBytes: 4 * 1024 * 1024,
  /** Chunk size used for /api/mirror?action=chunk (server limit is 5 MiB). */
  uploadChunkBytes: 4 * 1024 * 1024,
  /** NxMirror account cloud-data document limit (PUT /api/cloud/data). */
  cloudDataMaxBytes: 500 * 1024
} as const;

export const REQUEST_TIMEOUT_MS = 30000;

export const APP = {
  name: "NxMirror",
  version: "1.0.0",
  build: "1",
  repositoryUrl: "https://github.com/crossberry-in/NxMirror-Android",
  backendRepositoryUrl: "https://github.com/crossberry-in/Demoapi",
  websiteUrl: "https://nxmirror.netlify.app"
} as const;
