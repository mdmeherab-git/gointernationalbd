import "server-only";
import { getEnv } from "./cf";
import {
  ADMIN_COOKIE,
  STAFF_COOKIE,
  parseStaffToken,
  readCookie,
  verifySessionToken,
} from "./session";
import { apiPathRule, type StaffPermission } from "./staff-permissions";
import { getStaffById, parsePermissions } from "./staff";

/** True when the request carries a valid OWNER session cookie. */
export async function isAdminRequest(req: Request): Promise<boolean> {
  const { ADMIN_SESSION_SECRET } = await getEnv();
  const token = readCookie(req, ADMIN_COOKIE);
  return verifySessionToken(token, ADMIN_SESSION_SECRET);
}

export type AdminAccess =
  | { role: "owner" }
  | { role: "staff"; id: string; name: string; permissions: StaffPermission[] };

/** Who is calling: the owner, an active staff member, or nobody (null). The
 *  staff member's permissions are read from the database on every call. */
export async function getAdminAccess(req: Request): Promise<AdminAccess | null> {
  if (await isAdminRequest(req)) return { role: "owner" };

  const { ADMIN_SESSION_SECRET } = await getEnv();
  const staffId = await parseStaffToken(readCookie(req, STAFF_COOKIE), ADMIN_SESSION_SECRET);
  if (!staffId) return null;

  try {
    const row = await getStaffById(staffId);
    if (!row || row.status !== "active") return null;
    return {
      role: "staff",
      id: row.id,
      name: row.name,
      permissions: parsePermissions(row.permissions),
    };
  } catch {
    return null;
  }
}

/**
 * Guard for admin route handlers. Returns a 401/403 `Response` to return
 * early, or `null` when the caller may proceed.
 *
 * The owner can do everything. A staff member only gets through when the
 * path belongs to a section they were given (see apiPathRule); anything not
 * listed there is owner-only.
 */
export async function requireAdmin(req: Request): Promise<Response | null> {
  const access = await getAdminAccess(req);
  if (!access) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (access.role === "owner") return null;

  const { pathname } = new URL(req.url);
  const rule = apiPathRule(pathname, req.method);

  if (rule === "any") return null;
  if (rule !== "owner" && rule.some((p) => access.permissions.includes(p))) return null;

  return Response.json(
    { error: "এই কাজের অনুমতি আপনার নেই / You do not have permission for this" },
    { status: 403 },
  );
}
