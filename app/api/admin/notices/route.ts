import { requireAdmin } from "@/lib/admin";
import { dbAll, dbFirst, dbRun, getDb, newId } from "@/lib/cf";
import { asText, readJson } from "@/lib/crud";
import type { NoticeRow } from "@/lib/data";
import { NOTICE_FIELDS } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ notices: [], dbReady: false });

  const rows = await dbAll<NoticeRow>(
    "SELECT * FROM notices ORDER BY sort_order ASC, notice_date DESC",
  );
  return Response.json({ notices: rows, dbReady: true });
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db)
    return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const body = await readJson(req);
  if (!asText(body.title_bn).trim() && !asText(body.title_en).trim()) {
    return Response.json(
      { error: "At least one of title_bn / title_en is required" },
      { status: 400 },
    );
  }

  const cols = Object.keys(NOTICE_FIELDS);
  const values = cols.map((c) => NOTICE_FIELDS[c](body[c]));
  const placeholders = cols.map(() => "?").join(", ");
  const id = newId("not");

  await dbRun(
    `INSERT INTO notices (id, ${cols.join(", ")}) VALUES (?, ${placeholders})`,
    id,
    ...values,
  );

  const row = await dbFirst<NoticeRow>("SELECT * FROM notices WHERE id = ?", id);
  return Response.json({ notice: row, id }, { status: 201 });
}
