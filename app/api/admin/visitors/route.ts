import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/cf";
import { readVisitorSummary } from "@/lib/visitors";

export const dynamic = "force-dynamic";

/* Owner-only (not in the staff path rules): who visited the site. */
export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const range = new URL(req.url).searchParams.get("range") === "7d" ? "7d" : "24h";
  return Response.json(await readVisitorSummary(range));
}
