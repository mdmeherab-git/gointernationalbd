import { requireAdmin } from "@/lib/admin";
import { dbFirst, dbRun, newId } from "@/lib/cf";
import type { VisaStatusRow } from "@/lib/data";
import { readJson } from "@/lib/crud";
import { createNotification } from "@/lib/notify";
import { VISA_STATUS_FIELDS } from "@/lib/schemas";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const DEFAULTS: Record<string, unknown> = {
  medical_status: "not_started",
  visa_status: "not_started",
  flight_status: "not_scheduled",
  flight_date: "",
  flight_airline: "",
  flight_pnr: "",
  remarks: "",
};

const MEDICAL_LABEL_BN: Record<string, string> = {
  not_started: "শুরু হয়নি",
  in_progress: "চলমান",
  fit: "ফিট",
  unfit: "আনফিট",
  completed: "সম্পন্ন",
};
const VISA_LABEL_BN: Record<string, string> = {
  not_started: "শুরু হয়নি",
  processing: "প্রসেসিং চলছে",
  running: "চলমান",
  issued: "ইস্যু হয়েছে",
  rejected: "প্রত্যাখ্যাত",
  completed: "সম্পন্ন",
};
const FLIGHT_LABEL_BN: Record<string, string> = {
  not_scheduled: "নির্ধারিত হয়নি",
  pending: "পেন্ডিং",
  confirmed: "কনফার্ম হয়েছে",
  completed: "সম্পন্ন",
  cancelled: "বাতিল",
};

/* =========================================================
   GET /api/admin/users/[id]/visa-status

   Current visa/medical/flight status row for one user (or
   defaults, if Admin hasn't set anything yet).
========================================================= */
export async function GET(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const row = await dbFirst<VisaStatusRow>("SELECT * FROM visa_statuses WHERE user_id = ?", id);
  return Response.json({ status: row ?? { user_id: id, ...DEFAULTS, updated_at: null } });
}

/* =========================================================
   PUT /api/admin/users/[id]/visa-status

   Upserts the medical/visa/flight status fields for one user.
   Creates a fresh row on first use. For each of the three
   headline status fields that actually changed value, fires an
   automatic notification to the user (skipped if unchanged —
   re-saving the same status never spams a duplicate).
========================================================= */
export async function PUT(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id: userId } = await params;
  const user = await dbFirst<{ id: string }>("SELECT id FROM users WHERE id = ?", userId);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const body = await readJson(req);
  const previous = await dbFirst<VisaStatusRow>("SELECT * FROM visa_statuses WHERE user_id = ?", userId);
  const prevValues: Record<string, unknown> = previous ? { ...previous } : { ...DEFAULTS };

  const next: Record<string, unknown> = {};
  for (const [field, coerce] of Object.entries(VISA_STATUS_FIELDS)) {
    next[field] = Object.prototype.hasOwnProperty.call(body, field)
      ? coerce(body[field])
      : prevValues[field] ?? DEFAULTS[field];
  }

  if (previous) {
    await dbRun(
      `UPDATE visa_statuses SET
         medical_status = ?, visa_status = ?, flight_status = ?,
         flight_date = ?, flight_airline = ?, flight_pnr = ?, remarks = ?,
         updated_at = datetime('now')
       WHERE user_id = ?`,
      next.medical_status,
      next.visa_status,
      next.flight_status,
      next.flight_date,
      next.flight_airline,
      next.flight_pnr,
      next.remarks,
      userId,
    );
  } else {
    await dbRun(
      `INSERT INTO visa_statuses
         (id, user_id, medical_status, visa_status, flight_status, flight_date, flight_airline, flight_pnr, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      newId("vst"),
      userId,
      next.medical_status,
      next.visa_status,
      next.flight_status,
      next.flight_date,
      next.flight_airline,
      next.flight_pnr,
      next.remarks,
    );
  }

  if (next.medical_status !== prevValues.medical_status) {
    await createNotification(userId, {
      title: "মেডিকেল স্ট্যাটাস আপডেট হয়েছে",
      message: `আপনার Medical Report এখন "${MEDICAL_LABEL_BN[next.medical_status as string] ?? next.medical_status}" অবস্থায় আছে।`,
      type: "medical",
      link: "/account/visa-status",
    });
  }
  if (next.visa_status !== prevValues.visa_status) {
    await createNotification(userId, {
      title: "ভিসা স্ট্যাটাস আপডেট হয়েছে",
      message: `আপনার ভিসা প্রসেসিং এখন "${VISA_LABEL_BN[next.visa_status as string] ?? next.visa_status}" অবস্থায় আছে।`,
      type: "visa",
      link: "/account/visa-status",
    });
  }
  if (next.flight_status !== prevValues.flight_status) {
    await createNotification(userId, {
      title: "ফ্লাইট স্ট্যাটাস আপডেট হয়েছে",
      message: `আপনার ফ্লাইট স্ট্যাটাস এখন "${FLIGHT_LABEL_BN[next.flight_status as string] ?? next.flight_status}" অবস্থায় আছে।`,
      type: "flight",
      link: "/account/visa-status",
    });
  }

  const row = await dbFirst<VisaStatusRow>("SELECT * FROM visa_statuses WHERE user_id = ?", userId);
  return Response.json({ ok: true, status: row });
}
