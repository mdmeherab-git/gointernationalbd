import "server-only";
import { dbAll, dbFirst, dbRun } from "./cf";

/* Guests (not logged in) must give a name and phone number before they can
   chat. The details live on the conversation row. The columns are added on
   first use, so no manual migration is needed. */

let columnsEnsured = false;

export async function ensureGuestColumns(): Promise<void> {
  if (columnsEnsured) return;
  const cols = await dbAll<{ name: string }>("PRAGMA table_info(chat_conversations)");
  const have = new Set(cols.map((c) => c.name));
  for (const col of ["guest_name", "guest_phone", "guest_email"]) {
    if (!have.has(col)) {
      await dbRun(`ALTER TABLE chat_conversations ADD COLUMN ${col} TEXT`);
    }
  }
  columnsEnsured = true;
}

export type GuestIdentity = {
  name: string;
  phone: string;
  email: string;
};

export async function getGuestIdentity(
  conversationId: string,
): Promise<GuestIdentity | null> {
  await ensureGuestColumns();
  const row = await dbFirst<{
    guest_name: string | null;
    guest_phone: string | null;
    guest_email: string | null;
  }>(
    "SELECT guest_name, guest_phone, guest_email FROM chat_conversations WHERE id = ?",
    conversationId,
  );
  if (!row?.guest_name || !row?.guest_phone) return null;
  return {
    name: row.guest_name,
    phone: row.guest_phone,
    email: row.guest_email || "",
  };
}

/** True when a guest conversation still has no name + phone on file. */
export async function guestNeedsIdentity(conversationId: string): Promise<boolean> {
  return (await getGuestIdentity(conversationId)) === null;
}

export async function saveGuestIdentity(
  conversationId: string,
  identity: GuestIdentity,
): Promise<void> {
  await ensureGuestColumns();
  await dbRun(
    "UPDATE chat_conversations SET guest_name = ?, guest_phone = ?, guest_email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    identity.name,
    identity.phone,
    identity.email || null,
    conversationId,
  );
}

export const IDENTITY_REQUIRED_RESPONSE = {
  error: "চ্যাট শুরুর আগে আপনার নাম ও মোবাইল নম্বর দিন।",
  code: "identity_required",
};
