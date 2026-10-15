import { getEnv } from "@/lib/cf";
import { getLoggedInUserId } from "@/lib/chat-conversation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { ADMIN_COOKIE, STAFF_COOKIE, readCookie } from "@/lib/session";
import { geoFromHeaders, hashIp, isBot, recordVisit } from "@/lib/visitors";

export const dynamic = "force-dynamic";

const VID_COOKIE = "gib_vid";
const VID_PATTERN = /^v-[0-9a-f-]{36}$/;

/* POST /api/track  { path, referrer }
   Called by the site on each page view. It never fails loudly: whatever goes
   wrong, the visitor just gets an empty 204. Skipped: bots, "Do Not Track"
   visitors, the owner/staff browsing the site, and the admin/api paths. */
export async function POST(req: Request) {
  const done = (headers?: Record<string, string>) => new Response(null, { status: 204, headers });

  try {
    const userAgent = req.headers.get("user-agent") || "";
    if (isBot(userAgent)) return done();
    if (req.headers.get("dnt") === "1") return done();
    if (readCookie(req, ADMIN_COOKIE) || readCookie(req, STAFF_COOKIE)) return done();

    const ip = clientIp(req);
    if ((await rateLimit(`track:${ip}`, 120, 60)).blocked) return done();

    const body = (await req.json().catch(() => null)) as { path?: unknown; referrer?: unknown } | null;

    // Only the path: a query string could carry personal details.
    const rawPath = typeof body?.path === "string" ? body.path : "";
    const path = rawPath.split("?")[0].split("#")[0].slice(0, 200);
    if (!path.startsWith("/") || path.startsWith("//")) return done();
    if (path.startsWith("/admin") || path.startsWith("/api")) return done();

    // Only the site name of where they came from, and only if it is elsewhere.
    let referrer = "";
    if (typeof body?.referrer === "string" && body.referrer) {
      try {
        const host = new URL(body.referrer).hostname.replace(/^www\./, "");
        const own = (req.headers.get("host") || "").replace(/^www\./, "").split(":")[0];
        if (host && host !== own) referrer = host.slice(0, 80);
      } catch {
        /* not a URL */
      }
    }

    const existing = readCookie(req, VID_COOKIE);
    const hasVid = !!existing && VID_PATTERN.test(existing);
    const vid = hasVid ? (existing as string) : `v-${crypto.randomUUID()}`;

    const env = await getEnv();
    const { country, city } = geoFromHeaders(req.headers);

    await recordVisit({
      vid,
      isNew: !hasVid,
      userId: await getLoggedInUserId(req),
      path,
      referrer,
      country,
      city,
      userAgent,
      ipHash: await hashIp(ip, String(env.ADMIN_SESSION_SECRET || "gib")),
    });

    if (hasVid) return done();
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return done({
      "set-cookie": `${VID_COOKIE}=${vid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}${secure}`,
    });
  } catch {
    return done();
  }
}
