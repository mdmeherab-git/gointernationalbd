import { requireAdmin } from "@/lib/admin";
import { dbFirst } from "@/lib/cf";
import { readJson } from "@/lib/crud";
import { createNotification, type NotificationType } from "@/lib/notify";

export const dynamic = "force-dynamic";

const TYPES: NotificationType[] = ["application", "visa", "medical", "flight", "general"];

/* =========================================================
   POST /api/admin/notifications

   Admin sends a manual notification to one specific user.
   Body: { userId, title, message, type?, link? }
========================================================= */
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const body = await readJson(req);
  const userId = typeof body.userId === "string" ? body.userId : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const link = typeof body.link === "string" && body.link.trim() ? body.link.trim() : null;
  const type = TYPES.includes(body.type as NotificationType) ? (body.type as NotificationType) : "general";

  if (!userId || !title || !message) {
    return Response.json({ error: "userId, title ও message দিন" }, { status: 400 });
  }

  const user = await dbFirst<{ id: string }>("SELECT id FROM users WHERE id = ?", userId);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const id = await createNotification(userId, { title, message, type, link });
  return Response.json({ ok: true, id, sent: id !== null });
}
