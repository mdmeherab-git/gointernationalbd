/* Which admin sections the owner can hand to an employee, and the rule that
   maps every admin API / page path to the section it belongs to. Pure data and
   functions (no server imports) so the proxy, the API guard and the admin UI
   all share one source of truth. */

export const STAFF_PERMISSIONS = [
  "circulars",
  "notices",
  "applications",
  "users",
  "countries",
  "chat",
  "broadcast",
] as const;

export type StaffPermission = (typeof STAFF_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<StaffPermission, { bn: string; en: string; icon: string }> = {
  circulars: { bn: "সার্কুলার", en: "Circulars", icon: "📄" },
  notices: { bn: "নোটিশ", en: "Notices", icon: "📢" },
  applications: { bn: "আবেদনসমূহ", en: "Applications", icon: "👤" },
  users: { bn: "রেজিস্টার্ড ইউজার", en: "Registered Users", icon: "👥" },
  countries: { bn: "দেশ (জনপ্রিয় ও বাংলা নাম)", en: "Countries", icon: "🌍" },
  chat: { bn: "চ্যাট সেন্টার", en: "Chat Center", icon: "💬" },
  broadcast: { bn: "ইউজারদের বার্তা পাঠানো", en: "Message Users", icon: "📣" },
};

/** Ready-made bundles for the "add staff" form. */
export const PERMISSION_PRESETS: {
  key: string;
  bn: string;
  en: string;
  permissions: StaffPermission[];
}[] = [
  { key: "chat", bn: "চ্যাট সাপোর্ট", en: "Chat support", permissions: ["chat"] },
  {
    key: "applications",
    bn: "আবেদন অফিসার",
    en: "Applications officer",
    permissions: ["applications", "users", "chat"],
  },
  {
    key: "content",
    bn: "কনটেন্ট এডিটর",
    en: "Content editor",
    permissions: ["circulars", "notices", "countries"],
  },
];

export function isStaffPermission(value: unknown): value is StaffPermission {
  return typeof value === "string" && (STAFF_PERMISSIONS as readonly string[]).includes(value);
}

/** Keeps only known permissions, de-duplicated, in a stable order. */
export function cleanPermissions(input: unknown): StaffPermission[] {
  const list = Array.isArray(input) ? input : [];
  return STAFF_PERMISSIONS.filter((p) => list.includes(p));
}

/* What a path needs:
     "owner"        only the owner (never staff)
     "any"          any signed-in admin or staff (harmless read-only basics)
     string[]       staff need AT LEAST ONE of these permissions
   Anything not listed is owner-only, so a new admin route is safe by default. */
export type PathRule = "owner" | "any" | StaffPermission[];

export function apiPathRule(pathname: string, method: string): PathRule {
  const p = pathname.replace(/\/+$/, "");
  const m = method.toUpperCase();

  if (p === "/api/admin/stats" || p === "/api/admin/me") return "any";

  if (p.startsWith("/api/admin/circulars")) return ["circulars"];
  if (p.startsWith("/api/admin/notices")) return ["notices"];
  // Image/PDF uploads are shared by circulars and notices.
  if (p.startsWith("/api/admin/upload")) return ["circulars", "notices"];
  if (p.startsWith("/api/admin/applications")) return ["applications"];

  // Password resets and deleting accounts stay with the owner.
  if (/^\/api\/admin\/users\/[^/]+\/reset-password$/.test(p)) return "owner";
  if (m === "DELETE" && /^\/api\/admin\/users\/[^/]+$/.test(p)) return "owner";
  if (p.startsWith("/api/admin/users") || p.startsWith("/api/admin/notifications")) return ["users"];

  if (p.startsWith("/api/admin/popular-countries") || p.startsWith("/api/admin/country-names")) {
    return ["countries"];
  }

  if (p.startsWith("/api/admin/chat/broadcast")) return ["broadcast"];
  if (p.startsWith("/api/admin/chat")) return ["chat"];

  return "owner";
}

/** Admin PAGES staff may open, by section. Everything else is owner-only. */
export function pagePermission(pathname: string): StaffPermission | "any" | "owner" {
  const p = pathname.replace(/\/+$/, "") || "/admin";
  if (p === "/admin") return "any";
  const map: [string, StaffPermission][] = [
    ["/admin/circulars", "circulars"],
    ["/admin/notices", "notices"],
    ["/admin/applications", "applications"],
    ["/admin/users", "users"],
    ["/admin/popular-countries", "countries"],
    ["/admin/country-names", "countries"],
    ["/admin/broadcast", "broadcast"],
    ["/admin/chat", "chat"],
  ];
  for (const [prefix, perm] of map) {
    if (p === prefix || p.startsWith(prefix + "/")) return perm;
  }
  return "owner";
}
