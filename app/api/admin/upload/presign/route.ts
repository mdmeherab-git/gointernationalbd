import { requireAdmin } from "@/lib/admin";
import { createPresignedUploadUrl, newId } from "@/lib/cf";
import { EXT_FOR_MIME, isAllowedType, MAX_UPLOAD_SIZE, parseKind } from "@/lib/admin-upload";

export const dynamic = "force-dynamic";

/**
 * Step 1 of the direct-to-R2 upload flow for admin circular/featured-image
 * uploads — mirrors the chat attachment presign flow (see
 * app/api/chat/upload/presign/route.ts) so large files never have to pass
 * through a Vercel serverless function body.
 */
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = (await req.json().catch(() => null)) as {
      kind?: unknown;
      mime?: unknown;
      size?: unknown;
    } | null;

    const kind = parseKind(body?.kind);
    const mime = typeof body?.mime === "string" ? body.mime : "";
    const size = typeof body?.size === "number" ? body.size : 0;

    if (!kind || !mime || !size) {
      return Response.json({ error: "Invalid upload request." }, { status: 400 });
    }

    if (!isAllowedType(kind, mime)) {
      return Response.json({ error: "এই file type অনুমোদিত নয়" }, { status: 415 });
    }

    if (size > MAX_UPLOAD_SIZE) {
      return Response.json({ error: "File সর্বোচ্চ 10MB হতে পারবে" }, { status: 413 });
    }

    const key = `${newId("up")}.${EXT_FOR_MIME[mime] ?? "bin"}`;
    const uploadUrl = await createPresignedUploadUrl(key, mime);

    return Response.json(uploadUrl ? { mode: "direct", uploadUrl, key } : { mode: "proxy" });
  } catch (error) {
    console.error("Admin upload presign error:", error);
    return Response.json({ error: "Upload prepare করা যায়নি।" }, { status: 500 });
  }
}
