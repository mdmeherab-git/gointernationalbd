import "server-only";

export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;
export const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
export const MAX_AUDIO_SIZE = 15 * 1024 * 1024;

export const DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/vnd.rar",
]);

export const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/mpeg",
]);

export const AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
]);

export type AttachmentKind = "document" | "media" | "audio";

export function classifyAttachment(
  mime: string,
  requestedKind: string,
): AttachmentKind | null {
  if (requestedKind === "document" && DOCUMENT_TYPES.has(mime)) return "document";
  if (requestedKind === "media" && (IMAGE_TYPES.has(mime) || VIDEO_TYPES.has(mime))) return "media";
  if (requestedKind === "audio" && AUDIO_TYPES.has(mime)) return "audio";
  return null;
}

export function sizeLimitFor(kind: AttachmentKind, mime: string): number {
  if (kind === "document") return MAX_DOCUMENT_SIZE;
  if (kind === "audio") return MAX_AUDIO_SIZE;
  return IMAGE_TYPES.has(mime) ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
}

export function extensionFor(fileName: string, mime: string): string {
  const raw = fileName.split(".").pop()?.toLowerCase() || "";
  const safe = raw.replace(/[^a-z0-9]/g, "").slice(0, 10);
  if (safe) return safe;

  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "audio/webm": "webm",
  };
  return map[mime] || "bin";
}
