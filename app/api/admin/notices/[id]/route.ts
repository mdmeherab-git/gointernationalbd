import { requireAdmin } from "@/lib/admin";
import { dbFirst, dbRun, getDb } from "@/lib/cf";
import { pickUpdate, readJson } from "@/lib/crud";
import type { NoticeRow } from "@/lib/data";
import { NOTICE_FIELDS } from "@/lib/schemas";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

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

  await dbRun(
    `UPDATE notices SET ${setSql}, updated_at = datetime('now') WHERE id = ?`,
    ...values,
    id,
  );

  const row = await dbFirst<NoticeRow>("SELECT * FROM notices WHERE id = ?", id);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ notice: row });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db)
    return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  await dbRun("DELETE FROM notices WHERE id = ?", id);
  return Response.json({ ok: true });
}
