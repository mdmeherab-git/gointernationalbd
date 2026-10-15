import { getEnv } from "@/lib/cf";
import { storeBackup } from "@/lib/backup";
import { safeEqual } from "@/lib/session";
import { logSecurityEvent } from "@/lib/security-log";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* Daily automatic backup, called by the host's scheduler (see vercel.json).
   The scheduler sends "Authorization: Bearer <CRON_SECRET>"; without that
   secret configured, or with a wrong one, nothing runs. */
export async function GET(req: Request) {
  const env = await getEnv();
  const secret = String(env.CRON_SECRET || process.env.CRON_SECRET || "");

  if (!secret) {
    return Response.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }

  const header = req.headers.get("authorization") || "";
  if (!safeEqual(header, `Bearer ${secret}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const entry = await storeBackup("auto");
    await logSecurityEvent("backup", "scheduler", `auto saved ${entry.key} (${entry.rows} rows)`);
    return Response.json({ ok: true, backup: entry });
  } catch (error) {
    console.error("Automatic backup failed:", error);
    await logSecurityEvent("backup", "scheduler", `AUTO BACKUP FAILED: ${(error as Error).message}`);
    return Response.json({ error: "Backup failed" }, { status: 500 });
  }
}
