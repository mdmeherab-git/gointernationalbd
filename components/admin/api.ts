"use client";

/* Small typed fetch helpers for the admin dashboard. On 401 they bounce the
   user to /admin/login. */

export type Json = Record<string, unknown>;

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/admin/login?next=${next}`;
}

async function readError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    return j?.error || "";
  } catch {
    return "";
  }
}

export async function apiGet<T = Json>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "same-origin", cache: "no-store" });
  if (res.status === 401) {
    redirectToLogin();
    throw new Error("unauthorized");
  }
  if (!res.ok) throw new Error((await readError(res)) || `Request failed (${res.status})`);
  return (await res.json()) as T;
}

export async function apiSend<T = Json>(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
): Promise<T> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: isForm ? undefined : { "content-type": "application/json" },
    body: isForm ? (body as FormData) : body != null ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    redirectToLogin();
    throw new Error("unauthorized");
  }
  if (!res.ok) throw new Error((await readError(res)) || `Request failed (${res.status})`);
  return (await res.json()) as T;
}
