import "server-only";
import { dbAll, dbFirst, dbRun, newId } from "./cf";

/* Security event log for the admin area (failed / successful logins,
   lockouts). The table is created on first use and old rows are pruned.
   Logging NEVER throws: a logging problem must not break a login. */

export type SecurityEventType =
  | "login_failed"
  | "login_success"
  | "lockout"
  | "blocked"
  | "user_password_reset"
  | "staff_change";

export type SecurityEvent = {
  id: string;
  type: SecurityEventType;
  ip: string;
  detail: string;
  created_at: string;
};

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await dbRun(
    `CREATE TABLE IF NOT EXISTS security_events (
       id TEXT PRIMARY KEY,
       type TEXT NOT NULL,
       ip TEXT NOT NULL,
       detail TEXT NOT NULL DEFAULT '',
       created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
     )`,
  );
  await dbRun(
    "CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at)",
  );
  tableReady = true;
}

export async function logSecurityEvent(
  type: SecurityEventType,
  ip: string,
  detail = "",
  options: { dedupeMinutes?: number } = {},
): Promise<void> {
  try {
    await ensureTable();

    // e.g. "blocked": record one entry per IP per window, not every request.
    if (options.dedupeMinutes) {
      const recent = await dbFirst<{ id: string }>(
        `SELECT id FROM security_events
          WHERE type = ? AND ip = ?
            AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ','now', ?)
          LIMIT 1`,
        type,
        ip,
        `-${options.dedupeMinutes} minutes`,
      );
      if (recent) return;
    }

    await dbRun(
      "INSERT INTO security_events (id, type, ip, detail) VALUES (?, ?, ?, ?)",
      newId("sec"),
      type,
      ip.slice(0, 64),
      detail.slice(0, 200),
    );

    // Keep 90 days; prune now and then rather than on every write.
    if (Math.random() < 0.05) {
      await dbRun(
        "DELETE FROM security_events WHERE created_at < strftime('%Y-%m-%dT%H:%M:%fZ','now','-90 days')",
      );
    }
  } catch {
    /* never break the request because of logging */
  }
}

export async function readSecurityEvents(limit = 200): Promise<SecurityEvent[]> {
  await ensureTable();
  return dbAll<SecurityEvent>(
    "SELECT id, type, ip, detail, created_at FROM security_events ORDER BY created_at DESC LIMIT ?",
    Math.min(500, Math.max(1, limit)),
  );
}

export type SecuritySummary = {
  failed24h: number;
  lockouts24h: number;
  success24h: number;
  uniqueIps24h: number;
};

export async function readSecuritySummary(): Promise<SecuritySummary> {
  await ensureTable();
  const row = await dbFirst<{
    failed: number | null;
    lockouts: number | null;
    success: number | null;
    ips: number | null;
  }>(
    `SELECT
       SUM(CASE WHEN type = 'login_failed' THEN 1 ELSE 0 END) AS failed,
       SUM(CASE WHEN type = 'lockout' THEN 1 ELSE 0 END)      AS lockouts,
       SUM(CASE WHEN type = 'login_success' THEN 1 ELSE 0 END) AS success,
       COUNT(DISTINCT CASE WHEN type IN ('login_failed','lockout') THEN ip END) AS ips
     FROM security_events
     WHERE created_at > strftime('%Y-%m-%dT%H:%M:%fZ','now','-24 hours')`,
  );
  return {
    failed24h: Number(row?.failed ?? 0),
    lockouts24h: Number(row?.lockouts ?? 0),
    success24h: Number(row?.success ?? 0),
    uniqueIps24h: Number(row?.ips ?? 0),
  };
}
