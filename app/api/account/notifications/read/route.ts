import { dbFirst, dbRun } from "@/lib/cf";
import { readJson } from "@/lib/crud";
import { requireUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

/* =========================================================
   POST /api/account/notifications/read

   Body: { id: string } marks ONE of the current user's own
   notifications as read, or { all: true } marks all of them.
   Scoped to user_id so a user can never mark (or even probe
   the existence of) another user's notification.
========================================================= */
export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const body = await readJson(req);

  if (body.all === true) {
    await dbRun(
      "UPDATE notifications SET is_read = 1, read_at = datetime('now') WHERE user_id = ? AND is_read = 0",
      user.id,
    );
    return Response.json({ ok: true });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return Response.json({ error: "Invalid request" }, { status: 400 });

  const existing = await dbFirst<{ id: string }>(
    "SELECT id FROM notifications WHERE id = ? AND user_id = ?",
    id,
    user.id,
  );
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  // Only touches read_at the first time — re-marking an already-read
  // notification never overwrites when it was first read.
  await dbRun(
    "UPDATE notifications SET is_read = 1, read_at = COALESCE(read_at, datetime('now')) WHERE id = ?",
    id,
  );

  return Response.json({ ok: true });
}
