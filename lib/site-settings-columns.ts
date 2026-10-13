import "server-only";
import { dbAll, dbRun } from "./cf";

let ensured = false;

/** Add newer site_settings columns on first use so no manual migration is needed. */
export async function ensureSiteSettingsColumns(): Promise<void> {
  if (ensured) return;
  const cols = await dbAll<{ name: string }>("PRAGMA table_info(site_settings)");
  const have = new Set(cols.map((c) => c.name));
  if (!have.has("contact_whatsapp_message")) {
    await dbRun(
      "ALTER TABLE site_settings ADD COLUMN contact_whatsapp_message TEXT NOT NULL DEFAULT ''",
    );
  }
  ensured = true;
}
