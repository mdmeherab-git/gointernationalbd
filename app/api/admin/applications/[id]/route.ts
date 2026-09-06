import { requireAdmin } from "@/lib/admin";
import { dbFirst, dbRun, getDb } from "@/lib/cf";
import { readJson } from "@/lib/crud";
import { APPLICATION_STATUS } from "@/lib/schemas";
import type { ApplicationRow } from "../route";

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
  const status = String(body.status ?? "");
  if (!APPLICATION_STATUS.includes(status as (typeof APPLICATION_STATUS)[number])) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  await dbRun("UPDATE applications SET status = ? WHERE id = ?", status, id);
  const row = await dbFirst<ApplicationRow>(
    "SELECT * FROM applications WHERE id = ?",
    id,
  );
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ application: row });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db)
    return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  await dbRun("DELETE FROM applications WHERE id = ?", id);
  return Response.json({ ok: true });
}
