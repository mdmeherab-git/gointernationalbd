import "server-only";
import { CIRCULAR_FILE_TYPES, EXT_FOR_MIME } from "./admin-upload";

/**
 * Validation for user-initiated document uploads (Account Center ->
 * My Documents). Mirrors lib/admin-upload.ts's shape but is gated by
 * requireUser instead of requireAdmin, and reuses the same image+PDF
 * allow-list circulars already use rather than defining a new one.
 */

export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

export const DOCUMENT_TYPES = [
  "passport",
  "cv",
  "photo",
  "nid",
  "medical_report",
  "visa_copy",
  "other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export function parseDocumentType(value: unknown): DocumentType | null {
  return DOCUMENT_TYPES.includes(value as DocumentType) ? (value as DocumentType) : null;
}

export function isAllowedDocumentType(mime: string): boolean {
  return CIRCULAR_FILE_TYPES.has(mime);
}

export { EXT_FOR_MIME };

// Server-generated keys only ever look like "doc-<uuid>.<ext>" (see
// newId("doc") in lib/cf.ts) — lets the complete step reject any key it
// didn't itself hand out via presign.
export const DOCUMENT_KEY_PATTERN =
  /^users\/[\w-]+\/documents\/doc-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp|gif|pdf)$/;
