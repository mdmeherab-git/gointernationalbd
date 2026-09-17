import { requireAdmin } from "@/lib/admin";
import { dbFirst, dbRun, getDb, getUploads, newId } from "@/lib/cf";
import { classifyAttachment, sizeLimitFor } from "@/lib/chat-upload";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  try {
    const body = (await req.json().catch(() => null)) as {
      conversationId?: unknown;
      key?: unknown;
      name?: unknown;
      mime?: unknown;
      kind?: unknown;
    } | null;

    const conversationId =
      typeof body?.conversationId === "string" ? body.conversationId : "";
    const key = typeof body?.key === "string" ? body.key : "";
    const name = typeof body?.name === "string" && body.name ? body.name : "attachment";
    const mime =
      typeof body?.mime === "string" && body.mime ? body.mime : "application/octet-stream";
    const requestedKind = typeof body?.kind === "string" ? body.kind.toLowerCase() : "";

    if (!conversationId || !key) {
      return Response.json({ error: "Invalid upload reference." }, { status: 400 });
    }

    if (!key.startsWith(`chat/${conversationId}/`)) {
      return Response.json({ error: "Forbidden." }, { status: 403 });
    }

    const conversation = await dbFirst<{ id: string }>(
      "SELECT id FROM chat_conversations WHERE id = ? LIMIT 1",
      conversationId,
    );
    if (!conversation) {
      return Response.json({ error: "Conversation পাওয়া যায়নি।" }, { status: 404 });
    }

    const kind = classifyAttachment(mime, requestedKind);
    if (!kind) {
      return Response.json(
        { error: "এই file type এই attachment option-এর জন্য অনুমোদিত নয়।" },
        { status: 400 },
      );
    }

    const uploads = await getUploads();
    if (!uploads) {
      return Response.json({ error: "File storage configured নেই।" }, { status: 503 });
    }

    const head = await uploads.head(key);
    if (!head) {
      return Response.json(
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
      return Response.json({ error: `File সর্বোচ্চ ${mb}MB হতে পারবে।` }, { status: 413 });
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
        VALUES (?, ?, 'admin', NULL, ?, 0, ?, ?, ?, ?, ?)
      `,
      messageId,
      conversationId,
      displayMessage,
      key,
      name,
      mime,
      realSize,
      kind,
    );

    // A fresh office attachment is new activity for the user — re-surface
    // the thread on their side if they had soft-deleted it, mirroring the
    // text-reply route.
    await dbRun(
      `
        UPDATE chat_conversations
        SET user_deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      conversationId,
    );

    return Response.json({ ok: true, messageId, kind, name });
  } catch (error) {
    console.error("Admin chat upload complete error:", error);
    return Response.json({ error: "File upload করা যায়নি।" }, { status: 500 });
  }
}
