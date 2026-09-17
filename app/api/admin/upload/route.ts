import { requireAdmin } from "@/lib/admin";
import { getUploads, newId } from "@/lib/cf";
import { EXT_FOR_MIME, isAllowedType, MAX_UPLOAD_SIZE, parseKind } from "@/lib/admin-upload";

export const dynamic = "force-dynamic";

/**
 * Legacy server-proxied admin upload — kept as a fallback for environments
 * without S3-compatible R2 credentials (local dev against the native
 * Cloudflare binding). Production (Vercel) uses the presign/complete
 * direct-to-R2 flow instead (see ./presign and ./complete), since Vercel
 * rejects large request bodies.
 */
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const bucket = await getUploads();
  if (!bucket)
    return Response.json({ error: "R2 bucket (UPLOADS) is not configured" }, { status: 503 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  const kind = parseKind(form.get("kind")) ?? "circular";

  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (!isAllowedType(kind, file.type)) {
    return Response.json({ error: "এই file type অনুমোদিত নয়" }, { status: 415 });
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return Response.json({ error: "File সর্বোচ্চ 10MB হতে পারবে" }, { status: 413 });
  }

  const key = `${newId("up")}.${EXT_FOR_MIME[file.type] ?? "bin"}`;
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return Response.json({
    url: `/api/files/${encodeURIComponent(key)}`,
    key,
    type: file.type === "application/pdf" ? "pdf" : "image",
  });
}
