import * as SecureStore from 'expo-secure-store';

/**
 * Central API client for the GO International BD production backend.
 *
 * The website's session is a browser httpOnly cookie (`gib_user`), which a
 * native app has no cookie jar to share. Rather than building a parallel
 * auth system, the login response also returns the raw session id
 * (`sessionToken` — see app/api/auth/login/route.ts on the website) and
 * this client stores it in SecureStore and resends it as a manually-built
 * `Cookie` header on every request. The server-side session table and
 * requireUser() check are exactly the same ones the website itself uses.
 */

export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://gointernationalbd.com').replace(
  /\/+$/,
  '',
);

const SESSION_KEY = 'gib_session_token';

export async function getSessionToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SESSION_KEY);
  } catch {
    return null;
  }
}

export async function setSessionToken(token: string | null): Promise<void> {
  try {
    if (token) await SecureStore.setItemAsync(SESSION_KEY, token);
    else await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch {
    // Secure storage unavailable — the request layer will just behave as
    // logged-out rather than crash.
  }
}

/** Cookie header for manually authenticating an <Image>/<Video> source that
 *  points at a protected endpoint (profile photo, a document file, ...). */
export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getSessionToken();
  return token ? { Cookie: `gib_user=${token}` } : {};
}

export function apiUrl(path: string): string {
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Every image/file URL the backend returns (notice.image_url, circular's
 * circularUrl/featuredImageUrl, ...) is a relative "/api/files/<key>" path,
 * not an absolute URL — the website can use it as-is because the browser
 * resolves it against the current page's origin, but a native app has no
 * such origin and must resolve it against the API base itself. Already-
 * absolute URLs (e.g. a government service link) are returned unchanged.
 */
export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return apiUrl(path);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

function defaultMessageFor(status: number, isBangla: boolean): string {
  if (status === 0)
    return isBangla ? 'ইন্টারনেট সংযোগ পরীক্ষা করুন।' : 'Please check your internet connection.';
  if (status === 401) return isBangla ? 'Login প্রয়োজন।' : 'Please log in.';
  if (status === 403) return isBangla ? 'অনুমতি নেই।' : 'You are not allowed to do that.';
  if (status === 404) return isBangla ? 'পাওয়া যায়নি।' : 'Not found.';
  if (status === 413) return isBangla ? 'ফাইলের সাইজ অনেক বড়।' : 'The file is too large.';
  if (status === 422) return isBangla ? 'তথ্য সঠিক নয়।' : 'The submitted data is invalid.';
  if (status === 429)
    return isBangla ? 'অনেক বেশি চেষ্টা হয়েছে, একটু পরে চেষ্টা করুন।' : 'Too many attempts — try again shortly.';
  if (status >= 500) return isBangla ? 'সার্ভারে সমস্যা হয়েছে।' : 'Something went wrong on the server.';
  return isBangla ? 'কিছু একটা ভুল হয়েছে।' : 'Something went wrong.';
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(
  path: string,
  method: Method,
  body?: unknown,
  isForm = false,
): Promise<T> {
  const token = await getSessionToken();
  const headers: Record<string, string> = {};
  if (!isForm) headers['content-type'] = 'application/json';
  if (token) headers.Cookie = `gib_user=${token}`;

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method,
      headers,
      body: isForm ? (body as FormData) : body != null ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, defaultMessageFor(0, true));
  }

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    // Some endpoints (e.g. file streams) intentionally have no JSON body.
  }

  if (!response.ok) {
    const serverMessage = (json as { error?: string } | null)?.error;
    throw new ApiError(response.status, serverMessage || defaultMessageFor(response.status, true));
  }

  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, 'GET'),
  post: <T>(path: string, body?: unknown) => request<T>(path, 'POST', body),
  put: <T>(path: string, body?: unknown) => request<T>(path, 'PUT', body),
  patch: <T>(path: string, body?: unknown) => request<T>(path, 'PATCH', body),
  del: <T>(path: string, body?: unknown) => request<T>(path, 'DELETE', body),
  postForm: <T>(path: string, form: FormData) => request<T>(path, 'POST', form, true),
};
