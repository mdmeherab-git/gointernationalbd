import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/cf";
import { readSecurityEvents, readSecuritySummary } from "@/lib/security-log";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) {
    return Response.json({ events: [], summary: null, dbReady: false });
  }

  const [events, summary] = await Promise.all([
    readSecurityEvents(200),
    readSecuritySummary(),
  ]);
  return Response.json({ events, summary, dbReady: true });
}
