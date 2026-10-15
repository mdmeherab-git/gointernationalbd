import { requireAdmin } from "@/lib/admin";
import { dbRun, getDb } from "@/lib/cf";
import { readJson } from "@/lib/crud";
import { ensureServicesTable } from "@/lib/services";

export const dynamic = "force-dynamic";

/* POST { ids: [...] } — the full list of service ids in the new display order. */
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const body = await readJson(req);
  const ids = Array.isArray(body.ids) ? body.ids.filter((v): v is string => typeof v === "string") : [];
  if (ids.length === 0 || ids.length > 200) {
    return Response.json({ error: "Invalid list" }, { status: 400 });
  }

  await ensureServicesTable();
  let order = 1;
  for (const id of ids) {
    await dbRun("UPDATE site_services SET sort_order = ? WHERE id = ?", order++, id);
  }

  return Response.json({ ok: true });
}
