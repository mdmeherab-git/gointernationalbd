import { getDb } from "@/lib/cf";
import { readCountryNames } from "@/lib/country-names-db";

export const dynamic = "force-dynamic";

/** Public: admin-customised Bangla country names, { names: { code: name } }. */
export async function GET() {
  const db = await getDb();
  if (!db) return Response.json({ names: {} });
  try {
    return Response.json({ names: await readCountryNames() });
  } catch {
    return Response.json({ names: {} });
  }
}
