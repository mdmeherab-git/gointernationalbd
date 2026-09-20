import { dbFirst, dbRun } from "@/lib/cf";
import type { UserCvRow } from "@/lib/data";
import { requireUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

/* =========================================================
   GET /api/account/cv

   Returns the CURRENT session user's own saved CV data (the
   CV Builder is otherwise fully client-side) — never another
   user's, since identity comes only from the session cookie.
========================================================= */
export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const row = await dbFirst<UserCvRow>("SELECT * FROM user_cvs WHERE user_id = ?", user.id);
  if (!row) return Response.json({ data: null, updatedAt: null });

  let data: unknown = null;
  try {
    data = JSON.parse(row.data);
  } catch {
    data = null;
  }

  return Response.json({ data, updatedAt: row.updated_at });
}

/* =========================================================
   PUT /api/account/cv

   Upserts the CURRENT session user's CV data as a JSON blob.
========================================================= */
export async function PUT(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || !("data" in body)) {
    return Response.json({ error: "Invalid CV data" }, { status: 400 });
  }

  const json = JSON.stringify((body as { data: unknown }).data);
  if (json.length > 200_000) {
    return Response.json({ error: "CV data too large" }, { status: 413 });
  }

  await dbRun(
    `INSERT INTO user_cvs (user_id, data, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = datetime('now')`,
    user.id,
    json,
  );

  return Response.json({ ok: true });
}
