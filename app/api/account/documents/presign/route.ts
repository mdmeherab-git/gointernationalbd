import { createPresignedUploadUrl, newId } from "@/lib/cf";
import {
  EXT_FOR_MIME,
  MAX_DOCUMENT_SIZE,
  isAllowedDocumentType,
  parseDocumentType,
} from "@/lib/user-upload";
import { requireUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

/**
 * Step 1 of the direct-to-R2 upload flow for user documents — mirrors the
 * chat attachment / admin upload presign flows already in this project.
 */
export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const body = (await req.json().catch(() => null)) as {
      mime?: unknown;
      size?: unknown;
      documentType?: unknown;
    } | null;

    const mime = typeof body?.mime === "string" ? body.mime : "";
    const size = typeof body?.size === "number" ? body.size : 0;
    const documentType = parseDocumentType(body?.documentType);

    if (!mime || !size || !documentType) {
      return Response.json({ error: "Invalid upload request." }, { status: 400 });
    }

    if (!isAllowedDocumentType(mime)) {
      return Response.json({ error: "এই file type অনুমোদিত নয়" }, { status: 415 });
    }

    if (size > MAX_DOCUMENT_SIZE) {
      return Response.json({ error: "Document সর্বোচ্চ 10MB হতে পারবে" }, { status: 413 });
    }

    const key = `users/${user.id}/documents/${newId("doc")}.${EXT_FOR_MIME[mime] ?? "bin"}`;
    const uploadUrl = await createPresignedUploadUrl(key, mime);

    return Response.json(uploadUrl ? { mode: "direct", uploadUrl, key } : { mode: "proxy", key });
  } catch (error) {
    console.error("Document upload presign error:", error);
    return Response.json({ error: "Upload prepare করা যায়নি।" }, { status: 500 });
  }
}
