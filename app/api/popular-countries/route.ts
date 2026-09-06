import { dbAll, getDb } from "@/lib/cf";
import { FALLBACK_POPULAR_COUNTRIES, type PopularCountryRow } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();

  if (!db) {
    return Response.json({
      countries: FALLBACK_POPULAR_COUNTRIES.filter((c) => c.visible).map((c) => ({
        code: c.code,
        name: c.name,
      })),
      source: "fallback",
    });
  }

  const rows = await dbAll<PopularCountryRow>(
    "SELECT * FROM popular_countries WHERE visible = 1 ORDER BY sort_order ASC",
  );
  return Response.json({
    countries: rows.map((r) => ({ code: r.code, name: r.name })),
    source: "db",
  });
}
