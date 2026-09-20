import { dbFirst, dbRun } from "@/lib/cf";
import { pickUpdate, readJson } from "@/lib/crud";
import { USER_SETTINGS_FIELDS } from "@/lib/schemas";
import { requireUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

type SettingsRow = {
  notify_application: number;
  notify_visa: number;
  notify_medical: number;
  notify_general: number;
  language_pref: string;
};

const SELECT_SQL =
  "SELECT notify_application, notify_visa, notify_medical, notify_general, language_pref FROM users WHERE id = ?";

/* =========================================================
   GET /api/account/settings

   Notification + language preferences for the CURRENT
   session user (name/phone/email live under /api/auth/profile
   — this route only covers the settings this page adds).
========================================================= */
export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const row = await dbFirst<SettingsRow>(SELECT_SQL, user.id);
  return Response.json({ settings: row });
}

/* =========================================================
   PATCH /api/account/settings

   Updates notification toggles and/or language preference.
========================================================= */
export async function PATCH(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const body = await readJson(req);
  const { setSql, values, count } = pickUpdate(USER_SETTINGS_FIELDS, body);
  if (!count) return Response.json({ error: "No valid fields to update" }, { status: 400 });

  await dbRun(`UPDATE users SET ${setSql}, updated_at = datetime('now') WHERE id = ?`, ...values, user.id);

  const row = await dbFirst<SettingsRow>(SELECT_SQL, user.id);
  return Response.json({ ok: true, settings: row });
}
