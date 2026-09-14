import { requireAdmin } from "@/lib/admin";
import { dbFirst, dbRun, getDb, getUploads } from "@/lib/cf";
import { readJson } from "@/lib/crud";
import { USER_STATUS } from "@/lib/schemas";
import type { AdminUserRow } from "../route";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const SELECT_SAFE_FIELDS = `
  id, name, email, phone, profile_photo_key,
  passport_number, passport_issue, passport_expiry,
  status, phone_verified, created_at, updated_at
`;

/* =========================================================
   GET /api/admin/users/[id]

   Full detail for one registered user. Same safe-field
   selection as the list route — password_hash is never
   selected, so it can never leak here even by accident.
========================================================= */

export async function GET(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  const user = await dbFirst<AdminUserRow>(
    `SELECT ${SELECT_SAFE_FIELDS} FROM users WHERE id = ? LIMIT 1`,
    id,
  );
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  return Response.json({ user });
}

/* =========================================================
   PATCH /api/admin/users/[id]

   Admin-only account status change. Only "active" and
   "disabled" are accepted — anything else is rejected. The id
   in the URL only selects WHICH user; the request itself is
   still verified as Admin above before anything runs.
========================================================= */

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  const body = await readJson(req);
  const status = String(body.status ?? "");

  if (!USER_STATUS.includes(status as (typeof USER_STATUS)[number])) {
    return Response.json(
      { error: `Invalid status — must be one of: ${USER_STATUS.join(", ")}` },
      { status: 400 },
    );
  }

  const existing = await dbFirst<{ id: string }>("SELECT id FROM users WHERE id = ?", id);
  if (!existing) return Response.json({ error: "User not found" }, { status: 404 });

  await dbRun(
    "UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?",
    status,
    id,
  );

  const user = await dbFirst<AdminUserRow>(
    `SELECT ${SELECT_SAFE_FIELDS} FROM users WHERE id = ? LIMIT 1`,
    id,
  );

  return Response.json({ ok: true, user });
}

/* =========================================================
   DELETE /api/admin/users/[id]

   Permanently removes a user account:
     1. user_documents rows
     2. profile photo object in R2 (if any)
     3. user_sessions rows
     4. the users row itself

   applications.user_id is intentionally left untouched —
   historical application records are preserved rather than
   cascaded, per product requirement.
========================================================= */

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  const existing = await dbFirst<{ id: string; profile_photo_key: string }>(
    "SELECT id, profile_photo_key FROM users WHERE id = ?",
    id,
  );
  if (!existing) return Response.json({ error: "User not found" }, { status: 404 });

  // R2 cleanup runs FIRST and gates everything else: if it fails, no DB
  // rows are touched at all, so the account is left exactly as it was
  // rather than in a half-deleted state.
  if (existing.profile_photo_key) {
    const bucket = await getUploads();
    if (!bucket) {
      return Response.json(
        { error: "ছবি স্টোরেজ কনফিগার করা নেই / Photo storage is not configured — user was not deleted" },
        { status: 503 },
      );
    }
    try {
      await bucket.delete(existing.profile_photo_key);
    } catch (error) {
      console.error("Admin delete user — R2 photo cleanup failed:", error);
      return Response.json(
        { error: "প্রোফাইল ছবি মুছতে ব্যর্থ, ইউজার ডিলিট বাতিল করা হয়েছে / Could not delete the profile photo — user was not deleted" },
        { status: 500 },
      );
    }
  }

  try {
    await dbRun("DELETE FROM user_documents WHERE user_id = ?", id);
    await dbRun("DELETE FROM user_otps WHERE user_id = ?", id);
    await dbRun("DELETE FROM user_sessions WHERE user_id = ?", id);
    await dbRun("DELETE FROM users WHERE id = ?", id);
  } catch (error) {
    console.error("Admin delete user — DB delete failed:", error);
    return Response.json(
      { error: "ইউজার মুছতে ব্যর্থ / Could not delete user" },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
