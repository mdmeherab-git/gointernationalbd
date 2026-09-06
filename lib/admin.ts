import "server-only";
import { getEnv } from "./cf";
import { ADMIN_COOKIE, readCookie, verifySessionToken } from "./session";

/** True when the request carries a valid admin session cookie. */
export async function isAdminRequest(req: Request): Promise<boolean> {
  const { ADMIN_SESSION_SECRET } = await getEnv();
  const token = readCookie(req, ADMIN_COOKIE);
  return verifySessionToken(token, ADMIN_SESSION_SECRET);
}

/**
 * Guard for admin route handlers. Returns a 401 `Response` to return early,
 * or `null` when the caller is authenticated.
 */
export async function requireAdmin(req: Request): Promise<Response | null> {
  if (await isAdminRequest(req)) return null;
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
