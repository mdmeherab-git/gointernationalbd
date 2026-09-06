import { dbAll, getDb } from "@/lib/cf";
import {
  circularRowToApi,
  FALLBACK_CIRCULARS,
  type CircularRow,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const featured = url.searchParams.get("featured") === "1";
  const limitRaw = Number(url.searchParams.get("limit"));
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 100) : null;

  const db = await getDb();

  if (!db) {
    let items = FALLBACK_CIRCULARS.filter((c) => c.status === "active");
    if (featured) items = items.filter((c) => c.isFeatured);
    if (limit) items = items.slice(0, limit);
    return Response.json({ circulars: items, source: "fallback" });
  }

  let sql = "SELECT * FROM circulars WHERE status = 'active'";
  if (featured) sql += " AND is_featured = 1";
  sql += " ORDER BY sort_order ASC, created_at DESC";
  if (limit) sql += ` LIMIT ${limit}`;

  const rows = await dbAll<CircularRow>(sql);
  return Response.json({ circulars: rows.map(circularRowToApi), source: "db" });
}
