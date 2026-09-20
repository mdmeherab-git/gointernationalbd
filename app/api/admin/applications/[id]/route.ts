import { requireAdmin } from "@/lib/admin";
import { dbFirst, dbRun, getDb } from "@/lib/cf";
import { readJson } from "@/lib/crud";
import { createNotification } from "@/lib/notify";
import { APPLICATION_STATUS } from "@/lib/schemas";
import type { ApplicationRow } from "../route";

const STATUS_LABEL_BN: Record<string, string> = {
  new: "নতুন",
  reviewing: "পর্যালোচনাধীন",
  shortlisted: "শর্টলিস্টেড",
  rejected: "প্রত্যাখ্যাত",
  hired: "নিয়োগপ্রাপ্ত",
};

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db)
    return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  const body = await readJson(req);
  const status = String(body.status ?? "");
  if (!APPLICATION_STATUS.includes(status as (typeof APPLICATION_STATUS)[number])) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const previous = await dbFirst<ApplicationRow>("SELECT * FROM applications WHERE id = ?", id);

  await dbRun("UPDATE applications SET status = ? WHERE id = ?", status, id);
  const row = await dbFirst<ApplicationRow>(
    "SELECT * FROM applications WHERE id = ?",
    id,
  );
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  // Notify the applicant only when the status actually changed and the
  // application is linked to a registered user (never for anonymous ones).
  if (previous && previous.status !== status && row.user_id) {
    const label = STATUS_LABEL_BN[status] ?? status;
    await createNotification(row.user_id, {
      title: "আবেদনের স্ট্যাটাস আপডেট হয়েছে",
      message: `আপনার আবেদন "${row.job_title || row.applicant_name}" এখন "${label}" অবস্থায় আছে।`,
      type: "application",
      link: "/account/applications",
    });
  }

  return Response.json({ application: row });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db)
    return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const { id } = await params;
  await dbRun("DELETE FROM applications WHERE id = ?", id);
  return Response.json({ ok: true });
}
