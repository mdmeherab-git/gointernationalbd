import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/admin";
import { dbFirst, dbRun, getDb } from "@/lib/cf";
import { generateTempPassword, markMustChangePassword } from "@/lib/password-reset";
import { clientIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/* =========================================================
   POST /api/admin/users/[id]/reset-password

   Admin-only. Replaces the user's password with a random temporary
   one, signs them out everywhere, and flags the account so the next
   login must choose a new password first. The temporary password is
   returned ONCE in this response (only its hash is stored).
========================================================= */
export async function POST(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  const user = await dbFirst<{ id: string; phone: string }>(
    "SELECT id, phone FROM users WHERE id = ? LIMIT 1",
    id,
  );
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const tempPassword = generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, 12);

  await dbRun(
    "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?",
    hash,
    user.id,
  );
  await dbRun("DELETE FROM user_sessions WHERE user_id = ?", user.id);
  await markMustChangePassword(user.id);

  await logSecurityEvent("user_password_reset", clientIp(req), `user ${user.phone}`);

  return Response.json(
    { ok: true, tempPassword, phone: user.phone },
    { headers: { "cache-control": "no-store" } },
  );
}
