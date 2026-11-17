import "server-only";
import { dbAll, dbRun } from "./cf";
import { DEFAULT_CHAT_WELCOME } from "./chat-welcome-default";

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
  if (!have.has("chat_welcome_message")) {
    // Existing sites keep showing the current welcome text until it is edited.
    await dbRun(
      `ALTER TABLE site_settings ADD COLUMN chat_welcome_message TEXT NOT NULL DEFAULT '${DEFAULT_CHAT_WELCOME}'`,
    );
  }
  // Jobs page "special notice" lines (one per line). Empty = built-in lines.
  if (!have.has("jobs_notice_bn")) {
    await dbRun("ALTER TABLE site_settings ADD COLUMN jobs_notice_bn TEXT NOT NULL DEFAULT ''");
  }
  if (!have.has("jobs_notice_en")) {
    await dbRun("ALTER TABLE site_settings ADD COLUMN jobs_notice_en TEXT NOT NULL DEFAULT ''");
  }
  ensured = true;
}
