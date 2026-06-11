import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * GET /api/provider/faith-schedule — Get volunteer's weekly schedule
 * POST /api/provider/faith-schedule — Set/update weekly availability slots
 * Body: { slots: [{ dayOfWeek: 0-6, startHour: 0-23, endHour: 0-23, serviceCode?: string }] }
 */
export async function GET(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { getIronSession } = await import("iron-session");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const session = await getIronSession<{ userId?: string }>(cookieStore, getSession());
    if (!session.userId) { await sql.end(); return NextResponse.json({ error: "Not logged in" }, { status: 401 }); }

    // Ensure table exists
    await sql`CREATE TABLE IF NOT EXISTS faith_volunteer_schedule (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      provider_id UUID NOT NULL,
      day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
      start_hour INT NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
      end_hour INT NOT NULL CHECK (end_hour BETWEEN 1 AND 24),
      service_code TEXT,
      max_bookings INT DEFAULT 2,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(provider_id, day_of_week, start_hour)
    )`;

    // Get provider profile
    const [profile] = await sql`SELECT id FROM provider_profiles WHERE user_id = ${session.userId}`;
    if (!profile) { await sql.end(); return NextResponse.json({ error: "Not registered as provider" }, { status: 404 }); }

    const slots = await sql`SELECT id, day_of_week, start_hour, end_hour, service_code, max_bookings, is_active
      FROM faith_volunteer_schedule WHERE provider_id = ${profile.id} AND is_active = true
      ORDER BY day_of_week, start_hour`;

    // Get upcoming bookings (next 14 days)
    const bookings = await sql`SELECT id, status, scheduled_at, duration_min
      FROM bookings WHERE provider_id = ${profile.id}
      AND scheduled_at >= NOW() AND scheduled_at <= NOW() + INTERVAL '14 days'
      AND status IN ('confirmed', 'in_progress')
      ORDER BY scheduled_at`;

    await sql.end();

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return NextResponse.json({
      success: true,
      providerId: profile.id,
      schedule: slots.map((s: Record<string, unknown>) => ({
        ...s,
        dayName: dayNames[s.day_of_week as number],
        timeRange: String(s.start_hour).padStart(2, "0") + ":00 - " + String(s.end_hour).padStart(2, "0") + ":00",
      })),
      upcomingBookings: bookings.length,
      bookings: bookings.slice(0, 10),
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { getIronSession } = await import("iron-session");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const session = await getIronSession<{ userId?: string }>(cookieStore, getSession());
    if (!session.userId) { await sql.end(); return NextResponse.json({ error: "Not logged in" }, { status: 401 }); }

    const { slots } = await req.json();
    if (!Array.isArray(slots) || slots.length === 0) {
      await sql.end();
      return NextResponse.json({ error: "Provide at least one availability slot" }, { status: 400 });
    }

    // Ensure table
    await sql`CREATE TABLE IF NOT EXISTS faith_volunteer_schedule (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      provider_id UUID NOT NULL,
      day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
      start_hour INT NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
      end_hour INT NOT NULL CHECK (end_hour BETWEEN 1 AND 24),
      service_code TEXT,
      max_bookings INT DEFAULT 2,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(provider_id, day_of_week, start_hour)
    )`;

    const [profile] = await sql`SELECT id FROM provider_profiles WHERE user_id = ${session.userId}`;
    if (!profile) { await sql.end(); return NextResponse.json({ error: "Not registered" }, { status: 404 }); }

    // Clear existing and insert new
    await sql`DELETE FROM faith_volunteer_schedule WHERE provider_id = ${profile.id}`;

    let inserted = 0;
    for (const slot of slots) {
      const { dayOfWeek, startHour, endHour, serviceCode, maxBookings } = slot;
      if (dayOfWeek < 0 || dayOfWeek > 6 || startHour < 0 || startHour > 23 || endHour < 1 || endHour > 24) continue;
      await sql`INSERT INTO faith_volunteer_schedule (provider_id, day_of_week, start_hour, end_hour, service_code, max_bookings)
        VALUES (${profile.id}, ${dayOfWeek}, ${startHour}, ${endHour}, ${serviceCode || null}, ${maxBookings || 2})`;
      inserted++;
    }

    await sql.end();
    return NextResponse.json({ success: true, slotsInserted: inserted, message: "Schedule updated!" });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
