import { requireAdmin } from "@/lib/admin";
import { getEnv, getDb, getUploads } from "@/lib/cf";
import { listBackups, storeBackup } from "@/lib/backup";
import { clientIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* Owner-only: it is not in the staff path rules, so every staff member is
   refused here. */

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const env = await getEnv();
  return Response.json({
    backups: await listBackups(),
    dbReady: (await getDb()) != null,
    storageReady: (await getUploads()) != null,
    // The daily automatic run needs this secret to be set on the host.
    autoConfigured: Boolean(env.CRON_SECRET || process.env.CRON_SECRET),
  });
}

/** Take a backup right now and keep it in the cloud. */
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const entry = await storeBackup("manual");
    await logSecurityEvent("backup", clientIp(req), `saved ${entry.key} (${entry.rows} rows)`);
    return Response.json({ ok: true, backup: entry });
  } catch (error) {
    console.error("Manual backup failed:", error);
    return Response.json(
      { error: (error as Error).message || "Backup failed" },
      { status: 500 },
    );
  }
}
