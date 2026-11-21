/**
 * NxMirror API data models — mirrors the real Demoapi backend responses
 * (verified against netlify/lib sources in crossberry-in/Demoapi).
 * Never invented: every field below exists in the backend code.
 */

/* ---------- auth ---------- */

export interface NxUser {
  id: string;
  username: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  user: NxUser;
  token: string;
}

export interface ApiToken {
  id: string;
  name: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
}

/* ---------- registry ---------- */

export type PackageKind = "package" | "plugin";

export interface RegistryPackage {
  owner: string;
  type: PackageKind;
  name: string;
  version: string;
  filename: string;
  size: number;
  sha256: string;
  description: string;
  tags: string[];
  license: string;
  visibility: "public" | "private";
  publishedAt: string;
  firstPublishedAt: string;
  versions: number;
  downloads: number;
  downloadUrl: string;
}

export interface RegistryStats {
  packages: number;
  plugins: number;
  versions: number;
  downloads: number;
  maintainers: number;
  updatedAt: string;
  latest: RegistryPackage[];
}

export interface RegistryTag {
  tag: string;
  count: number;
}

export interface RegistrySearchResponse {
  success: boolean;
  query: string;
  kind: string;
  sort: string;
  total: number;
  tags: RegistryTag[];
  items: RegistryPackage[];
}

export interface PackageVersion {
  version: string;
  visibility: "public" | "private";
  publishedAt: string;
  size: number;
  sha256: string;
  filename: string;
  downloadUrl: string;
}

export interface PackageDetailResponse {
  success: boolean;
  package: RegistryPackage & { readme: string };
  versions: PackageVersion[];
}

export interface MaintainerResponse {
  success: boolean;
  owner: string;
  stats: {
    packages: number;
    plugins: number;
    versions: number;
    downloads: number;
    lastPublishAt: string;
  };
  tags: RegistryTag[];
  items: RegistryPackage[];
}

export interface CloudPackageRecord {
  id: string;
  type: PackageKind;
  name: string;
  version: string;
  filename: string;
  size: number;
  sha256: string;
  downloadUrl: string;
  owner: string;
  visibility: "public" | "private";
  publishedAt: string;
  description?: string;
  license?: string;
  readme?: string;
  tags?: string[];
}

export interface PublishArtifactResponse {
  success: boolean;
  artifact: CloudPackageRecord;
}

/* ---------- cloud files (/api/mirror) ---------- */

export interface MirrorFile {
  id: string;
  filename: string;
  folder: string;
  shareUrl?: string;
  createdAt?: number | string;
  renamedAt?: number | string;
  size?: number;
  mime?: string;
  [key: string]: unknown;
}

export interface MirrorListResponse {
  path: string;
  directories: string[];
  files: MirrorFile[];
  partial?: boolean;
  warning?: string;
}

export interface MirrorProfile {
  profile: {
    displayName: string;
    bio: string;
    avatarData: string;
    avatarUpdatedAt: number | null;
  };
}

export interface UploadFinishResponse {
  ok: boolean;
  url: string;
  mirrorUrl: string;
  fileId: string;
  filename: string;
  folder: string;
  shareUrl?: string;
  result?: unknown;
}

/* ---------- git cloud (/api/git) ---------- */

export interface GitRepository {
  id: string;
  owner: string;
  name: string;
  description: string;
  visibility: "public" | "private";
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  stars: number;
  forks: number;
  features: string[];
  forkedFrom?: { owner: string; name: string };
}

export interface GitBranch {
  name: string;
  head: string | null;
  createdAt: string;
}

export interface GitTagRecord {
  name: string;
  target: string;
  createdAt: string;
}

export interface GitIssue {
  id: string;
  number: number;
  title: string;
  body: string;
  state: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitRelease {
  id: string;
  tagName: string;
  title: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  createdAt: string;
}

export interface GitFileMeta {
  path: string;
  blobKey: string;
  size: number;
  updatedAt: string;
  encoding: "text" | "base64";
  mime: string;
}

export interface GitCommit {
  id?: string;
  message: string;
  files?: string[];
  kind?: string;
  author?: string;
  createdAt: string;
  sha?: string;
  [key: string]: unknown;
}

export interface GitRepoDetailResponse {
  success: boolean;
  repository: GitRepository;
  starred: boolean;
  branches: GitBranch[];
  tags: GitTagRecord[];
  issues: GitIssue[];
  releases: GitRelease[];
  files: GitFileMeta[];
  commits: GitCommit[];
}

export interface GitFileContentResponse {
  success: boolean;
  path: string;
  content: string;
  encoding: "text" | "base64";
  mime: string;
  metadata: GitFileMeta;
}

/* ---------- NxDB (/api/db) ---------- */

export interface NxDbServiceInfo {
  success: boolean;
  service: string;
  name: string;
  version: string;
  apiBase: string;
  engines: string[];
  auth: string[];
  docs: string;
}

export interface NxDatabase {
  id: string;
  name: string;
  engine: "sqlite" | "nosql";
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  storage?: { backend: string; repo?: string | null; branch?: string | null };
  usage?: {
    apiRequests: number;
    queries: number;
    storageBytes: number;
  };
}

export interface NxDbOverview {
  databases: number;
  tables: number;
  records: number;
  storageBytes: number;
  sqlStorageBytes: number;
  objectStorageBytes: number;
  apiRequests: number;
  activity: Array<{ db: string; dbId: string; ts: number; action: string; detail: string }>;
}

export interface NxDbTableStats {
  name: string;
  type?: string;
  rows?: number;
  sizeBytes?: number;
  columns?: number;
  [key: string]: unknown;
}

export interface NxDbQueryResult {
  success: boolean;
  columns?: string[];
  rows?: unknown[][];
  mutation: boolean;
}

export interface NxDbStorageFile {
  id: string;
  filename: string;
  mime: string;
  size: number;
  backend: string;
  folder: string;
  checksum: string;
  public: boolean;
  versions: number;
  createdAt: number;
  updatedAt: number;
}

export interface NxDbStorageListResponse {
  success: boolean;
  folder: string;
  files: NxDbStorageFile[];
  folders: string[];
}

/* ---------- misc ---------- */

export interface HealthResponse {
  success: boolean;
  name: string;
  version: string;
  status: string;
}

export type ApiErrorShape = {
  status: number;
  message: string;
  code?: string;
};
