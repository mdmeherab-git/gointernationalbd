import { requireAdmin } from "@/lib/admin";
import { dbFirst, getUploads } from "@/lib/cf";
import {
  PASSPORT_KEY_PATTERN,
  PASSPORT_MIME_FOR_EXT,
  ensurePassportColumns,
  passportExt,
} from "@/lib/application-passport";

export const dynamic = "force-dynamic";

/**
 * Admin only: view (default) or download (?download=1) the passport copy an
 * applicant attached to their application.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  await ensurePassportColumns();
  const row = await dbFirst<{
    passport_key: string | null;
    passport_name: string | null;
    applicant_name: string;
  }>(
    "SELECT passport_key, passport_name, applicant_name FROM applications WHERE id = ?",
    id,
  );
  const key = row?.passport_key || "";
  if (!row || !PASSPORT_KEY_PATTERN.test(key)) {
    return new Response("Not found", { status: 404 });
  }

  const bucket = await getUploads();
  const object = bucket ? await bucket.get(key) : null;
  if (!object) return new Response("Not found", { status: 404 });

  const ext = passportExt(key);
  const safeName =
    (row.applicant_name || "applicant")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "applicant";
  const filename = `passport-${safeName}.${ext}`;
  const download = new URL(req.url).searchParams.get("download") === "1";

  return new Response(object.body as ReadableStream, {
    headers: {
      "content-type": PASSPORT_MIME_FOR_EXT[ext] || "application/octet-stream",
      "content-disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "cache-control": "private, no-store",
    },
  });
}
