import { dbFirst, getUploads } from "@/lib/cf";
import { requireUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

type DocRow = {
  r2_key: string;
  file_name: string;
  content_type: string;
};

/* =========================================================
   GET /api/account/documents/[id]/file

   Streams a document's bytes — but ONLY when the row's
   user_id matches the CALLER's session. Documents are
   personal/sensitive (passport, NID, medical report), so
   unlike circulars/notices this is never a public route and
   the R2 key is never exposed to the browser directly.

   ?download=1 forces Content-Disposition: attachment with a
   safe filename; otherwise it's served inline for preview.
========================================================= */
export async function GET(req: Request, { params }: Ctx) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const { id } = await params;
  const row = await dbFirst<DocRow>(
    "SELECT r2_key, file_name, content_type FROM user_documents WHERE id = ? AND user_id = ?",
    id,
    user.id,
  );
  if (!row) return new Response("Not found", { status: 404 });

  const bucket = await getUploads();
  if (!bucket) return new Response("Not found", { status: 404 });

  const object = await bucket.get(row.r2_key);
  if (!object) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const download = url.searchParams.get("download") === "1";
  const headers: Record<string, string> = {
    "content-type": row.content_type || object.httpMetadata?.contentType || "application/octet-stream",
    "cache-control": "private, no-store",
  };
  if (download) {
    const safeName = row.file_name.replace(/[\r\n"]/g, "_");
    headers["content-disposition"] = `attachment; filename="${safeName}"`;
  }

  return new Response(object.body as ReadableStream, { headers });
}
