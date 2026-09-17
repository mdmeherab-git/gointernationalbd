import "server-only";
import { dbFirst, dbRun, newId } from "@/lib/cf";

export const USER_COOKIE = "gib_user";
export const GUEST_COOKIE = "gib_chat_guest";

type SessionRow = {
  user_id: string;
  expires_at: string;
};

export type ConversationRow = {
  id: string;
  user_id: string | null;
  visitor_id: string | null;
  user_deleted_at: string | null;
};

export function getCookie(req: Request, name: string) {
  return (
    req.headers
      .get("cookie")
      ?.split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`))
      ?.split("=")
      .slice(1)
      .join("=") || ""
  );
}

export async function getLoggedInUserId(req: Request) {
  const sessionId = getCookie(req, USER_COOKIE);
  if (!sessionId) return null;

  const session = await dbFirst<SessionRow>(
    `
      SELECT user_id, expires_at
      FROM user_sessions
      WHERE id = ?
      LIMIT 1
    `,
    sessionId,
  );

  if (!session) return null;

  const expiresAt = new Date(session.expires_at).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

  return session.user_id;
}

export function newGuestId() {
  return `guest-${crypto.randomUUID()}`;
}

export async function getOrCreateConversation(
  userId: string | null,
  visitorId: string,
): Promise<ConversationRow> {
  let conversation: ConversationRow | null = null;

  if (userId) {
    conversation = await dbFirst<ConversationRow>(
      `
        SELECT id, user_id, visitor_id, user_deleted_at
        FROM chat_conversations
        WHERE user_id = ?
        LIMIT 1
      `,
      userId,
    );
  } else {
    conversation = await dbFirst<ConversationRow>(
      `
        SELECT id, user_id, visitor_id, user_deleted_at
        FROM chat_conversations
        WHERE visitor_id = ?
        LIMIT 1
      `,
      visitorId,
    );
  }

  if (!conversation) {
    const id = newId("chat");

    await dbRun(
      userId
        ? `
            INSERT INTO chat_conversations
              (id, user_id, visitor_id, status, ai_enabled)
            VALUES (?, ?, NULL, 'open', 1)
          `
        : `
            INSERT INTO chat_conversations
              (id, user_id, visitor_id, status, ai_enabled)
            VALUES (?, NULL, ?, 'open', 1)
          `,
      id,
      userId || visitorId,
    );

    conversation = await dbFirst<ConversationRow>(
      `
        SELECT id, user_id, visitor_id, user_deleted_at
        FROM chat_conversations
        WHERE id = ?
        LIMIT 1
      `,
      id,
    );
  }

  if (!conversation) throw new Error("Conversation could not be created");
  return conversation;
}
