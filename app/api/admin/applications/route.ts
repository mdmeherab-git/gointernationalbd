import { requireAdmin } from "@/lib/admin";
import { dbAll, getDb } from "@/lib/cf";
import { APPLICATION_STATUS } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export interface ApplicationRow {
  id: string;
  circular_id: string | null;
  job_title: string;
  job_country: string;
  applicant_name: string;
  phone: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ applications: [], dbReady: false });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  let sql = "SELECT * FROM applications";
  const params: unknown[] = [];
  if (status && APPLICATION_STATUS.includes(status as (typeof APPLICATION_STATUS)[number])) {
    sql += " WHERE status = ?";
    params.push(status);
  }
  sql += " ORDER BY created_at DESC";

  const rows = await dbAll<ApplicationRow>(sql, ...params);
  return Response.json({ applications: rows, dbReady: true });
}
