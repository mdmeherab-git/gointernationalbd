/**
 * Cloudflare bindings access for route handlers (server-only).
 *
 * Everything degrades gracefully: if the Cloudflare adapter / wrangler.jsonc /
 * D1 binding is not available (e.g. plain `next dev` before setup), `getDb()`
 * returns null and the public API routes fall back to their bundled sample data.
 */

import "server-only";

// --- Minimal D1 shape (avoids a hard dep on @cloudflare/workers-types) --------
export interface D1Result<T = Record<string, unknown>> {
  results?: T[];
  success: boolean;
  meta?: unknown;
}
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}
export interface R2Bucket {
  get(key: string): Promise<{
    body: ReadableStream;
    httpMetadata?: { contentType?: string };
    size: number;
  } | null>;
  put(key: string, value: ArrayBuffer | ReadableStream | string, options?: {
    httpMetadata?: { contentType?: string };
  }): Promise<unknown>;
  delete(key: string): Promise<void>;
}

type CfEnv = {
  DB?: D1Database;
  UPLOADS?: R2Bucket;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  [key: string]: unknown;
};

async function loadContextEnv(): Promise<CfEnv | null> {
  try {
    const mod = await import("@opennextjs/cloudflare");
    const { env } = await mod.getCloudflareContext({ async: true });
    return env as unknown as CfEnv;
  } catch {
    return null;
  }
}

/** Cloudflare env with a `process.env` fallback for the secret values. */
export async function getEnv(): Promise<CfEnv> {
  const ctx = await loadContextEnv();
  const fallback: CfEnv = {
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  };
  if (!ctx) return fallback;
  return {
    ...ctx,
    ADMIN_PASSWORD: (ctx.ADMIN_PASSWORD as string) ?? fallback.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: (ctx.ADMIN_SESSION_SECRET as string) ?? fallback.ADMIN_SESSION_SECRET,
  };
}

export async function getDb(): Promise<D1Database | null> {
  const ctx = await loadContextEnv();
  return (ctx?.DB as D1Database) ?? null;
}

export async function getUploads(): Promise<R2Bucket | null> {
  const ctx = await loadContextEnv();
  return (ctx?.UPLOADS as R2Bucket) ?? null;
}

// --- Query helpers -----------------------------------------------------------
export async function dbAll<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const db = await getDb();
  if (!db) return [];
  const res = await db.prepare(sql).bind(...params).all<T>();
  return res.results ?? [];
}

export async function dbFirst<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): Promise<T | null> {
  const db = await getDb();
  if (!db) return null;
  return db.prepare(sql).bind(...params).first<T>();
}

export async function dbRun(sql: string, ...params: unknown[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("D1 database is not configured");
  await db.prepare(sql).bind(...params).run();
}

export function newId(prefix = ""): string {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}-${uuid}` : uuid;
}
