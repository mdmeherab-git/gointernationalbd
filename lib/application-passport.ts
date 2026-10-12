import "server-only";
import { dbAll, dbRun } from "./cf";

/** Optional passport copy attached to a job application (private in R2). */

export const MAX_PASSPORT_SIZE = 20 * 1024 * 1024;

export const PASSPORT_EXT_FOR_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export const PASSPORT_MIME_FOR_EXT: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  png: "image/png",
};

// Keys live under applications/ so the public /api/files route (flat keys
// only) can never serve them; only the admin route below can.
export const PASSPORT_KEY_PATTERN =
  /^applications\/passport-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|jpg|png)$/;

export function passportExt(key: string): string {
  return key.split(".").pop() || "";
}

let columnsEnsured = false;

/** Add the passport columns on first use so no manual migration is needed. */
export async function ensurePassportColumns(): Promise<void> {
  if (columnsEnsured) return;
  const cols = await dbAll<{ name: string }>("PRAGMA table_info(applications)");
  const have = new Set(cols.map((c) => c.name));
  if (!have.has("passport_key")) {
    await dbRun("ALTER TABLE applications ADD COLUMN passport_key TEXT");
  }
  if (!have.has("passport_name")) {
    await dbRun("ALTER TABLE applications ADD COLUMN passport_name TEXT");
  }
  columnsEnsured = true;
}
