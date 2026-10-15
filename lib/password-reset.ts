import "server-only";
import { dbFirst, dbRun } from "./cf";

/* Admin-issued temporary passwords. A user listed in `password_resets` must
   replace their password before a session is created for them (enforced in
   /api/auth/login and /api/auth/set-password). The table is created on first
   use, like the other small helper tables. */

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await dbRun(
    `CREATE TABLE IF NOT EXISTS password_resets (
       user_id TEXT PRIMARY KEY,
       created_at TEXT NOT NULL DEFAULT (datetime('now'))
     )`,
  );
  tableReady = true;
}

export async function markMustChangePassword(userId: string): Promise<void> {
  await ensureTable();
  await dbRun(
    `INSERT INTO password_resets (user_id, created_at) VALUES (?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET created_at = excluded.created_at`,
    userId,
  );
}

export async function mustChangePassword(userId: string): Promise<boolean> {
  await ensureTable();
  const row = await dbFirst<{ user_id: string }>(
    "SELECT user_id FROM password_resets WHERE user_id = ?",
    userId,
  );
  return !!row;
}

export async function clearMustChangePassword(userId: string): Promise<void> {
  await ensureTable();
  await dbRun("DELETE FROM password_resets WHERE user_id = ?", userId);
}

// No look-alike characters (0/O, 1/l/I) so it can be read out or typed from
// a WhatsApp message without mistakes.
const TEMP_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateTempPassword(length = 10): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const b of bytes) out += TEMP_ALPHABET[b % TEMP_ALPHABET.length];
  return out;
}
