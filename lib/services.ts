import "server-only";
import { dbAll, dbFirst, dbRun } from "./cf";

/* "Our Services" cards shown on the home page, managed from /admin -> Services.
   The table is created (and filled with a starter set) on first use. */

export type ServiceRow = {
  id: string;
  title_bn: string;
  title_en: string;
  desc_bn: string;
  desc_en: string;
  icon: string;
  link_url: string;
  button_bn: string;
  button_en: string;
  status: "active" | "inactive";
  sort_order: number;
  created_at: string;
  updated_at: string;
};

let ready = false;

const STARTER: Omit<ServiceRow, "id" | "created_at" | "updated_at" | "sort_order" | "status">[] = [
  {
    icon: "🛂",
    title_bn: "ভিসা স্ট্যাটাস চেক",
    title_en: "Visa Status Check",
    desc_bn: "পাসপোর্ট নম্বর দিয়ে সরকারি উৎস থেকে আপনার ভিসার বর্তমান অবস্থা দেখুন।",
    desc_en: "Check your current visa status from official sources using your passport number.",
    link_url: "/#visa-check",
    button_bn: "ভিসা চেক করুন",
    button_en: "Check Visa",
  },
  {
    icon: "💼",
    title_bn: "বিদেশে চাকরির সার্কুলার",
    title_en: "Overseas Job Circulars",
    desc_bn: "বিভিন্ন দেশের সর্বশেষ চাকরির সুযোগ দেখুন এবং সরাসরি আবেদন করুন।",
    desc_en: "Browse the latest job openings in different countries and apply directly.",
    link_url: "/jobs",
    button_bn: "চাকরি দেখুন",
    button_en: "View Jobs",
  },
  {
    icon: "📄",
    title_bn: "ফ্রি সিভি তৈরি",
    title_en: "Free CV Builder",
    desc_bn: "নিজের জন্য এক পেজের প্রফেশনাল সিভি তৈরি করুন এবং PDF হিসেবে নামিয়ে নিন।",
    desc_en: "Create a one-page professional CV and download it as a PDF.",
    link_url: "/account/cv",
    button_bn: "সিভি তৈরি করুন",
    button_en: "Create CV",
  },
  {
    icon: "📋",
    title_bn: "আবেদন ও ভিসা ট্র্যাকিং",
    title_en: "Application & Visa Tracking",
    desc_bn: "আপনার আবেদন, মেডিকেল, ভিসা ও ফ্লাইটের সর্বশেষ অবস্থা এক জায়গায় দেখুন।",
    desc_en: "See your application, medical, visa and flight progress in one place.",
    link_url: "/account/applications",
    button_bn: "ট্র্যাক করুন",
    button_en: "Track Now",
  },
  {
    icon: "🤖",
    title_bn: "AI সহকারী",
    title_en: "AI Assistant",
    desc_bn: "ভিসা, চাকরি ও ইমিগ্রেশন নিয়ে যেকোনো প্রশ্ন করুন, দ্রুত উত্তর পান।",
    desc_en: "Ask anything about visas, jobs and immigration and get quick answers.",
    link_url: "/#ai-assistant",
    button_bn: "প্রশ্ন করুন",
    button_en: "Ask Now",
  },
  {
    icon: "💬",
    title_bn: "সরাসরি পরামর্শ",
    title_en: "Talk to Our Team",
    desc_bn: "আমাদের টিমের সাথে WhatsApp বা চ্যাটে কথা বলুন, আমরা সাহায্য করব।",
    desc_en: "Talk to our team on WhatsApp or chat and we will help you.",
    link_url: "whatsapp",
    button_bn: "WhatsApp-এ জানুন",
    button_en: "Ask on WhatsApp",
  },
];

export async function ensureServicesTable(): Promise<void> {
  if (ready) return;

  const existing = await dbFirst<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'site_services'",
  );

  await dbRun(
    `CREATE TABLE IF NOT EXISTS site_services (
       id TEXT PRIMARY KEY,
       title_bn TEXT NOT NULL DEFAULT '',
       title_en TEXT NOT NULL DEFAULT '',
       desc_bn TEXT NOT NULL DEFAULT '',
       desc_en TEXT NOT NULL DEFAULT '',
       icon TEXT NOT NULL DEFAULT '⭐',
       link_url TEXT NOT NULL DEFAULT '',
       button_bn TEXT NOT NULL DEFAULT '',
       button_en TEXT NOT NULL DEFAULT '',
       status TEXT NOT NULL DEFAULT 'active',
       sort_order INTEGER NOT NULL DEFAULT 0,
       created_at TEXT NOT NULL DEFAULT (datetime('now')),
       updated_at TEXT NOT NULL DEFAULT (datetime('now'))
     )`,
  );

  // Fill the starter set only when the table is brand new, so services the
  // owner later deletes never reappear.
  if (!existing) {
    let order = 1;
    for (const s of STARTER) {
      await dbRun(
        `INSERT INTO site_services
           (id, title_bn, title_en, desc_bn, desc_en, icon, link_url, button_bn, button_en, status, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
        `svc-${crypto.randomUUID()}`,
        s.title_bn,
        s.title_en,
        s.desc_bn,
        s.desc_en,
        s.icon,
        s.link_url,
        s.button_bn,
        s.button_en,
        order++,
      );
    }
  }

  ready = true;
}

export async function listServices(onlyActive: boolean): Promise<ServiceRow[]> {
  await ensureServicesTable();
  return dbAll<ServiceRow>(
    `SELECT * FROM site_services ${onlyActive ? "WHERE status = 'active'" : ""}
      ORDER BY sort_order ASC, created_at ASC`,
  );
}

export async function getService(id: string): Promise<ServiceRow | null> {
  await ensureServicesTable();
  return dbFirst<ServiceRow>("SELECT * FROM site_services WHERE id = ? LIMIT 1", id);
}

/** Where a card's button may point: a site path, an https link, a phone link,
 *  or the keyword "whatsapp" (resolved to the WhatsApp number in Settings). */
export function isValidServiceLink(link: string): boolean {
  if (link === "") return true;
  if (link === "whatsapp") return true;
  if (link.startsWith("/") && !link.startsWith("//")) return true;
  return /^(https:\/\/|tel:|mailto:)/i.test(link);
}
