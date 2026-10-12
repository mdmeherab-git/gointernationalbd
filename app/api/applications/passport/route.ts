import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { getUploads, newId } from "@/lib/cf";
import { MAX_PASSPORT_SIZE, PASSPORT_EXT_FOR_MIME } from "@/lib/application-passport";

export const dynamic = "force-dynamic";

/** Server-proxied fallback for local dev (no S3 presign available). */
export async function POST(req: Request) {
  const limited = await rateLimit(`passport-upload:${clientIp(req)}`, 10, 3600);
  if (limited.blocked) return tooManyRequests(limited.retryAfter);

  const bucket = await getUploads();
  if (!bucket) {
    return Response.json({ error: "File storage is not configured" }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file" }, { status: 400 });
  }
  const ext = PASSPORT_EXT_FOR_MIME[file.type];
  if (!ext) {
    return Response.json(
      { error: "শুধু PDF বা JPG ফাইল দিন / Only PDF or JPG files are allowed" },
      { status: 400 },
    );
  }
  if (file.size > MAX_PASSPORT_SIZE) {
    return Response.json(
      { error: "ফাইল সর্বোচ্চ ২০ MB / File must be 20 MB or less" },
      { status: 413 },
    );
  }

  const key = `applications/${newId("passport")}.${ext}`;
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });
  return Response.json({ key });
}
