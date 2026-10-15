import "server-only";
import { dbFirst, dbRun } from "./cf";
import { DEFAULT_CHAT_WELCOME } from "./chat-welcome-default";

/** The welcome text from Settings. The column is added on first save, so a
 *  missing column means "never edited" and the default applies. */
export async function getChatWelcomeMessage(): Promise<string> {
  try {
    const row = await dbFirst<{ chat_welcome_message?: string | null }>(
      "SELECT * FROM site_settings WHERE id = 'main'",
    );
    if (!row || row.chat_welcome_message === undefined || row.chat_welcome_message === null) {
      return DEFAULT_CHAT_WELCOME;
    }
    return row.chat_welcome_message.trim();
  } catch {
    return DEFAULT_CHAT_WELCOME;
  }
}

/** Puts the office's welcome into a brand-new user conversation as an unread
 *  admin message, so a new member sees "1" on the chat icon. Never throws. */
export async function seedWelcomeMessage(conversationId: string): Promise<void> {
  try {
    const text = await getChatWelcomeMessage();
    if (!text) return;
    await dbRun(
      `INSERT OR IGNORE INTO chat_messages
         (id, conversation_id, sender_type, sender_user_id, message, is_read)
       VALUES (?, ?, 'admin', NULL, ?, 0)`,
      `welcome-${conversationId}`,
      conversationId,
      text,
    );
  } catch {
    /* the chat must still work without it */
  }
}
