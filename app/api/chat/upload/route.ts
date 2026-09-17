import { NextResponse } from "next/server";
import { dbFirst, dbRun, getUploads, newId } from "@/lib/cf";
import { classifyAttachment, extensionFor, sizeLimitFor } from "@/lib/chat-upload";

export const dynamic = "force-dynamic";

const USER_COOKIE = "gib_user";
const GUEST_COOKIE = "gib_chat_guest";

type SessionRow = {
  user_id: string;
  expires_at: string;
};

type ConversationRow = {
  id: string;
  user_id: string | null;
  visitor_id: string | null;
  user_deleted_at: string | null;
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

function newGuestId() {
  return `guest-${crypto.randomUUID()}`;
}

async function getOrCreateConversation(userId: string | null, visitorId: string) {
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

function setGuestCookie(response: NextResponse, guestId: string, shouldSet: boolean) {
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

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const requestedKind = String(form.get("kind") || "").toLowerCase();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "একটি file নির্বাচন করুন।" }, { status: 400 });
    }

    if (!file.size) {
      return NextResponse.json({ error: "Fileটি empty।" }, { status: 400 });
    }

    const kind = classifyAttachment(file.type, requestedKind);
    if (!kind) {
      return NextResponse.json(
        { error: "এই file type এই attachment option-এর জন্য অনুমোদিত নয়।" },
        { status: 400 },
      );
    }

    const limit = sizeLimitFor(kind, file.type);

    if (file.size > limit) {
      const mb = Math.round(limit / (1024 * 1024));
      return NextResponse.json(
        { error: `File সর্বোচ্চ ${mb}MB হতে পারবে।` },
        { status: 413 },
      );
    }

    const uploads = await getUploads();
    if (!uploads) {
      return NextResponse.json(
        { error: "File storage এখনো configured নেই।" },
        { status: 503 },
      );
    }

    const userId = await getLoggedInUserId(req);
    let guestId = getCookie(req, GUEST_COOKIE);
    let shouldSetGuestCookie = false;

    if (!userId && !guestId) {
      guestId = newGuestId();
      shouldSetGuestCookie = true;
    }

    const conversation = await getOrCreateConversation(userId, guestId);
    const extension = extensionFor(file.name, file.type);
    const key = `chat/${conversation.id}/${newId("file")}.${extension}`;

    await uploads.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });

    const messageId = newId("msg");
    const displayMessage =
      kind === "audio" ? "Voice message" : file.name;

    try {
      await dbRun(
        `
          INSERT INTO chat_messages
            (id, conversation_id, sender_type, sender_user_id, message,
             is_read,
             attachment_key, attachment_name, attachment_mime,
             attachment_size, attachment_kind)
          VALUES (?, ?, 'user', ?, ?, 0, ?, ?, ?, ?, ?)
        `,
        messageId,
        conversation.id,
        userId,
        displayMessage,
        key,
        file.name,
        file.type || "application/octet-stream",
        file.size,
        kind,
      );

      await dbRun(
        `
          UPDATE chat_conversations
          SET status = 'open',
              user_deleted_at = NULL,
              admin_deleted_at = NULL,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        conversation.id,
      );
    } catch (dbError) {
      try {
        await uploads.delete(key);
      } catch {
        // Best-effort cleanup.
      }
      throw dbError;
    }

    const response = NextResponse.json({
      ok: true,
      messageId,
      kind,
      name: file.name,
    });

    return setGuestCookie(response, guestId, shouldSetGuestCookie);
  } catch (error) {
    console.error("Chat upload error:", error);
    return NextResponse.json(
      { error: "File upload করা যায়নি।" },
      { status: 500 },
    );
  }
}
