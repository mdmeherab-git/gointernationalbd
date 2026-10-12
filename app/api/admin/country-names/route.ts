import { requireAdmin } from "@/lib/admin";
import { dbRun, getDb } from "@/lib/cf";
import { asText, readJson } from "@/lib/crud";
import { countries } from "@/app/countries";
import {
  ensureCountryNamesTable,
  readCountryNames,
} from "@/lib/country-names-db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ names: {}, dbReady: false });
  return Response.json({ names: await readCountryNames(), dbReady: true });
}

/** Body: { code, nameBn } — an empty nameBn removes the customisation. */
export async function PUT(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db)
    return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const body = await readJson(req);
  const code = asText(body.code).toLowerCase().trim();
  const nameBn = asText(body.nameBn).trim().slice(0, 80);

  if (!countries.some((c) => c.code === code)) {
    return Response.json({ error: "Unknown country code" }, { status: 400 });
  }

  await ensureCountryNamesTable();
  if (!nameBn) {
    await dbRun("DELETE FROM country_names WHERE code = ?", code);
  } else {
    await dbRun(
      "INSERT INTO country_names (code, name_bn, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(code) DO UPDATE SET name_bn = excluded.name_bn, updated_at = datetime('now')",
      code,
      nameBn,
    );
  }
  return Response.json({ ok: true, names: await readCountryNames() });
}
