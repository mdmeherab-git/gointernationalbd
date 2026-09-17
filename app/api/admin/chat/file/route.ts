import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { dbFirst, getUploads } from "@/lib/cf";

export const dynamic = "force-dynamic";

type MessageRow = {
  id: string;
  attachment_key: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
};

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const url = new URL(req.url);
    const messageId = url.searchParams.get("messageId") || "";
    const forceDownload = url.searchParams.get("download") === "1";
    if (!messageId) {
      return NextResponse.json({ error: "Message ID missing." }, { status: 400 });
    }

    const message = await dbFirst<MessageRow>(
      `
        SELECT id, attachment_key, attachment_name, attachment_mime
        FROM chat_messages
        WHERE id = ?
        LIMIT 1
      `,
      messageId,
    );

    if (!message?.attachment_key) {
      return NextResponse.json({ error: "Attachment পাওয়া যায়নি।" }, { status: 404 });
    }

    const uploads = await getUploads();
    if (!uploads) {
      return NextResponse.json({ error: "File storage configured নেই।" }, { status: 503 });
    }

    const object = await uploads.get(message.attachment_key);
    if (!object) {
      return NextResponse.json({ error: "File পাওয়া যায়নি।" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set(
      "content-type",
      message.attachment_mime || object.httpMetadata?.contentType || "application/octet-stream",
    );
    if (object.size) headers.set("content-length", String(object.size));
    headers.set("cache-control", "private, max-age=3600");
    headers.set(
      "content-disposition",
      `${forceDownload ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(message.attachment_name || "attachment")}`,
    );

    return new NextResponse(object.body, { status: 200, headers });
  } catch (error) {
    console.error("Admin chat file GET error:", error);
    return NextResponse.json({ error: "Attachment load করা যায়নি।" }, { status: 500 });
  }
}
