import { NextResponse } from "next/server";
import { createPresignedUploadUrl, newId } from "@/lib/cf";
import { classifyAttachment, extensionFor, sizeLimitFor } from "@/lib/chat-upload";
import {
  GUEST_COOKIE,
  getCookie,
  getLoggedInUserId,
  getOrCreateConversation,
  newGuestId,
} from "@/lib/chat-conversation";

export const dynamic = "force-dynamic";

/**
 * Step 1 of the direct-to-R2 upload flow: validates the file up front and
 * returns either a presigned PUT URL (browser uploads straight to R2,
 * bypassing this server entirely — needed because Vercel's serverless
 * functions reject large request bodies) or, when no S3-compatible R2
 * credentials are configured for this environment (local dev against the
 * native Cloudflare binding), a signal to fall back to the legacy
 * server-proxied /api/chat/upload route.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      fileName?: unknown;
      mime?: unknown;
      size?: unknown;
      kind?: unknown;
    } | null;

    const fileName = typeof body?.fileName === "string" ? body.fileName : "";
    const mime = typeof body?.mime === "string" ? body.mime : "";
    const size = typeof body?.size === "number" ? body.size : 0;
    const requestedKind = typeof body?.kind === "string" ? body.kind.toLowerCase() : "";

    if (!fileName || !mime || !size) {
      return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
    }

    const kind = classifyAttachment(mime, requestedKind);
    if (!kind) {
      return NextResponse.json(
        { error: "এই file type এই attachment option-এর জন্য অনুমোদিত নয়।" },
        { status: 400 },
      );
    }

    const limit = sizeLimitFor(kind, mime);
    if (size > limit) {
      const mb = Math.round(limit / (1024 * 1024));
      return NextResponse.json({ error: `File সর্বোচ্চ ${mb}MB হতে পারবে।` }, { status: 413 });
    }

    const userId = await getLoggedInUserId(req);
    let guestId = getCookie(req, GUEST_COOKIE);
    let shouldSetGuestCookie = false;

    if (!userId && !guestId) {
      guestId = newGuestId();
      shouldSetGuestCookie = true;
    }

    const conversation = await getOrCreateConversation(userId, guestId);
    const extension = extensionFor(fileName, mime);
    const key = `chat/${conversation.id}/${newId("file")}.${extension}`;

    const uploadUrl = await createPresignedUploadUrl(key, mime);

    const response = NextResponse.json(
      uploadUrl ? { mode: "direct", uploadUrl, key } : { mode: "proxy" },
    );

    if (shouldSetGuestCookie) {
      response.cookies.set({
        name: GUEST_COOKIE,
        value: guestId,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 90,
      });
    }

    return response;
  } catch (error) {
    console.error("Chat upload presign error:", error);
    return NextResponse.json({ error: "Upload prepare করা যায়নি।" }, { status: 500 });
  }
}
