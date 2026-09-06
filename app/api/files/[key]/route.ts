import { getUploads } from "@/lib/cf";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const bucket = await getUploads();
  if (!bucket) return new Response("Not found", { status: 404 });

  const object = await bucket.get(decodeURIComponent(key));
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body as ReadableStream, {
    headers: {
      "content-type": object.httpMetadata?.contentType || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
