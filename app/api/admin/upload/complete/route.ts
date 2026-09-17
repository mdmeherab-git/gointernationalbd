import { requireAdmin } from "@/lib/admin";
import { getUploads } from "@/lib/cf";
import {
  isAllowedType,
  MAX_UPLOAD_SIZE,
  parseKind,
  UPLOAD_KEY_PATTERN,
} from "@/lib/admin-upload";

export const dynamic = "force-dynamic";

/**
 * Step 2 of the direct-to-R2 upload flow: called only after the browser's
 * PUT to the presigned URL succeeds. Verifies the object actually exists in
 * R2 (via HEAD, using R2's own reported size — never the client's claim)
 * before handing back the final /api/files/[key] URL, so a failed or
 * abandoned upload never gets referenced by a circular.
 */
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = (await req.json().catch(() => null)) as {
      key?: unknown;
      kind?: unknown;
      mime?: unknown;
    } | null;

    const key = typeof body?.key === "string" ? body.key : "";
    const kind = parseKind(body?.kind);
    const mime = typeof body?.mime === "string" ? body.mime : "";

    if (!key || !kind || !UPLOAD_KEY_PATTERN.test(key)) {
      return Response.json({ error: "Invalid upload reference." }, { status: 400 });
    }

    if (!isAllowedType(kind, mime)) {
      return Response.json({ error: "এই file type অনুমোদিত নয়" }, { status: 415 });
    }

    const uploads = await getUploads();
    if (!uploads) {
      return Response.json({ error: "R2 bucket (UPLOADS) is not configured" }, { status: 503 });
    }

    const head = await uploads.head(key);
    if (!head) {
      console.error("Admin upload complete: object not found in R2 for key", key);
      return Response.json({ error: "Upload failed" }, { status: 400 });
    }

    if (head.size > MAX_UPLOAD_SIZE) {
      try {
        await uploads.delete(key);
      } catch {
        // Best-effort cleanup of the oversized object.
      }
      return Response.json({ error: "File সর্বোচ্চ 10MB হতে পারবে" }, { status: 413 });
    }

    return Response.json({
      url: `/api/files/${encodeURIComponent(key)}`,
      key,
      type: mime === "application/pdf" ? "pdf" : "image",
    });
  } catch (error) {
    console.error("Admin upload complete error:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
