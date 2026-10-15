import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/admin";
import { dbRun, getDb } from "@/lib/cf";
import { readJson } from "@/lib/crud";
import { clientIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";
import { cleanPermissions } from "@/lib/staff-permissions";
import { getStaffById, toPublic } from "@/lib/staff";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/* Owner-only. A change takes effect on the staff member's very next request
   (permissions and status are read from the database every time). */

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  const existing = await getStaffById(id);
  if (!existing) return Response.json({ error: "Staff not found" }, { status: 404 });

  const body = await readJson(req);
  const changes: string[] = [];

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 2 || name.length > 60) {
      return Response.json({ error: "নাম ২-৬০ অক্ষরের হতে হবে / Name must be 2-60 characters" }, { status: 400 });
    }
    await dbRun("UPDATE staff_accounts SET name = ? WHERE id = ?", name, id);
    changes.push("name");
  }

  if (body.permissions !== undefined) {
    const permissions = cleanPermissions(body.permissions);
    if (permissions.length === 0) {
      return Response.json({ error: "কমপক্ষে একটি অনুমতি দিন / Give at least one permission" }, { status: 400 });
    }
    await dbRun("UPDATE staff_accounts SET permissions = ? WHERE id = ?", permissions.join(","), id);
    changes.push(`permissions=${permissions.join(",")}`);
  }

  if (body.status === "active" || body.status === "disabled") {
    await dbRun("UPDATE staff_accounts SET status = ? WHERE id = ?", body.status, id);
    changes.push(`status=${body.status}`);
  }

  if (typeof body.password === "string" && body.password !== "") {
    if (body.password.length < 8 || body.password.length > 128) {
      return Response.json({ error: "পাসওয়ার্ড ৮-১২৮ অক্ষরের হতে হবে / Password must be 8-128 characters" }, { status: 400 });
    }
    await dbRun(
      "UPDATE staff_accounts SET password_hash = ? WHERE id = ?",
      await bcrypt.hash(body.password, 12),
      id,
    );
    changes.push("password");
  }

  if (changes.length) {
    await logSecurityEvent(
      "staff_change",
      clientIp(req),
      `${existing.username}: ${changes.join("; ")}`,
    );
  }

  const row = await getStaffById(id);
  return Response.json({ ok: true, staff: row ? toPublic(row) : null });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  const existing = await getStaffById(id);
  if (!existing) return Response.json({ error: "Staff not found" }, { status: 404 });

  await dbRun("DELETE FROM staff_accounts WHERE id = ?", id);
  await logSecurityEvent("staff_change", clientIp(req), `${existing.username}: deleted`);

  return Response.json({ ok: true });
}
