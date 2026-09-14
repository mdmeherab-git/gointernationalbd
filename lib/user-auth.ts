import "server-only";
import { dbFirst } from "./cf";
import { readCookie } from "./session";

/**
 * Shared session resolver for authenticated user routes (profile,
 * profile photo, etc). Mirrors the session -> user lookup already used
 * in /api/auth/me, so every route derives identity the same way: from
 * the gib_user cookie, never from a client-supplied user id.
 */

export const USER_COOKIE = "gib_user";

export type CurrentUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  profilePhotoKey: string;
  passportNumber: string;
  passportIssue: string;
  passportExpiry: string;
};

type SessionRow = {
  user_id: string;
  expires_at: string;
  name: string;
  email: string | null;
  phone: string;
  profile_photo_key: string;
  passport_number: string;
  passport_issue: string;
  passport_expiry: string;
  status: string;
};

/** Resolves the current user from the session cookie, or null if the
 *  cookie is missing, the session is unknown/expired, or the account
 *  isn't active. */
export async function getCurrentUser(req: Request): Promise<CurrentUser | null> {
  const sessionId = readCookie(req, USER_COOKIE);
  if (!sessionId) return null;

  const session = await dbFirst<SessionRow>(
    `
      SELECT
        s.user_id,
        s.expires_at,
        u.name,
        u.email,
        u.phone,
        u.profile_photo_key,
        u.passport_number,
        u.passport_issue,
        u.passport_expiry,
        u.status
      FROM user_sessions s
      INNER JOIN users u
        ON u.id = s.user_id
      WHERE s.id = ?
      LIMIT 1
    `,
    sessionId,
  );

  if (!session) return null;

  const expiresAt = new Date(session.expires_at).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
  if (session.status !== "active") return null;

  return {
    id: session.user_id,
    name: session.name,
    email: session.email,
    phone: session.phone,
    profilePhotoKey: session.profile_photo_key || "",
    passportNumber: session.passport_number || "",
    passportIssue: session.passport_issue || "",
    passportExpiry: session.passport_expiry || "",
  };
}

/**
 * Guard for authenticated user route handlers. Returns the resolved
 * user, or a 401 JSON `Response` to return early.
 */
export async function requireUser(req: Request): Promise<{ user: CurrentUser } | Response> {
  const user = await getCurrentUser(req);
  if (!user) {
    return Response.json(
      { error: "Login প্রয়োজন / Login required" },
      { status: 401 },
    );
  }
  return { user };
}
