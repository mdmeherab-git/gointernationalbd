import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { createPresignedUploadUrl, newId } from "@/lib/cf";
import { MAX_PASSPORT_SIZE, PASSPORT_EXT_FOR_MIME } from "@/lib/application-passport";

export const dynamic = "force-dynamic";

/**
 * Step 1 of the optional passport-copy upload on the apply form. Validates
 * the file and returns a presigned R2 PUT URL so the browser uploads straight
 * to R2 (Vercel functions reject large request bodies). When no S3 credentials
 * exist (local dev), returns mode "proxy" and the form posts to
 * /api/applications/passport instead.
 */
export async function POST(req: Request) {
  const limited = await rateLimit(`passport-presign:${clientIp(req)}`, 10, 3600);
  if (limited.blocked) return tooManyRequests(limited.retryAfter);

  const body = (await req.json().catch(() => null)) as {
    mime?: unknown;
    size?: unknown;
  } | null;
  const mime = typeof body?.mime === "string" ? body.mime : "";
  const size = typeof body?.size === "number" ? body.size : 0;

  const ext = PASSPORT_EXT_FOR_MIME[mime];
  if (!ext || size <= 0) {
    return Response.json(
      { error: "শুধু PDF বা JPG ফাইল দিন / Only PDF or JPG files are allowed" },
      { status: 400 },
    );
  }
  if (size > MAX_PASSPORT_SIZE) {
    return Response.json(
      { error: "ফাইল সর্বোচ্চ ২০ MB / File must be 20 MB or less" },
      { status: 413 },
    );
  }

  const key = `applications/${newId("passport")}.${ext}`;
  const uploadUrl = await createPresignedUploadUrl(key, mime, 900);
  return Response.json(uploadUrl ? { mode: "direct", uploadUrl, key } : { mode: "proxy" });
}
