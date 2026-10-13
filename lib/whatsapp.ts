/* Builds a WhatsApp chat link from whatever the admin typed in Settings:
   a plain number ("+8801872327575" / "01872 327575") or a full wa.me /
   api.whatsapp.com link. Returns "" when nothing usable is configured. */

export function buildWhatsappUrl(input: string, message: string): string {
  const raw = (input || "").trim();
  if (!raw) return "";
  const text = (message || "").trim();

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase();
      const isWhatsapp =
        host === "wa.me" ||
        host.endsWith("whatsapp.com") ||
        host === "chat.whatsapp.com";
      if (!isWhatsapp) return "";
      if (text && !url.searchParams.has("text")) {
        url.searchParams.set("text", text);
      }
      return url.toString();
    } catch {
      return "";
    }
  }

  let digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  // Bangladeshi local format 01XXXXXXXXX -> 8801XXXXXXXXX
  if (digits.length === 11 && digits.startsWith("01")) digits = "88" + digits;
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
