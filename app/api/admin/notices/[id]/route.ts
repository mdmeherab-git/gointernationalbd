import { requireAdmin } from "@/lib/admin";
import { dbFirst, dbRun, getDb, getUploads } from "@/lib/cf";
import { pickUpdate, readJson } from "@/lib/crud";
import type { NoticeRow } from "@/lib/data";
import { NOTICE_FIELDS } from "@/lib/schemas";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Notice images are uploaded via the shared /api/admin/upload flow and
// referenced as "/api/files/<key>" (same convention as circulars) — this
// reverses that to get the R2 key back for best-effort cleanup.
function r2KeyFromFilesUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith("/api/files/")) return null;
  try {
    return decodeURIComponent(url.slice("/api/files/".length));
  } catch {
    return null;
  }
}

async function deleteR2Image(url: string | null | undefined) {
  const key = r2KeyFromFilesUrl(url);
  if (!key) return;
  try {
    const uploads = await getUploads();
    if (uploads) await uploads.delete(key);
  } catch (error) {
    // Best-effort only — never let R2 cleanup block a D1 write.
    console.error("Notice image R2 cleanup failed for key", key, error);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db)
    return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  const body = await readJson(req);
  const { setSql, values, count } = pickUpdate(NOTICE_FIELDS, body);
  if (!count)
    return Response.json({ error: "No valid fields to update" }, { status: 400 });

  const previous = await dbFirst<NoticeRow>("SELECT * FROM notices WHERE id = ?", id);

  await dbRun(
    `UPDATE notices SET ${setSql}, updated_at = datetime('now') WHERE id = ?`,
    ...values,
    id,
  );

  const row = await dbFirst<NoticeRow>("SELECT * FROM notices WHERE id = ?", id);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  // A replaced or removed image should not leave the old file orphaned in R2.
  if (
    Object.prototype.hasOwnProperty.call(body, "image_url") &&
    previous?.image_url &&
    previous.image_url !== row.image_url
  ) {
    await deleteR2Image(previous.image_url);
  }

  return Response.json({ notice: row });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db)
    return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  const existing = await dbFirst<NoticeRow>("SELECT * FROM notices WHERE id = ?", id);

  await dbRun("DELETE FROM notices WHERE id = ?", id);

  if (existing?.image_url) {
    await deleteR2Image(existing.image_url);
  }

  return Response.json({ ok: true });
}
