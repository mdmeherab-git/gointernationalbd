import { requireAdmin } from "@/lib/admin";
import { dbFirst, dbRun, getDb } from "@/lib/cf";
import { pickUpdate, readJson } from "@/lib/crud";
import { settingsRowToApi, type SiteSettingsRow } from "@/lib/data";
import { SETTINGS_FIELDS } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const row = await dbFirst<SiteSettingsRow>(
    "SELECT * FROM site_settings WHERE id = 'main'",
  );
  return Response.json({ settings: settingsRowToApi(row), dbReady: (await getDb()) != null });
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db)
    return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const body = await readJson(req);
  const { setSql, values, count } = pickUpdate(SETTINGS_FIELDS, body);
  if (!count)
    return Response.json({ error: "No valid fields to update" }, { status: 400 });

  // Ensure the row exists, then update.
  await dbRun("INSERT OR IGNORE INTO site_settings (id) VALUES ('main')");
  await dbRun(
    `UPDATE site_settings SET ${setSql}, updated_at = datetime('now') WHERE id = 'main'`,
    ...values,
  );

  const row = await dbFirst<SiteSettingsRow>(
    "SELECT * FROM site_settings WHERE id = 'main'",
  );
  return Response.json({ settings: settingsRowToApi(row) });
}
