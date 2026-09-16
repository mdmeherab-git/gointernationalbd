import { requireAdmin } from "@/lib/admin";
import { dbAll, getDb } from "@/lib/cf";

export const dynamic = "force-dynamic";

export interface AdminConversationRow {
  id: string;
  user_id: string | null;
  visitor_id: string | null;
  status: "open" | "closed" | "archived";
  ai_enabled: number;
  admin_deleted_at: string | null;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  user_phone: string | null;
  user_email: string | null;
  last_message: string | null;
  last_message_at: string | null;
  last_message_kind: string | null;
  unread_count: number;
}

const STATUSES = ["open", "closed", "archived"] as const;

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ conversations: [], dbReady: false });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "all";
  const type = url.searchParams.get("type") || "all"; // all | guest | user
  const q = (url.searchParams.get("q") || "").trim();

  const where: string[] = ["c.admin_deleted_at IS NULL"];
  const params: unknown[] = [];

  if (STATUSES.includes(status as (typeof STATUSES)[number])) {
    where.push("c.status = ?");
    params.push(status);
  }

  if (type === "guest") {
    where.push("c.user_id IS NULL");
  } else if (type === "user") {
    where.push("c.user_id IS NOT NULL");
  }

  if (q) {
    where.push("(u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;

  const rows = await dbAll<AdminConversationRow>(
    `
      SELECT
        c.id, c.user_id, c.visitor_id, c.status, c.ai_enabled,
        c.admin_deleted_at, c.created_at, c.updated_at,
        u.name AS user_name, u.phone AS user_phone, u.email AS user_email,
        (SELECT message FROM chat_messages m WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM chat_messages m WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
        (SELECT attachment_kind FROM chat_messages m WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC LIMIT 1) AS last_message_kind,
        (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id
          AND m.sender_type = 'user' AND m.is_read = 0) AS unread_count
      FROM chat_conversations c
      LEFT JOIN users u ON u.id = c.user_id
      ${whereSql}
      ORDER BY c.updated_at DESC
    `,
    ...params,
  );

  return Response.json({ conversations: rows, dbReady: true });
}
