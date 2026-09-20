import { dbRun, getUploads, newId } from "@/lib/cf";
import { isAllowedDocumentType, MAX_DOCUMENT_SIZE, parseDocumentType } from "@/lib/user-upload";
import { requireUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

/**
 * Step 2 of the direct-to-R2 upload flow: called only after the browser's
 * PUT to the presigned URL succeeds. Verifies the object actually exists
 * (via HEAD, using R2's own reported size — never trusting the client)
 * before writing the user_documents row, and that the key belongs to the
 * caller's own document folder before accepting it.
 */
export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const body = (await req.json().catch(() => null)) as {
      key?: unknown;
      fileName?: unknown;
      mime?: unknown;
      documentType?: unknown;
    } | null;

    const key = typeof body?.key === "string" ? body.key : "";
    const fileName = typeof body?.fileName === "string" && body.fileName ? body.fileName : "document";
    const mime = typeof body?.mime === "string" && body.mime ? body.mime : "application/octet-stream";
    const documentType = parseDocumentType(body?.documentType);

    if (!key || !documentType) {
      return Response.json({ error: "Invalid upload reference." }, { status: 400 });
    }

    if (!key.startsWith(`users/${user.id}/documents/`)) {
      return Response.json({ error: "Forbidden." }, { status: 403 });
    }

    if (!isAllowedDocumentType(mime)) {
      return Response.json({ error: "এই file type অনুমোদিত নয়" }, { status: 415 });
    }

    const uploads = await getUploads();
    if (!uploads) {
      return Response.json({ error: "File storage configured নেই।" }, { status: 503 });
    }

    const head = await uploads.head(key);
    if (!head) {
      return Response.json({ error: "File upload সম্পূর্ণ হয়নি, আবার চেষ্টা করুন।" }, { status: 400 });
    }

    const realSize = head.size;
    if (realSize > MAX_DOCUMENT_SIZE) {
      try {
        await uploads.delete(key);
      } catch {
        // Best-effort cleanup of the oversized object.
      }
      return Response.json({ error: "Document সর্বোচ্চ 10MB হতে পারবে" }, { status: 413 });
    }

    const id = newId("doc");
    await dbRun(
      `INSERT INTO user_documents (id, user_id, document_type, file_name, r2_key, content_type, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      user.id,
      documentType,
      fileName,
      key,
      mime,
      realSize,
    );

    return Response.json({ ok: true, id });
  } catch (error) {
    console.error("Document upload complete error:", error);
    return Response.json({ error: "File upload করা যায়নি।" }, { status: 500 });
  }
}
