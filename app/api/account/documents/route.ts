import { dbAll, dbRun, getUploads, newId } from "@/lib/cf";
import {
  EXT_FOR_MIME,
  MAX_DOCUMENT_SIZE,
  isAllowedDocumentType,
  parseDocumentType,
} from "@/lib/user-upload";
import { requireUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

type UserDocumentRow = {
  id: string;
  document_type: string;
  file_name: string;
  content_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
};

/* =========================================================
   GET /api/account/documents

   Lists the CURRENT session user's OWN documents. Never
   includes r2_key — that stays server-side only, exposed to
   the browser solely through the scoped
   /api/account/documents/[id]/file route.
========================================================= */
export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const rows = await dbAll<UserDocumentRow>(
    `SELECT id, document_type, file_name, content_type, file_size, created_at, updated_at
     FROM user_documents WHERE user_id = ? ORDER BY created_at DESC`,
    user.id,
  );

  return Response.json({ documents: rows });
}

/* =========================================================
   POST /api/account/documents

   Legacy server-proxied upload — kept as a fallback for
   environments without S3-compatible R2 credentials (local
   dev against the native Cloudflare binding), mirroring
   app/api/chat/upload/route.ts. Production uses the
   presign/complete direct-to-R2 flow instead.
========================================================= */
export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const bucket = await getUploads();
  if (!bucket) {
    return Response.json({ error: "File storage configured নেই।" }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  const documentType = parseDocumentType(form.get("documentType"));

  if (!(file instanceof File)) {
    return Response.json({ error: "একটি file নির্বাচন করুন।" }, { status: 400 });
  }
  if (!documentType) {
    return Response.json({ error: "Document type নির্বাচন করুন।" }, { status: 400 });
  }
  if (!isAllowedDocumentType(file.type)) {
    return Response.json({ error: "এই file type অনুমোদিত নয়" }, { status: 415 });
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return Response.json({ error: "Document সর্বোচ্চ 10MB হতে পারবে" }, { status: 413 });
  }

  const key = `users/${user.id}/documents/${newId("doc")}.${EXT_FOR_MIME[file.type] ?? "bin"}`;

  try {
    await bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
  } catch (error) {
    console.error("Document upload R2 error:", error);
    return Response.json({ error: "File upload করা যায়নি।" }, { status: 500 });
  }

  const id = newId("doc");
  await dbRun(
    `INSERT INTO user_documents (id, user_id, document_type, file_name, r2_key, content_type, file_size)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    user.id,
    documentType,
    file.name,
    key,
    file.type,
    file.size,
  );

  return Response.json({ ok: true, id });
}
