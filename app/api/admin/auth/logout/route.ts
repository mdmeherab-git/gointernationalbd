import { clearSessionCookie, clearStaffCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const headers = new Headers({ "content-type": "application/json" });
  headers.append("set-cookie", clearSessionCookie());
  headers.append("set-cookie", clearStaffCookie());
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
