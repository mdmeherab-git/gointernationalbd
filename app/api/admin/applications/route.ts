import { requireAdmin } from "@/lib/admin";
import { dbAll, dbFirst, getDb } from "@/lib/cf";
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
  user_id: string | null;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) {
    return Response.json({
      applications: [],
      total: 0,
      page: 1,
      limit: DEFAULT_LIMIT,
      dbReady: false,
    });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const q = (url.searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT),
  );

  const where: string[] = [];
  const params: unknown[] = [];

  if (status && APPLICATION_STATUS.includes(status as (typeof APPLICATION_STATUS)[number])) {
    where.push("status = ?");
    params.push(status);
  }

  if (q) {
    where.push("(applicant_name LIKE ? OR phone LIKE ? OR email LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countRow = await dbFirst<{ total: number }>(
    `SELECT COUNT(*) AS total FROM applications ${whereSql}`,
    ...params,
  );
  const total = countRow?.total ?? 0;

  const offset = (page - 1) * limit;
  const rows = await dbAll<ApplicationRow>(
    `
      SELECT * FROM applications
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
    ...params,
    limit,
    offset,
  );

  return Response.json({ applications: rows, total, page, limit, dbReady: true });
}
