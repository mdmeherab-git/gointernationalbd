import { getEnv } from "@/lib/cf";
import { logSecurityEvent } from "@/lib/security-log";
import {
  createSessionToken,
  safeEqual,
  serializeSessionCookie,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";

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
  try {
    const body = (await req.json()) as { password?: unknown };
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Brute-force protection: only FAILED attempts count, per IP.
  const ip = clientIp(req);
  const userAgent = (req.headers.get("user-agent") || "").slice(0, 120);
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
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": serializeSessionCookie(token, SESSION_MAX_AGE_SECONDS),
    },
  });
}
