import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbFirst, dbRun, newId } from "@/lib/cf";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  password_hash: string;
  status: string;
};

const SESSION_DAYS = 30;

function normalizePhone(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      phone?: unknown;
      password?: unknown;
    };

    const phone =
      typeof body.phone === "string"
        ? normalizePhone(body.phone)
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!phone || !password) {
      return NextResponse.json(
        {
          error:
            "মোবাইল নম্বর ও Password দিন / Enter mobile number and password",
        },
        { status: 400 },
      );
    }

    const user = await dbFirst<UserRow>(
      `
        SELECT
          id,
          name,
          email,
          phone,
          password_hash,
          status
        FROM users
        WHERE phone = ?
        LIMIT 1
      `,
      phone,
    );

    if (!user) {
      return NextResponse.json(
        {
          error:
            "মোবাইল নম্বর অথবা Password সঠিক নয়",
        },
        { status: 401 },
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        {
          error:
            "আপনার Account বর্তমানে সক্রিয় নয় / Your account is not active",
        },
        { status: 403 },
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash,
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          error:
            "মোবাইল নম্বর অথবা Password সঠিক নয়",
        },
        { status: 401 },
      );
    }

    const sessionId = newId("session");

    const expiresAt = new Date(
      Date.now() +
        SESSION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    await dbRun(
      `
        INSERT INTO user_sessions (
          id,
          user_id,
          expires_at,
          created_at
        )
        VALUES (
          ?,
          ?,
          ?,
          datetime('now')
        )
      `,
      sessionId,
      user.id,
      expiresAt,
    );

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });

    response.cookies.set({
      name: "gib_user",
      value: sessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("User login error:", error);

    return NextResponse.json(
      {
        error:
          "Login করা যায়নি / Login failed",
      },
      { status: 500 },
    );
  }
}