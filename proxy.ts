import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/session";

/**
 * Optimistic gate for the admin area. Real enforcement also happens in every
 * `/api/admin/*` route (requireAdmin) and on each admin page mount.
 *
 * Next 16 renamed Middleware -> Proxy. See
 * node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md
 */
export const config = {
  matcher: ["/admin/:path*"],
};

async function readSecret(): Promise<string | undefined> {
  // Vercel / Node: the secret is a normal env var.
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET;
  // Cloudflare Workers: pull it from the request context.
  try {
    const mod = await import("@opennextjs/cloudflare");
    const { env } = await mod.getCloudflareContext({ async: true });
    const secret = (env as unknown as Record<string, unknown>).ADMIN_SESSION_SECRET;
    if (typeof secret === "string" && secret) return secret;
  } catch {
    /* adapter not available */
  }
  return undefined;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The login page must stay reachable while logged out.
  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const secret = await readSecret();

  const ok = secret
    ? await verifySessionToken(token, secret)
    : Boolean(token); // can't verify signature here -> presence check only

  if (ok) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}
