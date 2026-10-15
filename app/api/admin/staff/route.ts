import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/cf";
import { readJson } from "@/lib/crud";
import { clientIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";
import { cleanPermissions } from "@/lib/staff-permissions";
import { createStaff, getStaffByUsername, listStaff, USERNAME_PATTERN } from "@/lib/staff";

export const dynamic = "force-dynamic";

/* Owner-only (it is not in the staff path rules, so requireAdmin refuses
   every staff member here). */

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  return Response.json({ staff: await listStaff() });
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const body = await readJson(req);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const permissions = cleanPermissions(body.permissions);

  if (name.length < 2 || name.length > 60) {
    return Response.json({ error: "নাম ২-৬০ অক্ষরের হতে হবে / Name must be 2-60 characters" }, { status: 400 });
  }
  if (!USERNAME_PATTERN.test(username)) {
    return Response.json(
      { error: "ইউজারনেম ৩-৩০ অক্ষর, শুধু a-z 0-9 . _ - / Username: 3-30 chars, a-z 0-9 . _ -" },
      { status: 400 },
    );
  }
  if (password.length < 8 || password.length > 128) {
    return Response.json({ error: "পাসওয়ার্ড ৮-১২৮ অক্ষরের হতে হবে / Password must be 8-128 characters" }, { status: 400 });
  }
  if (permissions.length === 0) {
    return Response.json({ error: "কমপক্ষে একটি অনুমতি দিন / Give at least one permission" }, { status: 400 });
  }
  if (await getStaffByUsername(username)) {
    return Response.json({ error: "এই ইউজারনেম আগে থেকেই আছে / Username already taken" }, { status: 409 });
  }

  const staff = await createStaff({
    name,
    username,
    passwordHash: await bcrypt.hash(password, 12),
    permissions,
  });

  await logSecurityEvent(
    "staff_change",
    clientIp(req),
    `created ${username}: ${permissions.join(",")}`,
  );

  return Response.json({ ok: true, staff }, { status: 201 });
}
