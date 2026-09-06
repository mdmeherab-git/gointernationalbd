import { dbRun, getDb, newId } from "@/lib/cf";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const name = str(body.applicant_name) || str(body.name);
  const phone = str(body.phone);
  const email = str(body.email);
  const message = str(body.message);
  const jobTitle = str(body.job_title);
  const jobCountry = str(body.job_country);
  const circularId = body.circular_id ? String(body.circular_id).slice(0, 80) : null;

  if (!name || !phone) {
    return Response.json(
      { error: "নাম ও মোবাইল নম্বর দিন / Name and phone are required" },
      { status: 400 },
    );
  }
  if (name.length > 120 || phone.length > 40 || email.length > 160 || message.length > 2000) {
    return Response.json({ error: "Input too long" }, { status: 400 });
  }

  const db = await getDb();
  if (!db) {
    // DB not configured yet — accept so the visitor still gets a success state.
    return Response.json({ ok: true, stored: false });
  }

  const id = newId("app");
  await dbRun(
    `INSERT INTO applications
       (id, circular_id, job_title, job_country, applicant_name, phone, email, message, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
    id,
    circularId,
    jobTitle,
    jobCountry,
    name,
    phone,
    email,
    message,
  );
  return Response.json({ ok: true, stored: true, id });
}
