import { getEnv } from "@/lib/cf";
import { safeEqual } from "@/lib/session";
import {
  clearRateLimit,
  clientIp,
  isRateLimited,
  rateLimit,
  tooManyRequests,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_FAILS = 8;
const WINDOW_S = 15 * 60;

/* The promo code that unlocks the logo-free CV PDF. It lives only on the
   server (set CV_PROMO_CODE as an environment variable / Wrangler secret to
   change it). The fallback keeps the existing code working until that is set. */
const FALLBACK_CODE = "327575";

export async function POST(req: Request) {
  const key = `cv-promo:${clientIp(req)}`;
  const limited = await isRateLimited(key, MAX_FAILS, WINDOW_S);

  if (limited.blocked) {
    return tooManyRequests(limited.retryAfter);
  }

  let code = "";
  try {
    const body = (await req.json()) as { code?: unknown };
    code = typeof body?.code === "string" ? body.code.trim() : "";
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const env = (await getEnv()) as Record<string, unknown>;
  const expected =
    (typeof env.CV_PROMO_CODE === "string" && env.CV_PROMO_CODE) ||
    process.env.CV_PROMO_CODE ||
    FALLBACK_CODE;

  if (!code || !safeEqual(code, expected)) {
    await rateLimit(key, MAX_FAILS, WINDOW_S);

    return Response.json({ ok: false }, { status: 200 });
  }

  await clearRateLimit(key);

  return Response.json({ ok: true });
}
