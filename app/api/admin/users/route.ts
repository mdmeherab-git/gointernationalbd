import { requireAdmin } from "@/lib/admin";
import { dbAll, dbFirst, getDb } from "@/lib/cf";
import { USER_STATUS } from "@/lib/schemas";

export const dynamic = "force-dynamic";

/* =========================================================
   GET /api/admin/users

   Paginated, searchable list of registered users for the Admin
   dashboard. Never selects password_hash — only the columns the
   Registered Users table/detail view actually need.
========================================================= */

export interface AdminUserRow {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  profile_photo_key: string;
  passport_number: string;
  passport_issue: string;
  passport_expiry: string;
  status: string;
  phone_verified: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) {
    return Response.json({ users: [], total: 0, page: 1, limit: DEFAULT_LIMIT, dbReady: false });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT),
  );
  const status = url.searchParams.get("status") || "all";
  const q = (url.searchParams.get("q") || "").trim();

  const where: string[] = [];
  const params: unknown[] = [];

  if (USER_STATUS.includes(status as (typeof USER_STATUS)[number])) {
    where.push("status = ?");
    params.push(status);
  }

  if (q) {
    where.push("(name LIKE ? OR phone LIKE ? OR email LIKE ? OR passport_number LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countRow = await dbFirst<{ total: number }>(
    `SELECT COUNT(*) AS total FROM users ${whereSql}`,
    ...params,
  );
  const total = countRow?.total ?? 0;

  const offset = (page - 1) * limit;
  const rows = await dbAll<AdminUserRow>(
    `
      SELECT
        id, name, email, phone, profile_photo_key,
        passport_number, passport_issue, passport_expiry,
        status, phone_verified, created_at, updated_at
      FROM users
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
    ...params,
    limit,
    offset,
  );

  return Response.json({ users: rows, total, page, limit, dbReady: true });
}
