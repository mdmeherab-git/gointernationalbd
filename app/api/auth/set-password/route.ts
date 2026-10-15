import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbFirst, dbRun, newId } from "@/lib/cf";
import { clearMustChangePassword, mustChangePassword } from "@/lib/password-reset";
import {
  clearRateLimit,
  clientIp,
  isRateLimited,
  rateLimit,
  tooManyRequests,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  password_hash: string;
  status: string;
};

const SESSION_DAYS = 30;

// Same failed-attempt limits (and keys) as /api/auth/login, so guessing the
// temporary password here counts against the same budget.
const LOGIN_WINDOW_S = 15 * 60;
const LOGIN_MAX_FAILS = 8;
const ACCOUNT_WINDOW_S = 60 * 60;
const ACCOUNT_MAX_FAILS = 25;

/* =========================================================
   POST /api/auth/set-password

   Body: { phone, tempPassword, newPassword }
   Second step of an admin password reset: proves knowledge of the
   temporary password, replaces it, and only then creates the session.
   Refused for accounts that are not flagged for a reset.
========================================================= */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      phone?: unknown;
      tempPassword?: unknown;
      newPassword?: unknown;
    } | null;

    const phone = typeof body?.phone === "string" ? body.phone.trim().replace(/\s+/g, "") : "";
    const tempPassword = typeof body?.tempPassword === "string" ? body.tempPassword : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!phone || !tempPassword || !newPassword) {
      return NextResponse.json(
        { error: "সব ঘর পূরণ করুন / Please fill in all fields" },
        { status: 400 },
      );
    }

    const ipKey = `user-login:${clientIp(req)}:${phone}`;
    const accountKey = `user-login-acct:${phone}`;

    const [ipLimited, accountLimited] = await Promise.all([
      isRateLimited(ipKey, LOGIN_MAX_FAILS, LOGIN_WINDOW_S),
      isRateLimited(accountKey, ACCOUNT_MAX_FAILS, ACCOUNT_WINDOW_S),
    ]);
    if (ipLimited.blocked || accountLimited.blocked) {
      return tooManyRequests(Math.max(ipLimited.retryAfter, accountLimited.retryAfter));
    }

    const recordFailure = () =>
      Promise.all([
        rateLimit(ipKey, LOGIN_MAX_FAILS, LOGIN_WINDOW_S),
        rateLimit(accountKey, ACCOUNT_MAX_FAILS, ACCOUNT_WINDOW_S),
      ]);

    const user = await dbFirst<UserRow>(
      "SELECT id, name, email, phone, password_hash, status FROM users WHERE phone = ? LIMIT 1",
      phone,
    );

    const wrong = () =>
      NextResponse.json(
        { error: "মোবাইল নম্বর অথবা অস্থায়ী Password সঠিক নয়" },
        { status: 401 },
      );

    if (!user) {
      await recordFailure();
      return wrong();
    }
    if (user.status !== "active") {
      return NextResponse.json(
        { error: "আপনার Account বর্তমানে সক্রিয় নয় / Your account is not active" },
        { status: 403 },
      );
    }
    if (!(await bcrypt.compare(tempPassword, user.password_hash))) {
      await recordFailure();
      return wrong();
    }
    if (!(await mustChangePassword(user.id))) {
      return NextResponse.json(
        { error: "এই Account-এ Password পরিবর্তনের অনুরোধ নেই / No password change is pending" },
        { status: 400 },
      );
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      return NextResponse.json(
        { error: "নতুন Password ৮-১২৮ অক্ষরের হতে হবে / New password must be 8-128 characters" },
        { status: 400 },
      );
    }
    if (newPassword === tempPassword) {
      return NextResponse.json(
        { error: "নতুন Password অস্থায়ী Password থেকে আলাদা হতে হবে / Choose a different password" },
        { status: 400 },
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await dbRun(
      "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?",
      newHash,
      user.id,
    );
    await clearMustChangePassword(user.id);
    await clearRateLimit(ipKey);

    const sessionId = newId("session");
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await dbRun(
      "INSERT INTO user_sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, datetime('now'))",
      sessionId,
      user.id,
      expiresAt,
    );

    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
      sessionToken: sessionId,
    });
    response.cookies.set({
      name: "gib_user",
      value: sessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    console.error("Set password error:", error);
    return NextResponse.json({ error: "করা যায়নি / Could not set password" }, { status: 500 });
  }
}
