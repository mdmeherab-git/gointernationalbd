import { requireAdmin } from "@/lib/admin";
import { dbFirst, getDb } from "@/lib/cf";

export const dynamic = "force-dynamic";

const EMPTY = {
  circularsTotal: 0,
  circularsActive: 0,
  circularsInactive: 0,
  circularsFeatured: 0,
  totalVacancies: 0,
  noticesActive: 0,
  noticesTotal: 0,
  applicationsTotal: 0,
  applicationsNew: 0,
  popularVisible: 0,
  usersTotal: 0,
  usersActive: 0,
  usersDisabled: 0,
  usersNewToday: 0,
  chatConversations: 0,
  chatUnread: 0,
};

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ stats: EMPTY, dbReady: false });

  const row = await dbFirst<Record<string, number>>(`
    SELECT
      (SELECT COUNT(*) FROM circulars) AS circularsTotal,
      (SELECT COUNT(*) FROM circulars WHERE status = 'active') AS circularsActive,
      (SELECT COUNT(*) FROM circulars WHERE status = 'inactive') AS circularsInactive,
      (SELECT COUNT(*) FROM circulars WHERE is_featured = 1) AS circularsFeatured,
      (SELECT COALESCE(SUM(vacancy), 0) FROM circulars WHERE status = 'active') AS totalVacancies,
      (SELECT COUNT(*) FROM notices WHERE status = 'active') AS noticesActive,
      (SELECT COUNT(*) FROM notices) AS noticesTotal,
      (SELECT COUNT(*) FROM applications) AS applicationsTotal,
      (SELECT COUNT(*) FROM applications WHERE status = 'new') AS applicationsNew,
      (SELECT COUNT(*) FROM popular_countries WHERE visible = 1) AS popularVisible,
      (SELECT COUNT(*) FROM users) AS usersTotal,
      (SELECT COUNT(*) FROM users WHERE status = 'active') AS usersActive,
      (SELECT COUNT(*) FROM users WHERE status = 'disabled') AS usersDisabled,
      (SELECT COUNT(*) FROM users WHERE date(created_at) = date('now')) AS usersNewToday,
      (SELECT COUNT(*) FROM chat_conversations WHERE admin_deleted_at IS NULL) AS chatConversations,
      (SELECT COUNT(*) FROM chat_messages m
        JOIN chat_conversations c ON c.id = m.conversation_id
        WHERE m.sender_type = 'user' AND m.is_read = 0 AND c.admin_deleted_at IS NULL) AS chatUnread
  `);

  return Response.json({ stats: { ...EMPTY, ...(row ?? {}) }, dbReady: true });
}
