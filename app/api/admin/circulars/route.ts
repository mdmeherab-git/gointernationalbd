import { requireAdmin } from "@/lib/admin";
import { dbAll, dbFirst, dbRun, getDb, newId } from "@/lib/cf";
import { asText, readJson } from "@/lib/crud";
import { circularRowToApi, type CircularRow } from "@/lib/data";
import { CIRCULAR_FIELDS } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ circulars: [], dbReady: false });

  const rows = await dbAll<CircularRow>(
    "SELECT * FROM circulars ORDER BY sort_order ASC, created_at DESC",
  );
  return Response.json({ circulars: rows.map(circularRowToApi), dbReady: true });
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db)
    return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const body = await readJson(req);
  if (!asText(body.title).trim() || !asText(body.country).trim()) {
    return Response.json(
      { error: "Country and title are required" },
      { status: 400 },
    );
  }

  const cols = Object.keys(CIRCULAR_FIELDS);
  const values = cols.map((c) => CIRCULAR_FIELDS[c](body[c]));
  const placeholders = cols.map(() => "?").join(", ");
  const id = newId("cir");

  await dbRun(
    `INSERT INTO circulars (id, ${cols.join(", ")}) VALUES (?, ${placeholders})`,
    id,
    ...values,
  );

  const row = await dbFirst<CircularRow>(
    "SELECT * FROM circulars WHERE id = ?",
    id,
  );
  return Response.json(
    { circular: row ? circularRowToApi(row) : null, id },
    { status: 201 },
  );
}
