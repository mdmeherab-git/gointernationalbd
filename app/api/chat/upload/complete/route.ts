import { NextResponse } from "next/server";
import { dbRun, getUploads, newId } from "@/lib/cf";
import { classifyAttachment, sizeLimitFor } from "@/lib/chat-upload";
import {
  GUEST_COOKIE,
  getCookie,
  getLoggedInUserId,
  getOrCreateConversation,
  newGuestId,
} from "@/lib/chat-conversation";

export const dynamic = "force-dynamic";

/**
 * Step 2 of the direct-to-R2 upload flow: called only after the browser's
 * PUT to the presigned URL succeeds. Verifies the object actually exists in
 * R2 (via HEAD, using R2's own reported size — never trusting the client)
 * before writing the chat_messages row, so a failed or abandoned upload can
 * never produce an orphan attachment record.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      key?: unknown;
      name?: unknown;
      mime?: unknown;
      kind?: unknown;
    } | null;

    const key = typeof body?.key === "string" ? body.key : "";
    const name = typeof body?.name === "string" && body.name ? body.name : "attachment";
    const mime =
      typeof body?.mime === "string" && body.mime ? body.mime : "application/octet-stream";
    const requestedKind = typeof body?.kind === "string" ? body.kind.toLowerCase() : "";

    if (!key) {
      return NextResponse.json({ error: "Invalid upload reference." }, { status: 400 });
    }

    const kind = classifyAttachment(mime, requestedKind);
    if (!kind) {
      return NextResponse.json(
        { error: "এই file type এই attachment option-এর জন্য অনুমোদিত নয়।" },
        { status: 400 },
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

    // The key must belong to THIS caller's own conversation — prevents
    // completing an upload against someone else's conversation.
    if (!key.startsWith(`chat/${conversation.id}/`)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const uploads = await getUploads();
    if (!uploads) {
      return NextResponse.json({ error: "File storage configured নেই।" }, { status: 503 });
    }

    const head = await uploads.head(key);
    if (!head) {
      return NextResponse.json(
        { error: "File upload সম্পূর্ণ হয়নি, আবার চেষ্টা করুন।" },
        { status: 400 },
      );
    }

    const realSize = head.size;
    const limit = sizeLimitFor(kind, mime);
    if (realSize > limit) {
      try {
        await uploads.delete(key);
      } catch {
        // Best-effort cleanup of the oversized object.
      }
      const mb = Math.round(limit / (1024 * 1024));
      return NextResponse.json({ error: `File সর্বোচ্চ ${mb}MB হতে পারবে।` }, { status: 413 });
    }

    const messageId = newId("msg");
    const displayMessage = kind === "audio" ? "Voice message" : name;

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
      name,
      mime,
      realSize,
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

    const response = NextResponse.json({ ok: true, messageId, kind, name });

    if (shouldSetGuestCookie) {
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
  } catch (error) {
    console.error("Chat upload complete error:", error);
    return NextResponse.json({ error: "File upload করা যায়নি।" }, { status: 500 });
  }
}
