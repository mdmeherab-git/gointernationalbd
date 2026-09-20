import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { dbFirst, dbRun } from "@/lib/cf";
import { requireUser, USER_COOKIE } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

type PasswordRow = { password_hash: string };

/* =========================================================
   POST /api/account/settings/deactivate

   Body: { password }. Self-service account deactivation —
   sets status='disabled' (the same status Admin already uses
   to disable an account, so re-enabling later is an existing,
   understood admin action rather than a new deletion path),
   destroys every session for this user, and clears the
   caller's own cookie. Requires the current password so a
   hijacked/left-open session can't lock the real owner out.
========================================================= */
export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password) {
    return Response.json(
      { error: "নিশ্চিত করতে Password দিন / Enter your password to confirm" },
      { status: 400 },
    );
  }

  const row = await dbFirst<PasswordRow>("SELECT password_hash FROM users WHERE id = ?", user.id);
  if (!row) return Response.json({ error: "User not found" }, { status: 404 });

  const matches = await bcrypt.compare(password, row.password_hash);
  if (!matches) {
    return Response.json({ error: "Password সঠিক নয় / Incorrect password" }, { status: 401 });
  }

  await dbRun("UPDATE users SET status = 'disabled', updated_at = datetime('now') WHERE id = ?", user.id);
  await dbRun("DELETE FROM user_sessions WHERE user_id = ?", user.id);

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: USER_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
