import "server-only";
import { dbFirst, dbRun, newId } from "./cf";

/**
 * Shared notification creator, used by both admin manual "send
 * notification" and automatic status-change notifications. Respects the
 * user's own notification preference toggle for that type — a disabled
 * preference silently skips the insert rather than erroring, since this
 * is always a best-effort side effect of some other admin action.
 */

export type NotificationType = "application" | "visa" | "medical" | "flight" | "general";

const PREF_COLUMN: Record<NotificationType, string> = {
  application: "notify_application",
  // Flight updates are part of the visa/processing pipeline and share its
  // toggle — Account Settings only exposes one "Visa updates" preference.
  visa: "notify_visa",
  flight: "notify_visa",
  medical: "notify_medical",
  general: "notify_general",
};

type PrefRow = Record<string, number>;

export async function createNotification(
  userId: string,
  input: { title: string; message: string; type: NotificationType; link?: string | null },
): Promise<string | null> {
  const column = PREF_COLUMN[input.type];
  const pref = await dbFirst<PrefRow>(`SELECT ${column} AS enabled FROM users WHERE id = ?`, userId);
  if (pref && Number(pref.enabled) === 0) return null;

  const id = newId("ntf");
  await dbRun(
    `INSERT INTO notifications (id, user_id, title, message, type, link, is_read)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    id,
    userId,
    input.title,
    input.message,
    input.type,
    input.link ?? null,
  );
  return id;
}
