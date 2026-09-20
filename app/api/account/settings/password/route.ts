import bcrypt from "bcryptjs";
import { dbFirst, dbRun } from "@/lib/cf";
import { requireUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

type PasswordRow = { password_hash: string };

/* =========================================================
   POST /api/account/settings/password

   Body: { currentPassword, newPassword, confirmPassword }
   Changes the CURRENT session user's own password. Requires
   the current password so a hijacked/left-open session can't
   silently lock the real owner out.
========================================================= */
export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const body = (await req.json().catch(() => null)) as {
    currentPassword?: unknown;
    newPassword?: unknown;
    confirmPassword?: unknown;
  } | null;

  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

  if (!currentPassword || !newPassword) {
    return Response.json(
      { error: "বর্তমান ও নতুন Password দিন / Current and new password are required" },
      { status: 400 },
    );
  }
  if (newPassword.length < 8 || newPassword.length > 128) {
    return Response.json(
      { error: "নতুন Password ৮-১২৮ অক্ষরের হতে হবে / New password must be 8-128 characters" },
      { status: 400 },
    );
  }
  if (newPassword !== confirmPassword) {
    return Response.json(
      { error: "নতুন Password মিলছে না / New passwords do not match" },
      { status: 400 },
    );
  }

  const row = await dbFirst<PasswordRow>("SELECT password_hash FROM users WHERE id = ?", user.id);
  if (!row) return Response.json({ error: "User not found" }, { status: 404 });

  const matches = await bcrypt.compare(currentPassword, row.password_hash);
  if (!matches) {
    return Response.json(
      { error: "বর্তমান Password সঠিক নয় / Current password is incorrect" },
      { status: 401 },
    );
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await dbRun(
    "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?",
    newHash,
    user.id,
  );

  return Response.json({ ok: true });
}
