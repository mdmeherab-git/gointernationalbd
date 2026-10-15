import bcrypt from "bcryptjs";
import { getEnv } from "@/lib/cf";
import { logSecurityEvent } from "@/lib/security-log";
import {
  clearSessionCookie,
  clearStaffCookie,
  createSessionToken,
  createStaffToken,
  safeEqual,
  serializeSessionCookie,
  serializeStaffCookie,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";
import { getStaffByUsername, touchStaffLogin } from "@/lib/staff";

import {
  clearRateLimit,
  clientIp,
  isRateLimited,
  restartWindow,
  rateLimit,
  tooManyRequests,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// 3 wrong passwords lock this IP out of the admin login for 15 minutes.
const ADMIN_MAX_FAILS = 3;
const ADMIN_WINDOW_S = 15 * 60;

// Staff have their own counters so an employee mistyping on the office
// network can never lock the owner out (different keys), and a spread-out
// guessing attack on one username is still capped.
const STAFF_MAX_FAILS = 5;
const STAFF_WINDOW_S = 15 * 60;
const STAFF_ACCOUNT_MAX_FAILS = 20;
const STAFF_ACCOUNT_WINDOW_S = 60 * 60;

let dummyHash: string | null = null;

export async function POST(req: Request) {
  const { ADMIN_PASSWORD, ADMIN_SESSION_SECRET } = await getEnv();

  if (!ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) {
    return Response.json(
      {
        error:
          "Admin login is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET in .dev.vars (or as Wrangler secrets).",
      },
      { status: 500 },
    );
  }

  let password = "";
  let username = "";
  try {
    const body = (await req.json()) as { password?: unknown; username?: unknown };
    password = typeof body?.password === "string" ? body.password : "";
    username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ip = clientIp(req);
  const userAgent = (req.headers.get("user-agent") || "").slice(0, 120);

  if (username) {
    return staffLogin({ username, password, ip, userAgent, secret: ADMIN_SESSION_SECRET });
  }

  // Brute-force protection: only FAILED attempts count, per IP.
  const limitKey = `admin-login:${ip}`;
  const limited = await isRateLimited(limitKey, ADMIN_MAX_FAILS, ADMIN_WINDOW_S);

  if (limited.blocked) {
    // One entry per IP per 10 minutes, so a flood cannot fill the log.
    await logSecurityEvent("blocked", ip, userAgent, { dedupeMinutes: 10 });
    return tooManyRequests(limited.retryAfter);
  }

  if (!safeEqual(password, ADMIN_PASSWORD)) {
    await rateLimit(limitKey, ADMIN_MAX_FAILS, ADMIN_WINDOW_S);
    await logSecurityEvent("login_failed", ip, userAgent);

    // Limit reached: start the full 15-minute lockout from now.
    const after = await isRateLimited(limitKey, ADMIN_MAX_FAILS, ADMIN_WINDOW_S);
    if (after.blocked) {
      await restartWindow(limitKey);
      await logSecurityEvent(
        "lockout",
        ip,
        `Locked for 15 minutes after ${ADMIN_MAX_FAILS} wrong passwords`,
      );
    }

    return Response.json(
      { error: "ভুল পাসওয়ার্ড / Wrong password" },
      { status: 401 },
    );
  }

  await clearRateLimit(limitKey);
  await logSecurityEvent("login_success", ip, userAgent);

  const token = await createSessionToken(ADMIN_SESSION_SECRET);
  const headers = new Headers({ "content-type": "application/json" });
  headers.append("set-cookie", serializeSessionCookie(token, SESSION_MAX_AGE_SECONDS));
  // Signing in as the owner replaces any staff session in this browser.
  headers.append("set-cookie", clearStaffCookie());
  return new Response(JSON.stringify({ ok: true, role: "owner" }), { status: 200, headers });
}

async function staffLogin(args: {
  username: string;
  password: string;
  ip: string;
  userAgent: string;
  secret: string;
}): Promise<Response> {
  const { username, password, ip, userAgent, secret } = args;
  const tag = `staff:${username}`;

  const ipKey = `staff-login:${ip}:${username}`;
  const acctKey = `staff-login-acct:${username}`;

  const [ipLimited, acctLimited] = await Promise.all([
    isRateLimited(ipKey, STAFF_MAX_FAILS, STAFF_WINDOW_S),
    isRateLimited(acctKey, STAFF_ACCOUNT_MAX_FAILS, STAFF_ACCOUNT_WINDOW_S),
  ]);
  if (ipLimited.blocked || acctLimited.blocked) {
    await logSecurityEvent("blocked", ip, `${tag} ${userAgent}`, { dedupeMinutes: 10 });
    return tooManyRequests(Math.max(ipLimited.retryAfter, acctLimited.retryAfter));
  }

  const fail = async () => {
    await Promise.all([
      rateLimit(ipKey, STAFF_MAX_FAILS, STAFF_WINDOW_S),
      rateLimit(acctKey, STAFF_ACCOUNT_MAX_FAILS, STAFF_ACCOUNT_WINDOW_S),
    ]);
    await logSecurityEvent("login_failed", ip, `${tag} ${userAgent}`);
    const after = await isRateLimited(ipKey, STAFF_MAX_FAILS, STAFF_WINDOW_S);
    if (after.blocked) {
      await restartWindow(ipKey);
      await logSecurityEvent(
        "lockout",
        ip,
        `${tag} locked for 15 minutes after ${STAFF_MAX_FAILS} wrong passwords`,
      );
    }
    return Response.json(
      { error: "ইউজারনেম বা পাসওয়ার্ড সঠিক নয় / Wrong username or password" },
      { status: 401 },
    );
  };

  let row = null;
  try {
    row = await getStaffByUsername(username);
  } catch {
    row = null;
  }

  // Always run a bcrypt compare so a missing username costs the same time as
  // a wrong password (no username probing by timing).
  if (!row && !dummyHash) dummyHash = await bcrypt.hash("not-a-real-password", 12);
  const matches = await bcrypt
    .compare(password, row?.password_hash || (dummyHash as string))
    .catch(() => false);

  if (!row || !matches) return fail();

  if (row.status !== "active") {
    await logSecurityEvent("login_failed", ip, `${tag} (disabled) ${userAgent}`);
    return Response.json(
      { error: "এই অ্যাকাউন্ট বন্ধ আছে / This account is disabled" },
      { status: 403 },
    );
  }

  await clearRateLimit(ipKey);
  await touchStaffLogin(row.id).catch(() => {});
  await logSecurityEvent("login_success", ip, `${tag} ${userAgent}`);

  const token = await createStaffToken(secret, row.id);
  const headers = new Headers({ "content-type": "application/json" });
  headers.append("set-cookie", serializeStaffCookie(token, SESSION_MAX_AGE_SECONDS));
  headers.append("set-cookie", clearSessionCookie());
  return new Response(JSON.stringify({ ok: true, role: "staff" }), { status: 200, headers });
}
