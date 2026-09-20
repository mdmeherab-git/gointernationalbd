import "server-only";

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

export type AdminUploadKind = "featured" | "circular" | "notice";

export const FEATURED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export const CIRCULAR_FILE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

export const EXT_FOR_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export function parseKind(value: unknown): AdminUploadKind | null {
  return value === "featured" || value === "circular" || value === "notice" ? value : null;
}

export function isAllowedType(kind: AdminUploadKind, mime: string): boolean {
  // Notice images use the same image-only allow-list as the featured image
  // (JPG/JPEG primarily, PNG/WebP/GIF already supported by the existing set).
  return (kind === "circular" ? CIRCULAR_FILE_TYPES : FEATURED_IMAGE_TYPES).has(mime);
}

// Server-generated keys only ever look like "up-<uuid>.<ext>" (see newId("up")
// in lib/cf.ts) — this pattern lets the complete step reject any key it
// didn't itself hand out via presign, without needing a separate DB record.
export const UPLOAD_KEY_PATTERN =
  /^up-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp|gif|pdf)$/;
