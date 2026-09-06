import "server-only";

/** Value coercers for D1 writes. */
export const asText = (v: unknown): string => (v == null ? "" : String(v));
export const asTextOrNull = (v: unknown): string | null =>
  v == null || v === "" ? null : String(v);
export const asInt = (v: unknown): number => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? n : 0;
};
export const asBool01 = (v: unknown): number =>
  v === true || v === 1 || v === "1" || v === "true" ? 1 : 0;
export const asJsonArray = (v: unknown): string => {
  if (Array.isArray(v)) return JSON.stringify(v.map((x) => String(x)));
  if (typeof v === "string") {
    // allow a newline / comma separated string too
    const parts = v
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    return JSON.stringify(parts);
  }
  return "[]";
};
export const oneOf =
  <T extends string>(allowed: readonly T[], fallback: T) =>
  (v: unknown): T =>
    allowed.includes(v as T) ? (v as T) : fallback;

export type Coercer = (v: unknown) => unknown;

/**
 * Build a partial `SET a = ?, b = ?` clause from the keys present in `body`
 * that are also in `allowed`.
 */
export function pickUpdate(
  allowed: Record<string, Coercer>,
  body: Record<string, unknown>,
): { setSql: string; values: unknown[]; count: number } {
  const cols: string[] = [];
  const values: unknown[] = [];
  for (const [key, coerce] of Object.entries(allowed)) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      cols.push(`${key} = ?`);
      values.push(coerce(body[key]));
    }
  }
  return { setSql: cols.join(", "), values, count: cols.length };
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const v = await req.json();
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
