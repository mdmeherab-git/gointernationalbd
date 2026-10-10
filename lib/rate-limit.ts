import { dbFirst, dbRun } from "@/lib/cf";

/* =========================================================
   Small fixed-window rate limiter backed by the existing D1
   database, so the counters survive across serverless
   instances. The table is created on first use.

   It FAILS OPEN: if the database is unavailable the request is
   allowed, so a limiter problem can never take the site down.
========================================================= */

type Row = { count: number; window_start: number };

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;

  await dbRun(
    `CREATE TABLE IF NOT EXISTS rate_limits (
       key TEXT PRIMARY KEY,
       count INTEGER NOT NULL,
       window_start INTEGER NOT NULL
     )`,
  );

  tableReady = true;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export type RateLimitResult = {
  blocked: boolean;
  /** Seconds until the window resets (only meaningful when blocked). */
  retryAfter: number;
};

const OK: RateLimitResult = { blocked: false, retryAfter: 0 };

/**
 * Count one hit for `key` and report whether the caller is now over
 * `limit` hits inside the current `windowSeconds` window.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  try {
    await ensureTable();

    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const row = await dbFirst<Row>(
      "SELECT count, window_start FROM rate_limits WHERE key = ?",
      key,
    );

    if (!row || now - row.window_start >= windowMs) {
      await dbRun(
        `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
         ON CONFLICT(key) DO UPDATE SET count = 1, window_start = excluded.window_start`,
        key,
        now,
      );
      return OK;
    }

    const count = row.count + 1;

    await dbRun("UPDATE rate_limits SET count = ? WHERE key = ?", count, key);

    if (count > limit) {
      return {
        blocked: true,
        retryAfter: Math.max(
          1,
          Math.ceil((row.window_start + windowMs - now) / 1000),
        ),
      };
    }

    return OK;
  } catch {
    return OK;
  }
}

/**
 * Read-only check: is `key` already at/over `limit` inside the window?
 * Used for login attempts, where only FAILED attempts should count.
 */
export async function isRateLimited(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  try {
    await ensureTable();

    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const row = await dbFirst<Row>(
      "SELECT count, window_start FROM rate_limits WHERE key = ?",
      key,
    );

    if (!row || now - row.window_start >= windowMs || row.count < limit) {
      return OK;
    }

    return {
      blocked: true,
      retryAfter: Math.max(
        1,
        Math.ceil((row.window_start + windowMs - now) / 1000),
      ),
    };
  } catch {
    return OK;
  }
}

/** Forget a key (e.g. after a successful login). */
export async function clearRateLimit(key: string): Promise<void> {
  try {
    await ensureTable();
    await dbRun("DELETE FROM rate_limits WHERE key = ?", key);
  } catch {
    // Fail open.
  }
}

export function tooManyRequests(
  retryAfter: number,
  message = "অনেক বেশি চেষ্টা হয়েছে, একটু পরে আবার চেষ্টা করুন / Too many attempts, please try again later",
) {
  return Response.json(
    { error: message },
    { status: 429, headers: { "retry-after": String(retryAfter) } },
  );
}
