/**
 * Data bindings for route handlers (server-only).
 *
 * Works in three environments, in this order of preference:
 *   1. Cloudflare Workers runtime  -> native D1 / R2 bindings
 *   2. Anywhere else (Vercel, Node) -> Cloudflare D1 REST API + R2 S3 API,
 *      driven by CLOUDFLARE_* / R2_* environment variables
 *   3. Nothing configured          -> getDb()/getUploads() return null and the
 *      public routes fall back to their bundled sample data
 */

import "server-only";
import { AwsClient } from "aws4fetch";

// --- Minimal D1 / R2 shapes (no hard dep on @cloudflare/workers-types) -------
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
  batch<T = Record<string, unknown>>(
    statements: D1PreparedStatement[],
  ): Promise<D1Result<T>[]>;
}
export interface R2Bucket {
  get(key: string): Promise<{
    body: ReadableStream;
    httpMetadata?: { contentType?: string };
    size: number;
  } | null>;
  put(
    key: string,
    value: ArrayBuffer | ReadableStream | string,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
}

type CfEnv = {
  DB?: D1Database;
  UPLOADS?: R2Bucket;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  [key: string]: unknown;
};

// --- 1. Cloudflare Workers context (only resolves when running on Workers) ---
async function loadContextEnv(): Promise<CfEnv | null> {
  try {
    const mod = await import("@opennextjs/cloudflare");
    const { env } = await mod.getCloudflareContext({ async: true });
    return env as unknown as CfEnv;
  } catch {
    return null;
  }
}

// --- 2a. Cloudflare D1 over the REST API ------------------------------------
function makeHttpD1(accountId: string, databaseId: string, apiToken: string): D1Database {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  async function exec(sql: string, params: unknown[]): Promise<{ results?: unknown[]; meta?: unknown }> {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    });
    const json = (await res.json().catch(() => null)) as
      | { success?: boolean; result?: { results?: unknown[]; meta?: unknown }[]; errors?: { message: string }[] }
      | null;
    if (!res.ok || !json?.success) {
      const msg =
        json?.errors?.map((e) => e.message).join("; ") || `D1 REST error ${res.status}`;
      throw new Error(msg);
    }
    return json.result?.[0] ?? { results: [] };
  }

  const makeStmt = (sql: string, params: unknown[]): D1PreparedStatement => ({
    bind: (...values: unknown[]) => makeStmt(sql, values),
    all: async <T,>() => {
      const r = await exec(sql, params);
      return { results: (r.results ?? []) as T[], success: true } as D1Result<T>;
    },
    first: async <T,>() => {
      const r = await exec(sql, params);
      return (((r.results ?? [])[0] as T) ?? null) as T | null;
    },
    run: async <T,>() => {
      const r = await exec(sql, params);
      return { results: [], success: true, meta: r.meta } as D1Result<T>;
    },
  });

  return {
    prepare: (sql: string) => makeStmt(sql, []),
    batch: async <T,>(statements: D1PreparedStatement[]) => {
      const out: D1Result<T>[] = [];
      for (const s of statements) out.push((await s.run<T>()) as D1Result<T>);
      return out;
    },
  };
}

// --- 2b. Cloudflare R2 over the S3-compatible API -------------------------
function makeS3R2(
  accountId: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
): R2Bucket {
  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto",
  });
  const base = `https://${accountId}.r2.cloudflarestorage.com/${bucket}`;
  const url = (key: string) => `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;

  return {
    async get(key) {
      const r = await client.fetch(url(key));
      if (!r.ok || !r.body) return null;
      return {
        body: r.body,
        httpMetadata: { contentType: r.headers.get("content-type") || undefined },
        size: Number(r.headers.get("content-length") || 0),
      };
    },
    async put(key, value, options) {
      const headers: Record<string, string> = {};
      if (options?.httpMetadata?.contentType)
        headers["content-type"] = options.httpMetadata.contentType;
      const r = await client.fetch(url(key), {
        method: "PUT",
        body: value as BodyInit,
        headers,
      });
      if (!r.ok) throw new Error(`R2 upload failed (${r.status})`);
      return r;
    },
    async delete(key) {
      await client.fetch(url(key), { method: "DELETE" });
    },
  };
}

// --- Public accessors -----------------------------------------------------
export async function getEnv(): Promise<CfEnv> {
  const ctx = await loadContextEnv();
  const fromProcess: CfEnv = {
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  };
  if (!ctx) return fromProcess;
  return {
    ...ctx,
    ADMIN_PASSWORD: (ctx.ADMIN_PASSWORD as string) ?? fromProcess.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET:
      (ctx.ADMIN_SESSION_SECRET as string) ?? fromProcess.ADMIN_SESSION_SECRET,
  };
}

export async function getDb(): Promise<D1Database | null> {
  const ctx = await loadContextEnv();
  if (ctx?.DB) return ctx.DB;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (accountId && databaseId && apiToken) {
    return makeHttpD1(accountId, databaseId, apiToken);
  }
  return null;
}

export async function getUploads(): Promise<R2Bucket | null> {
  const ctx = await loadContextEnv();
  if (ctx?.UPLOADS) return ctx.UPLOADS;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || "gib-uploads";
  if (accountId && accessKeyId && secretAccessKey) {
    return makeS3R2(accountId, accessKeyId, secretAccessKey, bucket);
  }
  return null;
}

// --- Query helpers ------------------------------------------------------
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
  if (!db) throw new Error("Database is not configured");
  await db.prepare(sql).bind(...params).run();
}

export function newId(prefix = ""): string {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}-${uuid}` : uuid;
}
