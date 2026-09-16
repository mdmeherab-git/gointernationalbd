import { requireAdmin } from "@/lib/admin";
import { dbAll, dbFirst, dbRun, getDb, newId } from "@/lib/cf";
import { readJson } from "@/lib/crud";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const MAX_MESSAGE_LENGTH = 2000;

type ConversationRow = {
  id: string;
  user_id: string | null;
  visitor_id: string | null;
  status: "open" | "closed" | "archived";
  ai_enabled: number;
  admin_deleted_at: string | null;
  user_deleted_at: string | null;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  user_phone: string | null;
  user_email: string | null;
};

type MessageRow = {
  id: string;
  sender_type: "user" | "admin" | "ai";
  message: string;
  created_at: string;
  is_read: number;
  attachment_key: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
  attachment_size: number | null;
  attachment_kind: "document" | "media" | "audio" | null;
};

async function loadConversation(id: string) {
  return dbFirst<ConversationRow>(
    `
      SELECT
        c.id, c.user_id, c.visitor_id, c.status, c.ai_enabled,
        c.admin_deleted_at, c.user_deleted_at, c.created_at, c.updated_at,
        u.name AS user_name, u.phone AS user_phone, u.email AS user_email
      FROM chat_conversations c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.id = ?
      LIMIT 1
    `,
    id,
  );
}

export async function GET(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  const conversation = await loadConversation(id);
  if (!conversation) {
    return Response.json({ error: "Conversation পাওয়া যায়নি।" }, { status: 404 });
  }

  const messages = await dbAll<MessageRow>(
    `
      SELECT
        id, sender_type, message, created_at, is_read,
        attachment_key, attachment_name, attachment_mime,
        attachment_size, attachment_kind
      FROM chat_messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `,
    id,
  );

  await dbRun(
    `
      UPDATE chat_messages
      SET is_read = 1
      WHERE conversation_id = ? AND sender_type = 'user' AND is_read = 0
    `,
    id,
  );

  return Response.json({ conversation, messages });
}

export async function POST(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  const conversation = await loadConversation(id);
  if (!conversation) {
    return Response.json({ error: "Conversation পাওয়া যায়নি।" }, { status: 404 });
  }

  const body = await readJson(req);
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return Response.json({ error: "Message লিখুন।" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: `Message সর্বোচ্চ ${MAX_MESSAGE_LENGTH} characters হতে পারবে।` },
      { status: 400 },
    );
  }

  await dbRun(
    `
      INSERT INTO chat_messages
        (id, conversation_id, sender_type, sender_user_id, message, is_read)
      VALUES (?, ?, 'admin', NULL, ?, 0)
    `,
    newId("msg"),
    id,
    message,
  );

  // A fresh office reply is new activity for the user — re-surface the
  // thread on their side if they had soft-deleted it, mirroring how the
  // user's own new messages already clear user_deleted_at for themselves.
  await dbRun(
    `
      UPDATE chat_conversations
      SET user_deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    id,
  );

  return Response.json({ ok: true });
}

const ACTIONS = [
  "archive",
  "unarchive",
  "delete_for_me",
  "restore",
  "delete_conversation",
  "toggle_ai",
] as const;

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  const conversation = await loadConversation(id);
  if (!conversation) {
    return Response.json({ error: "Conversation পাওয়া যায়নি।" }, { status: 404 });
  }

  const body = await readJson(req);
  const action = String(body.action ?? "");
  if (!ACTIONS.includes(action as (typeof ACTIONS)[number])) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  if (action === "archive") {
    await dbRun("UPDATE chat_conversations SET status = 'archived' WHERE id = ?", id);
  } else if (action === "unarchive") {
    await dbRun("UPDATE chat_conversations SET status = 'open' WHERE id = ?", id);
  } else if (action === "delete_for_me") {
    await dbRun(
      "UPDATE chat_conversations SET admin_deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
      id,
    );
  } else if (action === "restore") {
    await dbRun("UPDATE chat_conversations SET admin_deleted_at = NULL WHERE id = ?", id);
  } else if (action === "delete_conversation") {
    await dbRun(
      `
        UPDATE chat_conversations
        SET admin_deleted_at = CURRENT_TIMESTAMP, user_deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      id,
    );
  } else if (action === "toggle_ai") {
    const value = body.value === true || body.value === 1;
    await dbRun("UPDATE chat_conversations SET ai_enabled = ? WHERE id = ?", value ? 1 : 0, id);
  }

  const updated = await loadConversation(id);
  return Response.json({ ok: true, conversation: updated });
}
