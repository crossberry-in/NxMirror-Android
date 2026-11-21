export function formatBytes(value: number | string | null | undefined): string {
  const bytes = Number(value || 0);
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
}

export function formatCount(value: number | string | null | undefined): string {
  const n = Number(value || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function formatWhen(value: string | number | null | undefined): string {
  const time = typeof value === "number" ? value : Date.parse(String(value || ""));
  if (!time || Number.isNaN(time)) return "—";
  const diff = Date.now() - time;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 30 * 86400000) return `${Math.floor(diff / 86400000)}d ago`;
  try {
    return new Date(time).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

export function formatDate(value: string | number | null | undefined): string {
  const time = typeof value === "number" ? value : Date.parse(String(value || ""));
  if (!time || Number.isNaN(time)) return "—";
  try {
    return new Date(time).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "—";
  }
}

export function fileKind(filename: string): "image" | "video" | "audio" | "pdf" | "archive" | "code" | "text" | "other" {
  const ext = filename.slice(filename.lastIndexOf(".") + 1).toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "svg", "heic", "ico"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "mkv", "avi", "m4v"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "m4a", "flac", "opus", "aac"].includes(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  if (["zip", "7z", "rar", "tar", "gz", "tgz", "xz", "bz2"].includes(ext)) return "archive";
  if (["js", "ts", "tsx", "jsx", "py", "sh", "sql", "json", "xml", "yaml", "yml", "css", "html", "kt", "java", "c", "cpp", "go", "rs"].includes(ext)) return "code";
  if (["txt", "md", "log", "csv"].includes(ext)) return "text";
  return "other";
}

export function mimeFromFilename(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf(".") + 1).toLowerCase();
  const map: Record<string, string> = {
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
    webp: "image/webp", svg: "image/svg+xml", mp4: "video/mp4", webm: "video/webm",
    mp3: "audio/mpeg", wav: "audio/wav", pdf: "application/pdf", txt: "text/plain",
    md: "text/markdown", csv: "text/csv", json: "application/json", zip: "application/zip",
    gz: "application/gzip", tgz: "application/gzip", tar: "application/x-tar",
    html: "text/html", css: "text/css", js: "text/javascript", ts: "text/typescript",
    apk: "application/vnd.android.package-archive"
  };
  return map[ext] || "application/octet-stream";
}

export function isReadableTextMime(mime: string): boolean {
  return (
    mime.startsWith("text/") ||
    ["application/json", "application/xml", "application/sql", "application/yaml", "text/x-python", "text/typescript", "text/javascript", "text/css"].includes(mime)
  );
}
