import "server-only";

/* ===========================================================================
   Shared row + DTO types and the sample data used as a fallback whenever the
   D1 database is not configured / reachable. Keeps the public site working
   before Cloudflare setup is finished.
=========================================================================== */

export type Status = "active" | "inactive";
export type ApplicationStatus =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "rejected"
  | "hired";
export type NoticeTag = "new" | "general" | "report";

export interface CircularRow {
  id: string;
  country: string;
  country_code: string;
  flag: string;
  category: string;
  title: string;
  sponsor: string;
  salary: string;
  vacancy: number;
  duty: string;
  accommodation: string;
  deadline: string;
  posted: string;
  description: string;
  requirements: string; // JSON array
  circular_url: string | null;
  circular_type: string | null;
  is_featured: number;
  featured_image_url: string | null;
  status: Status;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ApiCircular {
  id: string;
  country: string;
  countryCode: string;
  flag: string;
  category: string;
  title: string;
  sponsor: string;
  salary: string;
  vacancy: number;
  duty: string;
  accommodation: string;
  deadline: string;
  posted: string;
  description: string;
  requirements: string[];
  circularUrl: string | null;
  circularType: "image" | "pdf" | null;
  isFeatured: boolean;
  featuredImageUrl: string | null;
  status: Status;
  sortOrder: number;
}

export function circularRowToApi(row: CircularRow): ApiCircular {
  let requirements: string[] = [];
  try {
    const parsed = JSON.parse(row.requirements || "[]");
    if (Array.isArray(parsed)) requirements = parsed.map(String);
  } catch {
    /* ignore malformed JSON */
  }
  return {
    id: row.id,
    country: row.country,
    countryCode: row.country_code,
    flag: row.flag,
    category: row.category,
    title: row.title,
    sponsor: row.sponsor,
    salary: row.salary,
    vacancy: Number(row.vacancy) || 0,
    duty: row.duty,
    accommodation: row.accommodation,
    deadline: row.deadline,
    posted: row.posted,
    description: row.description,
    requirements,
    circularUrl: row.circular_url,
    circularType:
      row.circular_type === "image" || row.circular_type === "pdf"
        ? row.circular_type
        : null,
    isFeatured: !!row.is_featured,
    featuredImageUrl: row.featured_image_url,
    status: row.status,
    sortOrder: Number(row.sort_order) || 0,
  };
}

export interface NoticeRow {
  id: string;
  title_bn: string;
  title_en: string;
  notice_date: string;
  tag_type: NoticeTag;
  tag_label_bn: string;
  tag_label_en: string;
  status: Status;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface PopularCountryRow {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  visible: number;
}

export interface SiteSettingsRow {
  id: string;
  contact_phone: string;
  contact_whatsapp: string;
  contact_email: string;
  office_address: string;
  notice_enabled: number;
  notice_bn: string;
  notice_en: string;
  notice_speed: number;
  notice_direction: "left" | "right";
  updated_at?: string;
}

/* ---- Fallback sample data ------------------------------------------------- */

export const FALLBACK_CIRCULARS: ApiCircular[] = [
  {
    id: "seed-cir-1", country: "Saudi Arabia", countryCode: "sa", flag: "🇸🇦",
    category: "Driver", title: "Driver", sponsor: "MCL Overseas", salary: "SAR 1,500",
    vacancy: 20, duty: "8 Hours", accommodation: "Provided", deadline: "30 Aug 2026",
    posted: "19 Aug 2026",
    description: "Experienced drivers are required for an overseas employment opportunity in Saudi Arabia.",
    requirements: ["Valid passport", "Driving experience", "Medical fitness", "Basic communication ability"],
    circularUrl: null, circularType: null, isFeatured: false, featuredImageUrl: null,
    status: "active", sortOrder: 1,
  },
  {
    id: "seed-cir-2", country: "Saudi Arabia", countryCode: "sa", flag: "🇸🇦",
    category: "Factory Worker", title: "Factory Worker", sponsor: "MCL Overseas", salary: "SAR 1,300",
    vacancy: 50, duty: "8 Hours", accommodation: "Provided", deadline: "02 Sep 2026",
    posted: "19 Aug 2026",
    description: "Factory workers are required for a reputed company in Saudi Arabia.",
    requirements: ["Valid passport", "Physically fit", "Factory work ability", "Medical fitness"],
    circularUrl: null, circularType: null, isFeatured: false, featuredImageUrl: null,
    status: "active", sortOrder: 2,
  },
  {
    id: "seed-cir-3", country: "Saudi Arabia", countryCode: "sa", flag: "🇸🇦",
    category: "Electrician", title: "Electrician", sponsor: "MCL Overseas", salary: "SAR 1,700",
    vacancy: 25, duty: "8 Hours", accommodation: "Provided", deadline: "05 Sep 2026",
    posted: "19 Aug 2026",
    description: "Skilled electricians are required for electrical installation and maintenance work.",
    requirements: ["Electrical work experience", "Valid passport", "Technical knowledge", "Medical fitness"],
    circularUrl: null, circularType: null, isFeatured: false, featuredImageUrl: null,
    status: "active", sortOrder: 3,
  },
  {
    id: "seed-cir-4", country: "Malaysia", countryCode: "my", flag: "🇲🇾",
    category: "Factory Worker", title: "Factory Worker", sponsor: "MCL Overseas", salary: "RM 1,700",
    vacancy: 100, duty: "8 Hours", accommodation: "Provided", deadline: "10 Sep 2026",
    posted: "19 Aug 2026",
    description: "Factory workers are required for a Malaysian industrial company.",
    requirements: ["Valid passport", "Physically fit", "Factory work ability", "Medical fitness"],
    circularUrl: null, circularType: null, isFeatured: false, featuredImageUrl: null,
    status: "active", sortOrder: 4,
  },
  {
    id: "seed-cir-5", country: "UAE", countryCode: "ae", flag: "🇦🇪",
    category: "Electrician", title: "Electrician", sponsor: "MCL Overseas", salary: "AED 1,500",
    vacancy: 30, duty: "8 Hours", accommodation: "Provided", deadline: "08 Sep 2026",
    posted: "18 Aug 2026",
    description: "Experienced electricians are required for technical work in the UAE.",
    requirements: ["Electrical experience", "Technical knowledge", "Valid passport", "Medical fitness"],
    circularUrl: null, circularType: null, isFeatured: false, featuredImageUrl: null,
    status: "active", sortOrder: 5,
  },
  {
    id: "seed-cir-6", country: "Qatar", countryCode: "qa", flag: "🇶🇦",
    category: "Welder", title: "Welder", sponsor: "MCL Overseas", salary: "QAR 1,500",
    vacancy: 15, duty: "8 Hours", accommodation: "Provided", deadline: "12 Sep 2026",
    posted: "18 Aug 2026",
    description: "Skilled welders are required for industrial and construction-related work.",
    requirements: ["Welding experience", "Technical skill", "Valid passport", "Medical fitness"],
    circularUrl: null, circularType: null, isFeatured: false, featuredImageUrl: null,
    status: "active", sortOrder: 6,
  },
  {
    id: "seed-cir-7", country: "Oman", countryCode: "om", flag: "🇴🇲",
    category: "Cleaner", title: "Cleaner", sponsor: "MCL Overseas", salary: "OMR 120",
    vacancy: 40, duty: "8 Hours", accommodation: "Provided", deadline: "15 Sep 2026",
    posted: "17 Aug 2026",
    description: "Cleaners are required for general cleaning and maintenance duties in Oman.",
    requirements: ["Valid passport", "Physically fit", "Responsible attitude", "Medical fitness"],
    circularUrl: null, circularType: null, isFeatured: false, featuredImageUrl: null,
    status: "active", sortOrder: 7,
  },
];

export const FALLBACK_NOTICES = [
  {
    id: "seed-not-1",
    title_bn: "সম্প্রতি সংযুক্ত আরব আমিরাতে ভিসা বাতিল হওয়া প্রবাসী বাংলাদেশি নাগরিকদের তথ্য নিম্নে দেখুন",
    title_en: "Information on Bangladeshi nationals whose UAE visas were recently cancelled",
    notice_date: "2026-09-01", tag_type: "new" as NoticeTag,
    tag_label_bn: "নতুন", tag_label_en: "New", status: "active" as Status, sort_order: 1,
  },
  {
    id: "seed-not-2",
    title_bn: "৩ ক্যাটাগরিতে বাণিজ্যিক গুরুত্বপূর্ণ ব্যক্তি (অনিবাসী বাংলাদেশি)-২০২৭ নির্বাচন সংক্রান্ত বিজ্ঞপ্তি",
    title_en: "Notice on the 2027 selection of commercially important persons (NRB) in 3 categories",
    notice_date: "2026-08-30", tag_type: "new" as NoticeTag,
    tag_label_bn: "নতুন", tag_label_en: "New", status: "active" as Status, sort_order: 2,
  },
  {
    id: "seed-not-3",
    title_bn: "বার্ষিক ক্রয় পরিকল্পনা ২০২৬-২৭",
    title_en: "Annual procurement plan 2026-27",
    notice_date: "2026-08-17", tag_type: "report" as NoticeTag,
    tag_label_bn: "বিভিন্ন প্রতিবেদন", tag_label_en: "Reports", status: "active" as Status, sort_order: 3,
  },
];

export const FALLBACK_POPULAR_COUNTRIES = [
  { code: "my", name: "Malaysia" }, { code: "sa", name: "Saudi Arabia" },
  { code: "ae", name: "UAE" }, { code: "kw", name: "Kuwait" },
  { code: "qa", name: "Qatar" }, { code: "om", name: "Oman" },
  { code: "sg", name: "Singapore" }, { code: "ro", name: "Romania" },
  { code: "rs", name: "Serbia" }, { code: "it", name: "Italy" },
  { code: "hu", name: "Hungary" }, { code: "lt", name: "Lithuania" },
  { code: "bh", name: "Bahrain" }, { code: "at", name: "Austria" },
  { code: "be", name: "Belgium" },
].map((c, i) => ({ id: `pc-${c.code}`, code: c.code, name: c.name, sortOrder: i + 1, visible: true }));

export const FALLBACK_SETTINGS = {
  contactPhone: "",
  contactWhatsapp: "",
  contactEmail: "",
  officeAddress: "",
  noticeEnabled: true,
  noticeBn: "বিশেষ বিজ্ঞপ্তি: নতুন চাকরির সার্কুলার প্রকাশিত হয়েছে। বিস্তারিত জানতে সার্কুলার দেখুন।",
  noticeEn: "Special Notice: New overseas job circulars have been published. Check the latest circulars for details.",
  noticeSpeed: 25,
  noticeDirection: "left" as "left" | "right",
};

export function settingsRowToApi(row: SiteSettingsRow | null) {
  if (!row) return FALLBACK_SETTINGS;
  return {
    contactPhone: row.contact_phone ?? "",
    contactWhatsapp: row.contact_whatsapp ?? "",
    contactEmail: row.contact_email ?? "",
    officeAddress: row.office_address ?? "",
    noticeEnabled: !!row.notice_enabled,
    noticeBn: row.notice_bn ?? "",
    noticeEn: row.notice_en ?? "",
    noticeSpeed: Number(row.notice_speed) || 25,
    noticeDirection: row.notice_direction === "right" ? "right" : "left",
  };
}
