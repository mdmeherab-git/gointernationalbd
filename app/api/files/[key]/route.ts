import { getUploads } from "@/lib/cf";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const bucket = await getUploads();
  if (!bucket) return new Response("Not found", { status: 404 });

  // Only the flat public uploads made from the admin panel (circulars,
  // notices, images) are served here. Anything inside a folder — private
  // user documents under users/, chat attachments under chat/ — has its own
  // permission-checked route and must never be reachable through this one.
  let objectKey = "";
  try {
    objectKey = decodeURIComponent(key);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (!objectKey || /[\\/]/.test(objectKey) || objectKey.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const object = await bucket.get(objectKey);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body as ReadableStream, {
    headers: {
      "content-type": object.httpMetadata?.contentType || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
