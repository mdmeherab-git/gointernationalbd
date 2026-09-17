import { requireAdmin } from "@/lib/admin";
import { dbFirst, dbRun, getDb, getUploads, newId } from "@/lib/cf";
import { classifyAttachment, extensionFor, sizeLimitFor } from "@/lib/chat-upload";

export const dynamic = "force-dynamic";

/**
 * Legacy server-proxied admin attachment upload — kept as a fallback for
 * environments without S3-compatible R2 credentials (local dev against the
 * native Cloudflare binding). Production (Vercel) uses the presign/complete
 * direct-to-R2 flow instead, since Vercel rejects large request bodies.
 */
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    const conversationId = String(form.get("conversationId") || "");
    const requestedKind = String(form.get("kind") || "").toLowerCase();

    if (!conversationId) {
      return Response.json({ error: "Conversation পাওয়া যায়নি।" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return Response.json({ error: "একটি file নির্বাচন করুন।" }, { status: 400 });
    }

    if (!file.size) {
      return Response.json({ error: "Fileটি empty।" }, { status: 400 });
    }

    const conversation = await dbFirst<{ id: string }>(
      "SELECT id FROM chat_conversations WHERE id = ? LIMIT 1",
      conversationId,
    );
    if (!conversation) {
      return Response.json({ error: "Conversation পাওয়া যায়নি।" }, { status: 404 });
    }

    const kind = classifyAttachment(file.type, requestedKind);
    if (!kind) {
      return Response.json(
        { error: "এই file type এই attachment option-এর জন্য অনুমোদিত নয়।" },
        { status: 400 },
      );
    }

    const limit = sizeLimitFor(kind, file.type);
    if (file.size > limit) {
      const mb = Math.round(limit / (1024 * 1024));
      return Response.json({ error: `File সর্বোচ্চ ${mb}MB হতে পারবে।` }, { status: 413 });
    }

    const uploads = await getUploads();
    if (!uploads) {
      return Response.json({ error: "File storage এখনো configured নেই।" }, { status: 503 });
    }

    const extension = extensionFor(file.name, file.type);
    const key = `chat/${conversationId}/${newId("file")}.${extension}`;

    await uploads.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });

    const messageId = newId("msg");
    const displayMessage = kind === "audio" ? "Voice message" : file.name;

    try {
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
        file.name,
        file.type || "application/octet-stream",
        file.size,
        kind,
      );

      await dbRun(
        `
          UPDATE chat_conversations
          SET user_deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        conversationId,
      );
    } catch (dbError) {
      try {
        await uploads.delete(key);
      } catch {
        // Best-effort cleanup.
      }
      throw dbError;
    }

    return Response.json({ ok: true, messageId, kind, name: file.name });
  } catch (error) {
    console.error("Admin chat upload error:", error);
    return Response.json({ error: "File upload করা যায়নি।" }, { status: 500 });
  }
}
