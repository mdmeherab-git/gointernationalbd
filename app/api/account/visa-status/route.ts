import { dbFirst } from "@/lib/cf";
import type { VisaStatusRow } from "@/lib/data";
import { requireUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

/* =========================================================
   GET /api/account/visa-status

   Read-only for the user — only Admin can change these
   values (see /api/admin/users/[id]/visa-status). Returns
   sensible defaults when no row exists yet (nothing set by
   Admin so far), so the timeline UI always has something to
   render instead of a hard "not found".
========================================================= */
export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const row = await dbFirst<VisaStatusRow>("SELECT * FROM visa_statuses WHERE user_id = ?", user.id);

  if (!row) {
    return Response.json({
      status: {
        medical_status: "not_started",
        visa_status: "not_started",
        flight_status: "not_scheduled",
        flight_date: "",
        flight_airline: "",
        flight_pnr: "",
        remarks: "",
        updated_at: null,
      },
    });
  }

  return Response.json({ status: row });
}
