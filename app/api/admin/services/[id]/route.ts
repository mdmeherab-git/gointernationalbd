import { requireAdmin } from "@/lib/admin";
import { dbRun, getDb } from "@/lib/cf";
import { readJson } from "@/lib/crud";
import { getService, isValidServiceLink } from "@/lib/services";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const FIELDS: { key: string; column: string; max: number }[] = [
  { key: "title_bn", column: "title_bn", max: 80 },
  { key: "title_en", column: "title_en", max: 80 },
  { key: "desc_bn", column: "desc_bn", max: 240 },
  { key: "desc_en", column: "desc_en", max: 240 },
  { key: "icon", column: "icon", max: 8 },
  { key: "link_url", column: "link_url", max: 300 },
  { key: "button_bn", column: "button_bn", max: 40 },
  { key: "button_en", column: "button_en", max: 40 },
];

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  const existing = await getService(id);
  if (!existing) return Response.json({ error: "Service not found" }, { status: 404 });

  const body = await readJson(req);
  const sets: string[] = [];
  const values: unknown[] = [];

  for (const f of FIELDS) {
    if (typeof body[f.key] === "string") {
      const value = (body[f.key] as string).trim().slice(0, f.max);
      if (f.key === "link_url" && !isValidServiceLink(value)) {
        return Response.json(
          {
            error:
              "লিংক হতে হবে / দিয়ে শুরু (যেমন /jobs), https://..., tel:..., অথবা শুধু whatsapp / Link must start with /, https://, tel: or be 'whatsapp'",
          },
          { status: 400 },
        );
      }
      sets.push(`${f.column} = ?`);
      values.push(value);
    }
  }

  if (body.status === "active" || body.status === "inactive") {
    sets.push("status = ?");
    values.push(body.status);
  }

  if (!sets.length) return Response.json({ error: "No valid fields to update" }, { status: 400 });

  await dbRun(
    `UPDATE site_services SET ${sets.join(", ")}, updated_at = datetime('now') WHERE id = ?`,
    ...values,
    id,
  );

  return Response.json({ ok: true, service: await getService(id) });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  if (!(await getService(id))) return Response.json({ error: "Service not found" }, { status: 404 });

  await dbRun("DELETE FROM site_services WHERE id = ?", id);
  return Response.json({ ok: true });
}
