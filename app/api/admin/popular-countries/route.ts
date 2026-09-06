import { requireAdmin } from "@/lib/admin";
import { dbAll, getDb, newId } from "@/lib/cf";
import { asBool01, asInt, asText, readJson } from "@/lib/crud";
import type { PopularCountryRow } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ countries: [], dbReady: false });

  const rows = await dbAll<PopularCountryRow>(
    "SELECT * FROM popular_countries ORDER BY sort_order ASC",
  );
  return Response.json({ countries: rows, dbReady: true });
}

/**
 * Replace the whole ordered list in one shot.
 * Body: { countries: [{ code, name, sortOrder, visible }] }
 */
export async function PUT(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db)
    return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const body = await readJson(req);
  const list = Array.isArray(body.countries) ? body.countries : [];
  if (list.length === 0) {
    return Response.json({ error: "countries array is required" }, { status: 400 });
  }

  const seen = new Set<string>();
  const statements = [db.prepare("DELETE FROM popular_countries")];
  list.forEach((raw, index) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    const code = asText(item.code).toLowerCase().trim();
    if (!code || seen.has(code)) return;
    seen.add(code);
    statements.push(
      db
        .prepare(
          "INSERT INTO popular_countries (id, code, name, sort_order, visible) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(
          asText(item.id) || newId("pc"),
          code,
          asText(item.name) || code.toUpperCase(),
          item.sortOrder != null ? asInt(item.sortOrder) : index + 1,
          item.visible == null ? 1 : asBool01(item.visible),
        ),
    );
  });

  await db.batch(statements);

  const rows = await dbAll<PopularCountryRow>(
    "SELECT * FROM popular_countries ORDER BY sort_order ASC",
  );
  return Response.json({ countries: rows });
}
