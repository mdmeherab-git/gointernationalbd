import { dbFirst, dbRun, getUploads } from "@/lib/cf";
import { requireUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

type DocRow = { id: string; user_id: string; r2_key: string };

/* =========================================================
   DELETE /api/account/documents/[id]

   Only ever matches a row where user_id = the CALLER's own id
   — a user can never delete (or even discover the existence
   of) another user's document by guessing an id.
========================================================= */
export async function DELETE(req: Request, { params }: Ctx) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const { id } = await params;
  const existing = await dbFirst<DocRow>(
    "SELECT id, user_id, r2_key FROM user_documents WHERE id = ? AND user_id = ?",
    id,
    user.id,
  );
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  await dbRun("DELETE FROM user_documents WHERE id = ?", id);

  try {
    const bucket = await getUploads();
    if (bucket) await bucket.delete(existing.r2_key);
  } catch (error) {
    // Best-effort only — the D1 row is already gone either way.
    console.error("Document R2 cleanup failed for key", existing.r2_key, error);
  }

  return Response.json({ ok: true });
}
