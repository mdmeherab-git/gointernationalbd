import { NextResponse } from "next/server";
import { dbFirst } from "@/lib/cf";

export const dynamic = "force-dynamic";

type SessionRow = {
  session_id: string;
  user_id: string;
  expires_at: string;
  name: string;
  email: string | null;
  phone: string;
  profile_photo_key: string;
  status: string;
};

export async function GET(req: Request) {
  try {
    const sessionId = req.headers
      .get("cookie")
      ?.split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("gib_user="))
      ?.split("=")
      .slice(1)
      .join("=");

    if (!sessionId) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    const session = await dbFirst<SessionRow>(
      `
        SELECT
          s.id AS session_id,
          s.user_id,
          s.expires_at,
          u.name,
          u.email,
          u.phone,
          u.profile_photo_key,
          u.status
        FROM user_sessions s
        INNER JOIN users u
          ON u.id = s.user_id
        WHERE s.id = ?
        LIMIT 1
      `,
      sessionId,
    );

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    const expiresAt = new Date(session.expires_at).getTime();

    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    if (session.status !== "active") {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user_id,
        name: session.name,
        email: session.email,
        phone: session.phone,
        profilePhotoKey: session.profile_photo_key || "",
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);

    return NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      { status: 500 },
    );
  }
}