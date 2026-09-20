import { dbAll, dbFirst } from "@/lib/cf";
import type { NotificationRow } from "@/lib/data";
import { requireUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

/* =========================================================
   GET /api/account/notifications

   Returns the CURRENT session user's OWN notifications plus
   an unread count for the header badge.
========================================================= */
export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const [rows, unreadRow] = await Promise.all([
    dbAll<NotificationRow>(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
      user.id,
    ),
    dbFirst<{ count: number }>(
      "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0",
      user.id,
    ),
  ]);

  return Response.json({ notifications: rows, unreadCount: unreadRow?.count ?? 0 });
}
