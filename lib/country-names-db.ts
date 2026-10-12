import "server-only";
import { dbAll, dbRun } from "./cf";

let ensured = false;

/** Create the table on first use so no manual migration is required. */
export async function ensureCountryNamesTable(): Promise<void> {
  if (ensured) return;
  await dbRun(
    "CREATE TABLE IF NOT EXISTS country_names (code TEXT PRIMARY KEY, name_bn TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  );
  ensured = true;
}

export async function readCountryNames(): Promise<Record<string, string>> {
  await ensureCountryNamesTable();
  const rows = await dbAll<{ code: string; name_bn: string }>(
    "SELECT code, name_bn FROM country_names",
  );
  const out: Record<string, string> = {};
  for (const r of rows) out[r.code] = r.name_bn;
  return out;
}
