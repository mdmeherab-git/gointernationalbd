import "server-only";
import { dbAll, getDb, getUploads, type R2Bucket } from "./cf";

/* Database backups.

   buildBackup()  exports every table to one JSON document.
   storeBackup()  saves such a document in the R2 bucket under backups/ (a
                  folder the public file route never serves) and keeps only the
                  newest KEEP copies.

   Left OUT on purpose: login sessions, one-time codes, rate-limit counters and
   password hashes, so a leaked backup file cannot be used to sign in. (After a
   restore, users would reset their passwords.) */

const SKIP_TABLES = new Set([
  "user_sessions",
  "user_otps",
  "rate_limits",
  "password_resets",
  "d1_migrations",
]);

const SKIP_COLUMNS: Record<string, string[]> = {
  users: ["password_hash"],
  staff_accounts: ["password_hash"],
};

const PAGE = 500;
const KEEP = 30;
const INDEX_KEY = "backups/index.json";
export const BACKUP_KEY_PATTERN = /^backups\/gib-backup-\d{4}-\d{2}-\d{2}-\d{4}\.json$/;

export type BackupEntry = {
  key: string;
  size: number;
  createdAt: string;
  tables: number;
  rows: number;
  trigger: "auto" | "manual";
};

const quote = (name: string) => `"${name.replace(/"/g, '""')}"`;

export async function buildBackup(): Promise<{
  json: string;
  tables: number;
  rows: number;
  createdAt: string;
}> {
  if (!(await getDb())) throw new Error("Database is not configured");

  const tableNames = (
    await dbAll<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name",
    )
  )
    .map((t) => t.name)
    .filter((name) => !SKIP_TABLES.has(name));

  const createdAt = new Date().toISOString();
  const tables: Record<string, { columns: string[]; rows: unknown[][] }> = {};
  let totalRows = 0;

  for (const name of tableNames) {
    const info = await dbAll<{ name: string }>(`PRAGMA table_info(${quote(name)})`);
    const skip = new Set(SKIP_COLUMNS[name] ?? []);
    const columns = info.map((c) => c.name).filter((c) => !skip.has(c));
    if (columns.length === 0) continue;

    const select = columns.map(quote).join(", ");
    const rows: unknown[][] = [];

    for (let offset = 0; ; offset += PAGE) {
      let batch: Record<string, unknown>[];
      try {
        batch = await dbAll<Record<string, unknown>>(
          `SELECT ${select} FROM ${quote(name)} ORDER BY rowid LIMIT ${PAGE} OFFSET ${offset}`,
        );
      } catch {
        // WITHOUT ROWID tables: fall back to the natural order.
        batch = await dbAll<Record<string, unknown>>(
          `SELECT ${select} FROM ${quote(name)} LIMIT ${PAGE} OFFSET ${offset}`,
        );
      }
      for (const row of batch) rows.push(columns.map((c) => row[c] ?? null));
      if (batch.length < PAGE) break;
    }

    tables[name] = { columns, rows };
    totalRows += rows.length;
  }

  const json = JSON.stringify({
    app: "gointernationalbd",
    createdAt,
    note: "Password hashes, login sessions, one-time codes and rate-limit counters are not included.",
    tables,
  });

  return { json, tables: Object.keys(tables).length, rows: totalRows, createdAt };
}

async function readText(bucket: R2Bucket, key: string): Promise<string | null> {
  const object = await bucket.get(key);
  if (!object) return null;
  return new Response(object.body as ReadableStream).text();
}

export async function listBackups(): Promise<BackupEntry[]> {
  const bucket = await getUploads();
  if (!bucket) return [];
  try {
    const text = await readText(bucket, INDEX_KEY);
    if (!text) return [];
    const parsed = JSON.parse(text) as { items?: BackupEntry[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

export async function storeBackup(trigger: "auto" | "manual"): Promise<BackupEntry> {
  const bucket = await getUploads();
  if (!bucket) throw new Error("File storage (R2) is not configured");

  const built = await buildBackup();

  // gib-backup-YYYY-MM-DD-HHmm.json (UTC)
  const stamp = built.createdAt.slice(0, 16).replace("T", "-").replace(":", "");
  const key = `backups/gib-backup-${stamp}.json`;

  await bucket.put(key, built.json, { httpMetadata: { contentType: "application/json" } });

  const entry: BackupEntry = {
    key,
    size: new TextEncoder().encode(built.json).length,
    createdAt: built.createdAt,
    tables: built.tables,
    rows: built.rows,
    trigger,
  };

  const items = [entry, ...(await listBackups()).filter((i) => i.key !== key)];
  const kept = items.slice(0, KEEP);
  const dropped = items.slice(KEEP);

  await bucket.put(INDEX_KEY, JSON.stringify({ items: kept }), {
    httpMetadata: { contentType: "application/json" },
  });

  for (const old of dropped) {
    try {
      await bucket.delete(old.key);
    } catch {
      /* the index no longer lists it; a leftover object is harmless */
    }
  }

  return entry;
}

export async function readStoredBackup(key: string): Promise<string | null> {
  if (!BACKUP_KEY_PATTERN.test(key)) return null;
  const bucket = await getUploads();
  if (!bucket) return null;
  return readText(bucket, key);
}
