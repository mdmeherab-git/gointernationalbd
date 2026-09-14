import { NextResponse } from "next/server";
import { dbFirst, dbRun } from "@/lib/cf";
import { requireUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

type ExistingUser = {
  id: string;
};

function normalizeEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  return email ? email : null;
}

/* =========================================================
   GET /api/auth/profile

   Returns the CURRENT session user's own profile — identity
   comes only from the gib_user cookie, never from a client
   supplied id. No password hash, session, or OTP data leaves
   this route.
========================================================= */

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profilePhotoKey: user.profilePhotoKey,
      passportNumber: user.passportNumber,
      passportIssue: user.passportIssue,
      passportExpiry: user.passportExpiry,
    },
  });
}

/* =========================================================
   PUT /api/auth/profile

   Updates the CURRENT session user's editable fields only:
   name, email, passport number/issue/expiry. Mobile number is
   never editable here (display only, per spec).
========================================================= */

export async function PUT(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const body = (await req.json()) as {
      name?: unknown;
      email?: unknown;
      passportNumber?: unknown;
      passportIssue?: unknown;
      passportExpiry?: unknown;
    };

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : null;
    const passportNumber =
      typeof body.passportNumber === "string" ? body.passportNumber.trim().slice(0, 30) : "";
    const passportIssue =
      typeof body.passportIssue === "string" ? body.passportIssue.trim().slice(0, 20) : "";
    const passportExpiry =
      typeof body.passportExpiry === "string" ? body.passportExpiry.trim().slice(0, 20) : "";

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "সঠিক নাম দিন / Please enter a valid name" },
        { status: 400 },
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "সঠিক ইমেইল দিন / Enter a valid email address" },
        { status: 400 },
      );
    }

    if (email) {
      const existingEmail = await dbFirst<ExistingUser>(
        `
          SELECT id
          FROM users
          WHERE LOWER(email) = LOWER(?)
            AND id != ?
          LIMIT 1
        `,
        email,
        user.id,
      );

      if (existingEmail) {
        return NextResponse.json(
          { error: "এই Email দিয়ে ইতিমধ্যে Account আছে / An account already exists with this email" },
          { status: 409 },
        );
      }
    }

    await dbRun(
      `
        UPDATE users
        SET
          name = ?,
          email = ?,
          passport_number = ?,
          passport_issue = ?,
          passport_expiry = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `,
      name,
      email,
      passportNumber,
      passportIssue,
      passportExpiry,
      user.id,
    );

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name,
        email,
        phone: user.phone,
        profilePhotoKey: user.profilePhotoKey,
        passportNumber,
        passportIssue,
        passportExpiry,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "প্রোফাইল আপডেট করা যায়নি / Could not update profile" },
      { status: 500 },
    );
  }
}
