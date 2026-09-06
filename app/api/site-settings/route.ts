import { dbFirst } from "@/lib/cf";
import { settingsRowToApi, type SiteSettingsRow } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const row = await dbFirst<SiteSettingsRow>(
    "SELECT * FROM site_settings WHERE id = 'main'",
  );
  return Response.json({ settings: settingsRowToApi(row) });
}
