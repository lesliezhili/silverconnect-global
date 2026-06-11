import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * POST /api/provider/register-faith
 * Onboard a faith service volunteer.
 */
export async function POST(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    // Get current user from session
    const { getIronSession } = await import("iron-session");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const session = await getIronSession<{ userId?: string }>(cookieStore, getSession());
    if (!session.userId) { await sql.end(); return NextResponse.json({ error: "Please log in first" }, { status: 401 }); }
    const userId = session.userId;

    const body = await req.json();
    const { churchName, denomination, pastorReference, ministryExperience, servicesOffered, availability, bio, agreeToSafety, agreeToFaith } = body;

    // Validation
    if (!churchName) { await sql.end(); return NextResponse.json({ error: "Church name is required" }, { status: 400 }); }
    if (!pastorReference?.name || !pastorReference?.phone) { await sql.end(); return NextResponse.json({ error: "Pastor reference required (name + phone)" }, { status: 400 }); }
    if (!ministryExperience) { await sql.end(); return NextResponse.json({ error: "Please describe your ministry experience" }, { status: 400 }); }
    if (!servicesOffered?.length) { await sql.end(); return NextResponse.json({ error: "Select at least one service" }, { status: 400 }); }
    if (!agreeToSafety) { await sql.end(); return NextResponse.json({ error: "Safety agreement required" }, { status: 400 }); }
    if (!agreeToFaith) { await sql.end(); return NextResponse.json({ error: "Faith statement required" }, { status: 400 }); }

    // Check existing
    const existing = await sql`SELECT id FROM provider_profiles WHERE user_id = ${userId}`;
    if (existing.length > 0) { await sql.end(); return NextResponse.json({ error: "Already registered as provider", existingId: existing[0].id }, { status: 409 }); }

    // Ensure notes column
    try { await sql`ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS notes TEXT`; } catch {}

    // Create faith volunteer profile
    const faithMeta = JSON.stringify({
      type: "faith_volunteer",
      churchName, denomination: denomination || null,
      pastorReference, ministryExperience, servicesOffered, availability,
      registeredAt: new Date().toISOString(),
    });

    const [profile] = await sql`INSERT INTO provider_profiles (user_id, bio, service_radius_km, onboarding_status, notes)
      VALUES (${userId}, ${bio || "Faith volunteer at " + churchName}, 15, 'pending', ${faithMeta})
      RETURNING id, onboarding_status`;

    // Update user role
    await sql`UPDATE users SET is_provider_onboarded = true, current_active_role = 'provider' WHERE id = ${userId}`;

    // Notify
    await sql`INSERT INTO notifications (user_id, kind, title, body, link)
      VALUES (${userId}, 'system', 'Welcome, Volunteer!', 'Your faith service registration is being reviewed. God bless you!', '/provider/onboarding-status')`;

    await sql.end();
    return NextResponse.json({
      success: true,
      profileId: profile.id,
      status: "pending",
      message: "Registration submitted! We will contact your pastor reference (1-2 business days).",
      servicesOffered,
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
