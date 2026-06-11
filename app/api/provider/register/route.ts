import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

const sessionOptions = {
  password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long",
  cookieName: "sc-session",
  cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const },
};

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const postgres = require("postgres");
  return postgres(url, { prepare: false });
}

/**
 * POST /api/provider/register
 * Simplified provider onboarding for mutual-aid helpers.
 * Creates provider_profile + categories, marks user as onboarded.
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<{ userId?: string }>(cookieStore, sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { bio, address, serviceRadius, categories, policeCheck, firstAid, wwcc } = body;

    if (!bio || !address || !categories || categories.length === 0) {
      return NextResponse.json(
        { error: "Bio, address, and at least one service category are required" },
        { status: 400 }
      );
    }

    const sql = getDb();

    try {
      // Check if already onboarded
      const existing = await sql`
        SELECT id FROM provider_profiles WHERE user_id = ${session.userId} LIMIT 1
      `;
      if (existing.length > 0) {
        await sql.end();
        return NextResponse.json({ error: "Provider profile already exists" }, { status: 409 });
      }

      // Create provider profile using correct column names from schema
      const [profile] = await sql`
        INSERT INTO provider_profiles (
          user_id, bio, address_line, service_radius_km,
          onboarding_status, submitted_at, created_at, updated_at
        ) VALUES (
          ${session.userId}, ${bio.trim()}, ${address.trim()}, ${serviceRadius || 15},
          'approved', NOW(), NOW(), NOW()
        )
        RETURNING id
      `;

      // Add service categories (provider_categories uses provider_id, not user_id)
      for (const cat of categories) {
        await sql`
          INSERT INTO provider_categories (provider_id, category)
          VALUES (${profile.id}, ${cat}::service_category)
          ON CONFLICT DO NOTHING
        `;
      }

      // Mark user as provider-onboarded
      await sql`
        UPDATE users
        SET is_provider_onboarded = TRUE, current_active_role = 'provider'
        WHERE id = ${session.userId}
      `;

      await sql.end();

      return NextResponse.json({
        success: true,
        message: "Helper profile created! You can now accept jobs.",
        providerId: profile.id,
      }, { status: 201 });

    } catch (dbErr: any) {
      try { await sql.end(); } catch {}
      throw dbErr;
    }

  } catch (error: any) {
    console.error("Provider register error:", error);
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
