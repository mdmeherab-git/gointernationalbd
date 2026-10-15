import { requireAdmin } from "@/lib/admin";
import { buildBackup } from "@/lib/backup";
import { clientIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* Owner-only: a fresh export of the whole database, sent as a file download
   (nothing is stored on the server). */
export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const built = await buildBackup();
    await logSecurityEvent("backup", clientIp(req), `downloaded (${built.rows} rows)`);

    const day = built.createdAt.slice(0, 10);
    return new Response(built.json, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="gib-backup-${day}.json"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("Backup download failed:", error);
    return Response.json({ error: (error as Error).message || "Backup failed" }, { status: 500 });
  }
}
