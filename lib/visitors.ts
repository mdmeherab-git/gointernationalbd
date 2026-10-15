import "server-only";
import { dbAll, dbFirst, dbRun, newId } from "./cf";

/* Visitor log: one row per page view, so the admin can see who visited in the
   last 24 hours (and 7 days). No raw IP address is stored, only a salted hash
   used to tell visitors apart. The table is created on first use and rows
   older than 30 days are pruned. */

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await dbRun(
    `CREATE TABLE IF NOT EXISTS visitor_events (
       id TEXT PRIMARY KEY,
       vid TEXT NOT NULL,
       user_id TEXT,
       is_new INTEGER NOT NULL DEFAULT 0,
       path TEXT NOT NULL,
       referrer TEXT NOT NULL DEFAULT '',
       country TEXT NOT NULL DEFAULT '',
       city TEXT NOT NULL DEFAULT '',
       device TEXT NOT NULL DEFAULT '',
       browser TEXT NOT NULL DEFAULT '',
       os TEXT NOT NULL DEFAULT '',
       ip_hash TEXT NOT NULL DEFAULT '',
       created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
     )`,
  );
  await dbRun("CREATE INDEX IF NOT EXISTS idx_visitor_events_created ON visitor_events(created_at)");
  await dbRun("CREATE INDEX IF NOT EXISTS idx_visitor_events_vid ON visitor_events(vid, created_at)");
  tableReady = true;
}

/* ------------------------------ user agent ------------------------------ */

const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|uptime|monitor|facebookexternalhit|curl|wget|python|axios|go-http|java\/|okhttp|scrapy|httpclient|node-fetch/i;

export function isBot(userAgent: string): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

export function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  const device = /ipad|tablet|kindle|silk/i.test(ua)
    ? "tablet"
    : /mobi|android|iphone|ipod/i.test(ua)
      ? "mobile"
      : "desktop";

  // In-app browsers first: much of the traffic arrives from Facebook links.
  const browser = /fban|fbav|fb_iab/i.test(ua)
    ? "Facebook app"
    : /instagram/i.test(ua)
      ? "Instagram app"
      : /messenger/i.test(ua)
        ? "Messenger app"
        : /samsungbrowser/i.test(ua)
          ? "Samsung Browser"
          : /edg\//i.test(ua)
            ? "Edge"
            : /opr\/|opera/i.test(ua)
              ? "Opera"
              : /firefox|fxios/i.test(ua)
                ? "Firefox"
                : /chrome|crios/i.test(ua)
                  ? "Chrome"
                  : /safari/i.test(ua)
                    ? "Safari"
                    : "Other";

  const os = /android/i.test(ua)
    ? "Android"
    : /iphone|ipad|ipod/i.test(ua)
      ? "iOS"
      : /windows/i.test(ua)
        ? "Windows"
        : /mac os|macintosh/i.test(ua)
          ? "macOS"
          : /linux/i.test(ua)
            ? "Linux"
            : "Other";

  return { device, browser, os };
}

export function geoFromHeaders(headers: Headers): { country: string; city: string } {
  const country = (headers.get("x-vercel-ip-country") || headers.get("cf-ipcountry") || "")
    .trim()
    .toUpperCase()
    .slice(0, 2);
  let city = headers.get("x-vercel-ip-city") || headers.get("cf-ipcity") || "";
  try {
    city = decodeURIComponent(city);
  } catch {
    /* keep as is */
  }
  return { country: country === "XX" ? "" : country, city: city.trim().slice(0, 60) };
}

export async function hashIp(ip: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* -------------------------------- writing -------------------------------- */

export type VisitInput = {
  vid: string;
  isNew: boolean;
  userId: string | null;
  path: string;
  referrer: string;
  country: string;
  city: string;
  userAgent: string;
  ipHash: string;
};

export async function recordVisit(v: VisitInput): Promise<void> {
  await ensureTable();

  // The same visitor reloading the same page within 30 seconds counts once.
  const recent = await dbFirst<{ id: string }>(
    `SELECT id FROM visitor_events
      WHERE vid = ? AND path = ?
        AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ','now','-30 seconds')
      LIMIT 1`,
    v.vid,
    v.path,
  );
  if (recent) return;

  const { device, browser, os } = parseUserAgent(v.userAgent);

  await dbRun(
    `INSERT INTO visitor_events
       (id, vid, user_id, is_new, path, referrer, country, city, device, browser, os, ip_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    newId("vis"),
    v.vid,
    v.userId,
    v.isNew ? 1 : 0,
    v.path,
    v.referrer,
    v.country,
    v.city,
    device,
    browser,
    os,
    v.ipHash,
  );

  if (Math.random() < 0.02) {
    await dbRun(
      "DELETE FROM visitor_events WHERE created_at < strftime('%Y-%m-%dT%H:%M:%fZ','now','-30 days')",
    );
  }
}

/* -------------------------------- reading -------------------------------- */

export type VisitorSummary = {
  range: "24h" | "7d";
  totals: { pageViews: number; visitors: number; newVisitors: number; registered: number };
  buckets: { bucket: string; pageViews: number; visitors: number }[];
  topPages: { path: string; pageViews: number; visitors: number }[];
  countries: { name: string; visitors: number }[];
  devices: { name: string; visitors: number }[];
  browsers: { name: string; visitors: number }[];
  referrers: { name: string; visitors: number }[];
  visitors: {
    vid: string;
    userName: string | null;
    lastSeen: string;
    firstSeen: string;
    pages: number;
    country: string;
    city: string;
    device: string;
    browser: string;
    os: string;
    lastPath: string;
    isNew: number;
  }[];
};

export async function readVisitorSummary(range: "24h" | "7d"): Promise<VisitorSummary> {
  await ensureTable();

  const since = range === "7d" ? "-7 days" : "-24 hours";
  const sinceSql = "strftime('%Y-%m-%dT%H:%M:%fZ','now', ?)";
  const bucketLen = range === "7d" ? 10 : 13; // day vs hour

  const totalsRow = await dbFirst<{
    pv: number | null;
    uv: number | null;
    nv: number | null;
    rv: number | null;
  }>(
    `SELECT COUNT(*) AS pv,
            COUNT(DISTINCT vid) AS uv,
            COUNT(DISTINCT CASE WHEN is_new = 1 THEN vid END) AS nv,
            COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN vid END) AS rv
       FROM visitor_events WHERE created_at > ${sinceSql}`,
    since,
  );

  const buckets = await dbAll<{ bucket: string; pv: number; uv: number }>(
    `SELECT substr(created_at, 1, ${bucketLen}) AS bucket, COUNT(*) AS pv, COUNT(DISTINCT vid) AS uv
       FROM visitor_events WHERE created_at > ${sinceSql}
      GROUP BY bucket ORDER BY bucket`,
    since,
  );

  const topPages = await dbAll<{ path: string; pv: number; uv: number }>(
    `SELECT path, COUNT(*) AS pv, COUNT(DISTINCT vid) AS uv
       FROM visitor_events WHERE created_at > ${sinceSql}
      GROUP BY path ORDER BY pv DESC LIMIT 10`,
    since,
  );

  const breakdown = (column: string, empty: string, limit: number) =>
    dbAll<{ name: string; uv: number }>(
      `SELECT COALESCE(NULLIF(${column}, ''), '${empty}') AS name, COUNT(DISTINCT vid) AS uv
         FROM visitor_events WHERE created_at > ${sinceSql}
        GROUP BY name ORDER BY uv DESC LIMIT ${limit}`,
      since,
    );

  const [countries, devices, browsers, referrers] = await Promise.all([
    breakdown("country", "??", 10),
    breakdown("device", "?", 5),
    breakdown("browser", "Other", 8),
    breakdown("referrer", "direct", 8),
  ]);

  // One row per visitor; the bare columns come from that visitor's latest visit.
  const visitors = await dbAll<{
    vid: string;
    user_id: string | null;
    last_seen: string;
    first_seen: string;
    pages: number;
    country: string;
    city: string;
    device: string;
    browser: string;
    os: string;
    path: string;
    is_new: number;
    user_name: string | null;
  }>(
    `SELECT v.vid, v.user_id, v.last_seen, v.first_seen, v.pages, v.country, v.city,
            v.device, v.browser, v.os, v.path, v.is_new, u.name AS user_name
       FROM (
         SELECT vid, MAX(user_id) AS user_id, MAX(created_at) AS last_seen,
                MIN(created_at) AS first_seen, COUNT(*) AS pages,
                country, city, device, browser, os, path, MAX(is_new) AS is_new
           FROM visitor_events WHERE created_at > ${sinceSql}
          GROUP BY vid
       ) v
       LEFT JOIN users u ON u.id = v.user_id
      ORDER BY v.last_seen DESC LIMIT 150`,
    since,
  );

  return {
    range,
    totals: {
      pageViews: Number(totalsRow?.pv ?? 0),
      visitors: Number(totalsRow?.uv ?? 0),
      newVisitors: Number(totalsRow?.nv ?? 0),
      registered: Number(totalsRow?.rv ?? 0),
    },
    buckets: buckets.map((b) => ({ bucket: b.bucket, pageViews: Number(b.pv), visitors: Number(b.uv) })),
    topPages: topPages.map((p) => ({ path: p.path, pageViews: Number(p.pv), visitors: Number(p.uv) })),
    countries: countries.map((c) => ({ name: c.name, visitors: Number(c.uv) })),
    devices: devices.map((c) => ({ name: c.name, visitors: Number(c.uv) })),
    browsers: browsers.map((c) => ({ name: c.name, visitors: Number(c.uv) })),
    referrers: referrers.map((c) => ({ name: c.name, visitors: Number(c.uv) })),
    visitors: visitors.map((v) => ({
      vid: v.vid,
      userName: v.user_name,
      lastSeen: v.last_seen,
      firstSeen: v.first_seen,
      pages: Number(v.pages),
      country: v.country,
      city: v.city,
      device: v.device,
      browser: v.browser,
      os: v.os,
      lastPath: v.path,
      isNew: Number(v.is_new),
    })),
  };
}
