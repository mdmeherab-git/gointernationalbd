import { NextResponse } from "next/server";
import { dbAll, dbFirst, dbRun, newId } from "@/lib/cf";

export const dynamic = "force-dynamic";

const USER_COOKIE = "gib_user";
const GUEST_COOKIE = "gib_chat_guest";
const MAX_MESSAGE_LENGTH = 2000;

type SessionRow = {
  user_id: string;
  expires_at: string;
};

type ConversationRow = {
  id: string;
  user_id: string | null;
  visitor_id: string | null;
  status: "open" | "archived" | "closed";
  ai_enabled: number;
  user_deleted_at: string | null;
  admin_deleted_at: string | null;
};

type MessageRow = {
  id: string;
  sender_type: "user" | "admin" | "ai";
  message: string;
  created_at: string;
  attachment_key: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
  attachment_size: number | null;
  attachment_kind: "document" | "media" | "audio" | null;
  is_read: number;
};

function getCookie(req: Request, name: string) {
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

async function getLoggedInUserId(req: Request) {
  const sessionId = getCookie(req, USER_COOKIE);

  if (!sessionId) {
    return null;
  }

  const session = await dbFirst<SessionRow>(
    `
      SELECT user_id, expires_at
      FROM user_sessions
      WHERE id = ?
      LIMIT 1
    `,
    sessionId,
  );

  if (!session) {
    return null;
  }

  const expiresAt = new Date(session.expires_at).getTime();

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return null;
  }

  return session.user_id;
}

function newGuestId() {
  return `guest-${crypto.randomUUID()}`;
}

async function getOrCreateConversation(
  userId: string | null,
  visitorId: string,
) {
  let conversation: ConversationRow | null = null;

  if (userId) {
    conversation = await dbFirst<ConversationRow>(
      `
        SELECT
          id,
          user_id,
          visitor_id,
          status,
          ai_enabled,
          user_deleted_at,
          admin_deleted_at
        FROM chat_conversations
        WHERE user_id = ?
        LIMIT 1
      `,
      userId,
    );
  } else {
    conversation = await dbFirst<ConversationRow>(
      `
        SELECT
          id,
          user_id,
          visitor_id,
          status,
          ai_enabled,
          user_deleted_at,
          admin_deleted_at
        FROM chat_conversations
        WHERE visitor_id = ?
        LIMIT 1
      `,
      visitorId,
    );
  }

  if (!conversation) {
    const id = newId("chat");

    if (userId) {
      await dbRun(
        `
          INSERT INTO chat_conversations
            (
              id,
              user_id,
              visitor_id,
              status,
              ai_enabled
            )
          VALUES (?, ?, NULL, 'open', 1)
        `,
        id,
        userId,
      );
    } else {
      await dbRun(
        `
          INSERT INTO chat_conversations
            (
              id,
              user_id,
              visitor_id,
              status,
              ai_enabled
            )
          VALUES (?, NULL, ?, 'open', 1)
        `,
        id,
        visitorId,
      );
    }

    conversation = await dbFirst<ConversationRow>(
      `
        SELECT
          id,
          user_id,
          visitor_id,
          status,
          ai_enabled,
          user_deleted_at,
          admin_deleted_at
        FROM chat_conversations
        WHERE id = ?
        LIMIT 1
      `,
      id,
    );
  }

  if (!conversation) {
    throw new Error("Conversation could not be created");
  }

  return conversation;
}

function setGuestCookie(
  response: NextResponse,
  guestId: string,
  shouldSet: boolean,
) {
  if (shouldSet) {
    response.cookies.set({
      name: GUEST_COOKIE,
      value: guestId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }

  return response;
}

export async function GET(req: Request) {
  try {
    const userId = await getLoggedInUserId(req);

    const url = new URL(req.url);

    const summaryOnly =
      url.searchParams.get("summary") === "1";

    const markRead =
      url.searchParams.get("read") === "1";

    let guestId = getCookie(req, GUEST_COOKIE);

    let shouldSetGuestCookie = false;

    if (!userId && !guestId && summaryOnly) {
      return NextResponse.json({
        authenticated: false,
        conversation: null,
        messages: [],
        unread: 0,
      });
    }

    if (!userId && !guestId) {
      guestId = newGuestId();
      shouldSetGuestCookie = true;
    }

    const conversation = await getOrCreateConversation(
      userId,
      guestId,
    );

    /*
     * If user deleted the chat, hide old messages
     * until the user sends a new message.
     */
    if (conversation.user_deleted_at) {
      const response = NextResponse.json({
        authenticated: Boolean(userId),

        conversation: {
          id: conversation.id,
          status: conversation.status,
          aiEnabled: Boolean(conversation.ai_enabled),
        },

        messages: [],
        unread: 0,
      });

      return setGuestCookie(
        response,
        guestId,
        shouldSetGuestCookie,
      );
    }

    const messages = summaryOnly
      ? []
      : await dbAll<MessageRow>(
          `
            SELECT
              id,
              sender_type,
              message,
              created_at,
              attachment_key,
              attachment_name,
              attachment_mime,
              attachment_size,
              attachment_kind,
              is_read
            FROM chat_messages
            WHERE conversation_id = ?
            ORDER BY created_at ASC
          `,
          conversation.id,
        );

    /*
     * Your current chat_messages table has one read column:
     * is_read
     *
     * We use it for messages received by the user.
     */
    const unreadRow = await dbFirst<{ count: number }>(
      `
        SELECT COUNT(*) AS count
        FROM chat_messages
        WHERE conversation_id = ?
          AND sender_type IN ('admin', 'ai')
          AND is_read = 0
      `,
      conversation.id,
    );

    const unread = Number(unreadRow?.count || 0);

    if (markRead) {
      await dbRun(
        `
          UPDATE chat_messages
          SET is_read = 1
          WHERE conversation_id = ?
            AND sender_type IN ('admin', 'ai')
        `,
        conversation.id,
      );
    }

    const response = NextResponse.json({
      authenticated: Boolean(userId),

      conversation: {
        id: conversation.id,
        status: conversation.status,
        aiEnabled: Boolean(conversation.ai_enabled),
      },

      messages,

      unread: markRead ? 0 : unread,
    });

    return setGuestCookie(
      response,
      guestId,
      shouldSetGuestCookie,
    );
  } catch (error) {
    console.error("Chat GET error:", error);

    return NextResponse.json(
      {
        error: "Chat load করা যায়নি।",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      message?: unknown;
    } | null;

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        {
          error: "Message লিখুন।",
        },
        {
          status: 400,
        },
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          error: `Message সর্বোচ্চ ${MAX_MESSAGE_LENGTH} characters হতে পারবে।`,
        },
        {
          status: 400,
        },
      );
    }

    const userId = await getLoggedInUserId(req);

    let guestId = getCookie(req, GUEST_COOKIE);

    let shouldSetGuestCookie = false;

    if (!userId && !guestId) {
      guestId = newGuestId();
      shouldSetGuestCookie = true;
    }

    const conversation = await getOrCreateConversation(
      userId,
      guestId,
    );

    await dbRun(
      `
        INSERT INTO chat_messages
          (
            id,
            conversation_id,
            sender_type,
            sender_user_id,
            message,
            is_read
          )
        VALUES (?, ?, 'user', ?, ?, 0)
      `,
      newId("msg"),
      conversation.id,
      userId,
      message,
    );

    await dbRun(
      `
        UPDATE chat_conversations
        SET
          status = 'open',
          user_deleted_at = NULL,
          admin_deleted_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      conversation.id,
    );

    const response = NextResponse.json({
      ok: true,
      conversationId: conversation.id,
    });

    return setGuestCookie(
      response,
      guestId,
      shouldSetGuestCookie,
    );
  } catch (error) {
    console.error("Chat POST error:", error);

    return NextResponse.json(
      {
        error: "Message পাঠানো যায়নি।",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getLoggedInUserId(req);

    const guestId = getCookie(
      req,
      GUEST_COOKIE,
    );

    if (!userId && !guestId) {
      return NextResponse.json(
        {
          error: "Conversation পাওয়া যায়নি।",
        },
        {
          status: 404,
        },
      );
    }

    const conversation =
      await getOrCreateConversation(
        userId,
        guestId,
      );

    await dbRun(
      `
        UPDATE chat_conversations
        SET
          user_deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      conversation.id,
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Chat DELETE error:", error);

    return NextResponse.json(
      {
        error: "Chat delete করা যায়নি।",
      },
      {
        status: 500,
      },
    );
  }
}