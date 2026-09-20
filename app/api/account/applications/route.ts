import { dbAll } from "@/lib/cf";
import { requireUser } from "@/lib/user-auth";
import type { ApplicationRow } from "@/app/api/admin/applications/route";

export const dynamic = "force-dynamic";

/* =========================================================
   GET /api/account/applications

   Returns the CURRENT session user's OWN job applications
   (matched by user_id, set at submission time — see
   /api/applications POST). Never another user's, since
   identity comes only from the session cookie.
========================================================= */
export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const rows = await dbAll<ApplicationRow>(
    "SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC",
    user.id,
  );

  return Response.json({ applications: rows });
}
