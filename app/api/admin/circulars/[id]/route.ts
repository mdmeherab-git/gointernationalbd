import { requireAdmin } from "@/lib/admin";
import { dbFirst, dbRun, getDb } from "@/lib/cf";
import { pickUpdate, readJson } from "@/lib/crud";
import { circularRowToApi, type CircularRow } from "@/lib/data";
import { CIRCULAR_FIELDS } from "@/lib/schemas";

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
  const { setSql, values, count } = pickUpdate(CIRCULAR_FIELDS, body);
  if (!count)
    return Response.json({ error: "No valid fields to update" }, { status: 400 });

  await dbRun(
    `UPDATE circulars SET ${setSql}, updated_at = datetime('now') WHERE id = ?`,
    ...values,
    id,
  );

  const row = await dbFirst<CircularRow>(
    "SELECT * FROM circulars WHERE id = ?",
    id,
  );
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ circular: circularRowToApi(row) });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db)
    return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  await dbRun("DELETE FROM circulars WHERE id = ?", id);
  return Response.json({ ok: true });
}
