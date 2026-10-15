import { NextResponse } from "next/server";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import {
  GUEST_COOKIE,
  getCookie,
  getLoggedInUserId,
  getOrCreateConversation,
  newGuestId,
} from "@/lib/chat-conversation";
import { saveGuestIdentity } from "@/lib/chat-guest";

export const dynamic = "force-dynamic";

/**
 * Step before a guest's first chat message: stores their name, phone and
 * (optional) email on their conversation so the office knows who is writing.
 * Logged-in users already have a profile, so this is a no-op for them.
 */
export async function POST(req: Request) {
  const limited = await rateLimit(`chat-identify:${clientIp(req)}`, 10, 3600);
  if (limited.blocked) return tooManyRequests(limited.retryAfter);

  try {
    const body = (await req.json().catch(() => null)) as {
      name?: unknown;
      phone?: unknown;
      email?: unknown;
    } | null;

    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const name = str(body?.name);
    const phone = str(body?.phone);
    const email = str(body?.email);

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { error: "আপনার নাম লিখুন (২-৮০ অক্ষর)।" },
        { status: 400 },
      );
    }
    const digits = phone.replace(/\D/g, "");
    if (!/^[\d+\-\s()]{6,25}$/.test(phone) || digits.length < 6 || digits.length > 15) {
      return NextResponse.json(
        { error: "সঠিক মোবাইল নম্বর দিন।" },
        { status: 400 },
      );
    }
    if (email && (email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return NextResponse.json({ error: "সঠিক ইমেইল দিন।" }, { status: 400 });
    }

    const userId = await getLoggedInUserId(req);
    if (userId) return NextResponse.json({ ok: true, loggedIn: true });

    let guestId = getCookie(req, GUEST_COOKIE);
    let setCookie = false;
    if (!guestId) {
      guestId = newGuestId();
      setCookie = true;
    }

    const conversation = await getOrCreateConversation(null, guestId);
    await saveGuestIdentity(conversation.id, { name, phone, email });

    const response = NextResponse.json({ ok: true });
    if (setCookie) {
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
    console.error("Chat identify error:", error);
    return NextResponse.json({ error: "তথ্য সংরক্ষণ করা যায়নি।" }, { status: 500 });
  }
}
