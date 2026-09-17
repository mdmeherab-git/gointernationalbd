import { requireAdmin } from "@/lib/admin";
import { createPresignedUploadUrl, dbFirst, getDb, newId } from "@/lib/cf";
import { classifyAttachment, extensionFor, sizeLimitFor } from "@/lib/chat-upload";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  try {
    const body = (await req.json().catch(() => null)) as {
      conversationId?: unknown;
      fileName?: unknown;
      mime?: unknown;
      size?: unknown;
      kind?: unknown;
    } | null;

    const conversationId =
      typeof body?.conversationId === "string" ? body.conversationId : "";
    const fileName = typeof body?.fileName === "string" ? body.fileName : "";
    const mime = typeof body?.mime === "string" ? body.mime : "";
    const size = typeof body?.size === "number" ? body.size : 0;
    const requestedKind = typeof body?.kind === "string" ? body.kind.toLowerCase() : "";

    if (!conversationId || !fileName || !mime || !size) {
      return Response.json({ error: "Invalid upload request." }, { status: 400 });
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

    const limit = sizeLimitFor(kind, mime);
    if (size > limit) {
      const mb = Math.round(limit / (1024 * 1024));
      return Response.json({ error: `File সর্বোচ্চ ${mb}MB হতে পারবে।` }, { status: 413 });
    }

    const extension = extensionFor(fileName, mime);
    const key = `chat/${conversationId}/${newId("file")}.${extension}`;
    const uploadUrl = await createPresignedUploadUrl(key, mime);

    return Response.json(uploadUrl ? { mode: "direct", uploadUrl, key } : { mode: "proxy" });
  } catch (error) {
    console.error("Admin chat upload presign error:", error);
    return Response.json({ error: "Upload prepare করা যায়নি।" }, { status: 500 });
  }
}
