import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users, verificationCodes } from "@/lib/db/schema/users";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const sessionOptions = {
  password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long",
  cookieName: "sc-session",
  cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const },
};

/**
 * POST /api/auth/signup
 * 
 * UNIFIED SIGNUP — Everyone starts as customer. No role selection.
 * Name is required for trust & elder dignity.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, country } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
    }
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Check existing user
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`)
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered. Try signing in instead." },
        { status: 409 }
      );
    }

    // Hash password (same as login route)
    const passwordHash = await bcrypt.hash(password, 12);

    // INSERT user — unified signup: everyone = customer
    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: email.toLowerCase(),
        passwordHash,
        country: (country || "AU") as any,
        locale: "en" as any,
        role: "customer" as any,
        role: "customer",
      })
      .returning({ id: users.id, email: users.email });

    // Create verification code (separate table)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await db.insert(verificationCodes).values({
      email: email.toLowerCase(),
      code,
      purpose: "email_verify" as any,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
    });

    // Auto-sign in after signup
    const cookieStore = await cookies();
    const session = await getIronSession<{ userId: string; email: string; role: string }>(cookieStore, sessionOptions);
    session.userId = newUser.id;
    session.email = newUser.email;
    session.role = "customer";
    await session.save();

    return NextResponse.json({
      success: true,
      message: "Welcome to SilverConnect!",
      userId: newUser.id,
    });
  } catch (error: unknown) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
