import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { dbFirst, dbRun, newId } from "@/lib/cf";

export const dynamic = "force-dynamic";

type ExistingUser = {
  id: string;
  email: string | null;
  phone: string;
};

function normalizePhone(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

function normalizeEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  return email ? email : null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: unknown;
      phone?: unknown;
      email?: unknown;
      password?: unknown;
    };

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const phone =
      typeof body.phone === "string"
        ? normalizePhone(body.phone)
        : "";

    const email =
      typeof body.email === "string"
        ? normalizeEmail(body.email)
        : null;

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!name) {
      return NextResponse.json(
        {
          error:
            "নাম দিন / Please enter your name",
        },
        { status: 400 },
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          error:
            "সঠিক নাম দিন / Please enter a valid name",
        },
        { status: 400 },
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          error:
            "মোবাইল নম্বর আবশ্যক / Mobile number is required",
        },
        { status: 400 },
      );
    }

    // Bangladesh mobile number
    // Example: 01872327575
    if (!/^01[3-9]\d{8}$/.test(phone)) {
      return NextResponse.json(
        {
          error:
            "সঠিক বাংলাদেশি মোবাইল নম্বর দিন / Enter a valid Bangladesh mobile number",
        },
        { status: 400 },
      );
    }

    // Gmail / Email is optional
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          {
            error:
              "সঠিক ইমেইল দিন / Enter a valid email address",
          },
          { status: 400 },
        );
      }

      if (email.length > 254) {
        return NextResponse.json(
          {
            error:
              "ইমেইল অনেক বড় / Email address is too long",
          },
          { status: 400 },
        );
      }
    }

    if (!password) {
      return NextResponse.json(
        {
          error:
            "পাসওয়ার্ড আবশ্যক / Password is required",
        },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে / Password must be at least 8 characters",
        },
        { status: 400 },
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        {
          error:
            "পাসওয়ার্ড সর্বোচ্চ ১২৮ অক্ষরের হতে পারবে / Password is too long",
        },
        { status: 400 },
      );
    }

    // ==================================================
    // CHECK EXISTING PHONE
    // ==================================================

    const existingPhone = await dbFirst<ExistingUser>(
      `
        SELECT id, email, phone
        FROM users
        WHERE phone = ?
        LIMIT 1
      `,
      phone,
    );

    if (existingPhone) {
      return NextResponse.json(
        {
          error:
            "এই মোবাইল নম্বর দিয়ে ইতিমধ্যে Account আছে / An account already exists with this mobile number",
        },
        { status: 409 },
      );
    }

    // ==================================================
    // CHECK EXISTING EMAIL
    // ==================================================

    if (email) {
      const existingEmail = await dbFirst<ExistingUser>(
        `
          SELECT id, email, phone
          FROM users
          WHERE LOWER(email) = LOWER(?)
          LIMIT 1
        `,
        email,
      );

      if (existingEmail) {
        return NextResponse.json(
          {
            error:
              "এই Email দিয়ে ইতিমধ্যে Account আছে / An account already exists with this email",
          },
          { status: 409 },
        );
      }
    }

    // ==================================================
    // HASH PASSWORD
    // ==================================================

    const passwordHash = await bcrypt.hash(
      password,
      12,
    );

    // ==================================================
    // CREATE USER
    // ==================================================

    const userId = newId("user");

    await dbRun(
      `
        INSERT INTO users (
          id,
          name,
          email,
          phone,
          password_hash,
          profile_photo_key,
          passport_number,
          passport_issue,
          passport_expiry,
          status,
          phone_verified,
          created_at,
          updated_at
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          '',
          '',
          '',
          '',
          'active',
          0,
          datetime('now'),
          datetime('now')
        )
      `,
      userId,
      name,
      email,
      phone,
      passwordHash,
    );

    // ==================================================
    // SUCCESS
    // ==================================================

    return NextResponse.json(
      {
        ok: true,

        user: {
          id: userId,
          name,
          phone,
          email,
        },

        message:
          "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে / Account created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Registration error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "রেজিস্ট্রেশন করা যায়নি / Registration failed",
      },
      { status: 500 },
    );
  }
}