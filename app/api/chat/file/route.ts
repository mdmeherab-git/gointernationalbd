import { NextResponse } from "next/server";
import { dbFirst, getUploads } from "@/lib/cf";

export const dynamic = "force-dynamic";

const USER_COOKIE = "gib_user";
const GUEST_COOKIE = "gib_chat_guest";

type SessionRow = {
  user_id: string;
  expires_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  attachment_key: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
};

type ConversationRow = {
  id: string;
  user_id: string | null;
  visitor_id: string | null;
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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const messageId = url.searchParams.get("messageId") || "";
    const forceDownload = url.searchParams.get("download") === "1";
    if (!messageId) {
      return NextResponse.json({ error: "Message ID missing." }, { status: 400 });
    }

    const userId = await getLoggedInUserId(req);
    const guestId = getCookie(req, GUEST_COOKIE);
    if (!userId && !guestId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const message = await dbFirst<MessageRow>(
      `
        SELECT id, conversation_id, attachment_key,
               attachment_name, attachment_mime
        FROM chat_messages
        WHERE id = ?
        LIMIT 1
      `,
      messageId,
    );

    if (!message?.attachment_key) {
      return NextResponse.json({ error: "Attachment পাওয়া যায়নি।" }, { status: 404 });
    }

    const conversation = await dbFirst<ConversationRow>(
      `
        SELECT id, user_id, visitor_id
        FROM chat_conversations
        WHERE id = ?
        LIMIT 1
      `,
      message.conversation_id,
    );

    if (!conversation) {
      return NextResponse.json({ error: "Conversation পাওয়া যায়নি।" }, { status: 404 });
    }

    const allowed = userId
      ? conversation.user_id === userId
      : Boolean(guestId && conversation.visitor_id === guestId);

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const uploads = await getUploads();
    if (!uploads) {
      return NextResponse.json({ error: "File storage configured নেই।" }, { status: 503 });
    }

    const object = await uploads.get(message.attachment_key);
    if (!object) {
      return NextResponse.json({ error: "File পাওয়া যায়নি।" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set(
      "content-type",
      message.attachment_mime || object.httpMetadata?.contentType || "application/octet-stream",
    );
    if (object.size) headers.set("content-length", String(object.size));
    headers.set("cache-control", "private, max-age=3600");
    headers.set(
      "content-disposition",
      `${forceDownload ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(message.attachment_name || "attachment")}`,
    );

    return new NextResponse(object.body, { status: 200, headers });
  } catch (error) {
    console.error("Chat file GET error:", error);
    return NextResponse.json({ error: "Attachment load করা যায়নি।" }, { status: 500 });
  }
}
