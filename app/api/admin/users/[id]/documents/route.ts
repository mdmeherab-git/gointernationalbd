import { requireAdmin } from "@/lib/admin";
import { dbAll } from "@/lib/cf";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

type DocRow = {
  id: string;
  document_type: string;
  file_name: string;
  content_type: string;
  file_size: number;
  created_at: string;
};

/* =========================================================
   GET /api/admin/users/[id]/documents

   Admin view of one user's documents (passport saved from the
   CV builder, plus anything uploaded in My Documents). r2_key
   is never returned; bytes go through ./[docId] only.
========================================================= */
export async function GET(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const documents = await dbAll<DocRow>(
    `SELECT id, document_type, file_name, content_type, file_size, created_at
     FROM user_documents WHERE user_id = ? ORDER BY created_at DESC`,
    id,
  );

  return Response.json({ documents });
}
