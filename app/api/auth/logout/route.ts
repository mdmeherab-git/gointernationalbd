import { NextResponse } from "next/server";
import { dbRun } from "@/lib/cf";

export const dynamic = "force-dynamic";

function getUserSessionId(req: Request): string {
  const cookieHeader = req.headers.get("cookie") || "";

  return (
    cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("gib_user="))
      ?.split("=")
      .slice(1)
      .join("=") || ""
  );
}

export async function POST(req: Request) {
  try {
    const sessionId = getUserSessionId(req);

    if (sessionId) {
      await dbRun(
        `
          DELETE FROM user_sessions
          WHERE id = ?
        `,
        sessionId,
      );
    }

    const response = NextResponse.json({
      ok: true,
      message: "Logout successful",
    });

    response.cookies.set({
      name: "gib_user",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("User logout error:", error);

    const response = NextResponse.json(
      {
        error: "Logout করা যায়নি / Logout failed",
      },
      { status: 500 },
    );

    response.cookies.set({
      name: "gib_user",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  }
}