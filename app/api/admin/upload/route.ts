import { requireAdmin } from "@/lib/admin";
import { getUploads, newId } from "@/lib/cf";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
]);
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

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
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return Response.json(
      { error: "Only PNG, JPG, WebP, GIF or PDF files are allowed" },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "File is larger than 5 MB" }, { status: 413 });
  }

  const key = `${newId("up")}.${EXT[file.type] ?? "bin"}`;
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return Response.json({
    url: `/api/files/${encodeURIComponent(key)}`,
    key,
    type: file.type === "application/pdf" ? "pdf" : "image",
  });
}
