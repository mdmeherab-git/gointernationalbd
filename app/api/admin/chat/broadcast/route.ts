import { requireAdmin } from "@/lib/admin";
import { dbAll, dbFirst, dbRun, getDb, newId } from "@/lib/cf";
import { readJson } from "@/lib/crud";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 2000;

/* =========================================================
   Admin broadcast: one Admin chat message sent to many registered
   users at once. It is an ordinary 'admin' message in each user's own
   chat thread (unread), so it shows as a notification on their chat
   icon and they read it by opening the chat.

   Audiences:
     all      every active registered user
     country  active users who applied for a job in that country
========================================================= */

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await dbRun(
    `CREATE TABLE IF NOT EXISTS chat_broadcasts (
       id TEXT PRIMARY KEY,
       message TEXT NOT NULL,
       audience TEXT NOT NULL,
       country TEXT NOT NULL DEFAULT '',
       recipients INTEGER NOT NULL DEFAULT 0,
       created_at TEXT NOT NULL DEFAULT (datetime('now'))
     )`,
  );
  tableReady = true;
}

const ACTIVE_USERS = "SELECT u.id FROM users u WHERE u.status = 'active'";

const COUNTRY_USERS = `
  SELECT u.id FROM users u
  WHERE u.status = 'active'
    AND u.id IN (
      SELECT a.user_id FROM applications a
      WHERE a.user_id IS NOT NULL
        AND LOWER(TRIM(a.job_country)) = LOWER(?)
    )`;

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  await ensureTable();

  const total = await dbFirst<{ count: number }>(
    "SELECT COUNT(*) AS count FROM users WHERE status = 'active'",
  );

  const countries = await dbAll<{ country: string; count: number }>(
    `SELECT TRIM(a.job_country) AS country, COUNT(DISTINCT a.user_id) AS count
       FROM applications a
       JOIN users u ON u.id = a.user_id
      WHERE u.status = 'active' AND TRIM(a.job_country) <> ''
      GROUP BY TRIM(a.job_country)
      ORDER BY count DESC, country ASC`,
  );

  const history = await dbAll<{
    id: string;
    message: string;
    audience: string;
    country: string;
    recipients: number;
    created_at: string;
  }>(
    "SELECT id, message, audience, country, recipients, created_at FROM chat_broadcasts ORDER BY created_at DESC LIMIT 20",
  );

  return Response.json({
    total: Number(total?.count ?? 0),
    countries,
    history,
  });
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const body = await readJson(req);
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const audience = body.audience === "country" ? "country" : "all";
  const country = typeof body.country === "string" ? body.country.trim() : "";

  if (!message) {
    return Response.json({ error: "বার্তা লিখুন / Write a message" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: `বার্তা সর্বোচ্চ ${MAX_MESSAGE_LENGTH} অক্ষরের হতে পারবে / Message is too long` },
      { status: 400 },
    );
  }
  if (audience === "country" && !country) {
    return Response.json({ error: "দেশ বেছে নিন / Choose a country" }, { status: 400 });
  }

  await ensureTable();

  const targets = audience === "country" ? COUNTRY_USERS : ACTIVE_USERS;
  const targetParams: unknown[] = audience === "country" ? [country] : [];

  const countRow = await dbFirst<{ count: number }>(
    `SELECT COUNT(*) AS count FROM (${targets})`,
    ...targetParams,
  );
  const recipients = Number(countRow?.count ?? 0);
  if (recipients === 0) {
    return Response.json(
      { error: "এই দলে কোনো ইউজার নেই / No users in this audience" },
      { status: 400 },
    );
  }

  // 1) Everyone in the audience needs a chat thread to receive it.
  await dbRun(
    `INSERT OR IGNORE INTO chat_conversations (id, user_id, visitor_id, status, ai_enabled)
     SELECT 'chat_' || lower(hex(randomblob(12))), t.id, NULL, 'open', 1
       FROM (${targets}) t
      WHERE NOT EXISTS (SELECT 1 FROM chat_conversations c WHERE c.user_id = t.id)`,
    ...targetParams,
  );

  // 2) The message itself, unread, from the office.
  await dbRun(
    `INSERT INTO chat_messages (id, conversation_id, sender_type, sender_user_id, message, is_read)
     SELECT 'msg_' || lower(hex(randomblob(12))), c.id, 'admin', NULL, ?, 0
       FROM chat_conversations c
      WHERE c.user_id IN (${targets})`,
    message,
    ...targetParams,
  );

  // 3) Bring back threads a user had deleted, so the message is visible.
  //    updated_at is left alone on purpose: a broadcast must not push
  //    every recipient to the top of the admin inbox.
  await dbRun(
    `UPDATE chat_conversations SET user_deleted_at = NULL
      WHERE user_id IN (${targets}) AND user_deleted_at IS NOT NULL`,
    ...targetParams,
  );

  await dbRun(
    "INSERT INTO chat_broadcasts (id, message, audience, country, recipients) VALUES (?, ?, ?, ?, ?)",
    newId("bc"),
    message,
    audience,
    audience === "country" ? country : "",
    recipients,
  );

  return Response.json({ ok: true, recipients });
}
