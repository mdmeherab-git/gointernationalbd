import { requireAdmin } from "@/lib/admin";
import { readStoredBackup } from "@/lib/backup";
import { clientIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";

export const dynamic = "force-dynamic";

/* Owner-only: download one of the backups kept in the cloud. The key must
   match the exact backup file-name pattern, so nothing else in the bucket can
   be read through this route. */
export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const key = new URL(req.url).searchParams.get("key") || "";
  const text = await readStoredBackup(key);
  if (text === null) return Response.json({ error: "Backup not found" }, { status: 404 });

  await logSecurityEvent("backup", clientIp(req), `downloaded stored ${key}`);

  return new Response(text, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${key.replace("backups/", "")}"`,
      "cache-control": "no-store",
    },
  });
}
