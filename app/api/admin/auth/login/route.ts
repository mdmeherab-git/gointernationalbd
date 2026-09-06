import { getEnv } from "@/lib/cf";
import {
  createSessionToken,
  safeEqual,
  serializeSessionCookie,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";

export const dynamic = "force-dynamic";

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

  if (!safeEqual(password, ADMIN_PASSWORD)) {
    return Response.json(
      { error: "ভুল পাসওয়ার্ড / Wrong password" },
      { status: 401 },
    );
  }

  const token = await createSessionToken(ADMIN_SESSION_SECRET);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": serializeSessionCookie(token, SESSION_MAX_AGE_SECONDS),
    },
  });
}
