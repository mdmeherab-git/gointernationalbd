import "server-only";
import { dbAll, dbFirst, dbRun, newId } from "./cf";
import {
  cleanPermissions,
  type StaffPermission,
} from "./staff-permissions";

/* Staff accounts: employees the owner gives limited admin access. The table
   is created on first use. Only password HASHES are stored. */

export type StaffRow = {
  id: string;
  name: string;
  username: string;
  password_hash: string;
  permissions: string; // comma separated
  status: "active" | "disabled";
  created_at: string;
  last_login_at: string | null;
};

export type StaffPublic = {
  id: string;
  name: string;
  username: string;
  permissions: StaffPermission[];
  status: "active" | "disabled";
  created_at: string;
  last_login_at: string | null;
};

let tableReady = false;

export async function ensureStaffTable() {
  if (tableReady) return;
  await dbRun(
    `CREATE TABLE IF NOT EXISTS staff_accounts (
       id TEXT PRIMARY KEY,
       name TEXT NOT NULL,
       username TEXT NOT NULL UNIQUE,
       password_hash TEXT NOT NULL,
       permissions TEXT NOT NULL DEFAULT '',
       status TEXT NOT NULL DEFAULT 'active',
       created_at TEXT NOT NULL DEFAULT (datetime('now')),
       last_login_at TEXT
     )`,
  );
  tableReady = true;
}

export function parsePermissions(stored: string): StaffPermission[] {
  return cleanPermissions(stored.split(",").map((s) => s.trim()));
}

export function toPublic(row: StaffRow): StaffPublic {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    permissions: parsePermissions(row.permissions),
    status: row.status === "disabled" ? "disabled" : "active",
    created_at: row.created_at,
    last_login_at: row.last_login_at,
  };
}

export async function listStaff(): Promise<StaffPublic[]> {
  await ensureStaffTable();
  const rows = await dbAll<StaffRow>("SELECT * FROM staff_accounts ORDER BY created_at DESC");
  return rows.map(toPublic);
}

export async function getStaffById(id: string): Promise<StaffRow | null> {
  await ensureStaffTable();
  return dbFirst<StaffRow>("SELECT * FROM staff_accounts WHERE id = ? LIMIT 1", id);
}

export async function getStaffByUsername(username: string): Promise<StaffRow | null> {
  await ensureStaffTable();
  return dbFirst<StaffRow>(
    "SELECT * FROM staff_accounts WHERE username = ? LIMIT 1",
    username.trim().toLowerCase(),
  );
}

export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

export async function createStaff(input: {
  name: string;
  username: string;
  passwordHash: string;
  permissions: StaffPermission[];
}): Promise<StaffPublic> {
  await ensureStaffTable();
  const id = newId("staff").replace(/\./g, "-");
  await dbRun(
    "INSERT INTO staff_accounts (id, name, username, password_hash, permissions, status) VALUES (?, ?, ?, ?, ?, 'active')",
    id,
    input.name,
    input.username,
    input.passwordHash,
    input.permissions.join(","),
  );
  const row = await getStaffById(id);
  if (!row) throw new Error("Staff account could not be created");
  return toPublic(row);
}

export async function touchStaffLogin(id: string): Promise<void> {
  await dbRun("UPDATE staff_accounts SET last_login_at = datetime('now') WHERE id = ?", id);
}
