import { requireAdmin } from "@/lib/admin";
import { dbFirst, getUploads } from "@/lib/cf";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; docId: string }> };

/* =========================================================
   GET /api/admin/users/[id]/documents/[docId]

   Streams one of a user's documents to an admin. The row must
   belong to the user in the URL. Served inline for preview;
   ?download=1 forces a download with a safe filename.
========================================================= */
export async function GET(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id, docId } = await params;
  const row = await dbFirst<{ r2_key: string; file_name: string; content_type: string }>(
    "SELECT r2_key, file_name, content_type FROM user_documents WHERE id = ? AND user_id = ?",
    docId,
    id,
  );
  if (!row) return new Response("Not found", { status: 404 });

  const bucket = await getUploads();
  if (!bucket) return new Response("Not found", { status: 404 });

  const object = await bucket.get(row.r2_key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "content-type": row.content_type || object.httpMetadata?.contentType || "application/octet-stream",
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
  };
  if (new URL(req.url).searchParams.get("download") === "1") {
    const safeName = row.file_name.replace(/[\r\n"\\]/g, "_");
    headers["content-disposition"] = `attachment; filename="${safeName}"`;
  }

  return new Response(object.body as ReadableStream, { headers });
}
