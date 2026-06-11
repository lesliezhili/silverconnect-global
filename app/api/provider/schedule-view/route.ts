import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * GET /api/provider/schedule-view?date=2026-10-05
 * Returns provider's daily schedule with bookings + break slots + available windows
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

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Get provider profile
    const [pp] = await sql`SELECT id, notes FROM provider_profiles WHERE user_id = ${session.userId}`;
    if (!pp) { await sql.end(); return NextResponse.json({ error: "Not a provider" }, { status: 403 }); }

    const isFaith = ((pp.notes as string) || "").includes("faith_volunteer");
    const BREAK_MIN = isFaith ? 15 : 30;
    const MAX_PER_DAY = isFaith ? 6 : 4;
    const WORK_START = 7; // 7 AM
    const WORK_END = 20;  // 8 PM

    // Get day's bookings
    const dayStart = dateStr + "T00:00:00Z";
    const dayEnd = dateStr + "T23:59:59Z";
    
    const bookings = await sql`
      SELECT b.id, b.scheduled_at, b.duration_min, b.status, b.notes,
        s.code as service_code, u.name as customer_name
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      LEFT JOIN users u ON u.id = b.customer_id
      WHERE b.provider_id = ${pp.id}
        AND b.status IN ('confirmed', 'in_progress', 'completed')
        AND b.scheduled_at >= ${dayStart}
        AND b.scheduled_at <= ${dayEnd}
      ORDER BY b.scheduled_at ASC`;

    // Build schedule timeline
    interface TimeSlot {
      type: "booking" | "break" | "available";
      start: string;
      end: string;
      durationMin: number;
      label: string;
      bookingId?: string;
      customer?: string;
      service?: string;
    }

    const timeline: TimeSlot[] = [];
    
    for (let i = 0; i < bookings.length; i++) {
      const b = bookings[i];
      const bStart = new Date(b.scheduled_at as string);
      const bDuration = Number(b.duration_min) || 60;
      const bEnd = new Date(bStart.getTime() + bDuration * 60000);
      const breakEnd = new Date(bEnd.getTime() + BREAK_MIN * 60000);

      // Booking slot
      timeline.push({
        type: "booking",
        start: bStart.toISOString(),
        end: bEnd.toISOString(),
        durationMin: bDuration,
        label: (b.service_code as string || "Service").replace(/_/g, " "),
        bookingId: b.id as string,
        customer: b.customer_name as string,
        service: b.service_code as string,
      });

      // Break slot (if not last booking or if another booking follows)
      if (i < bookings.length - 1) {
        const nextStart = new Date(bookings[i + 1].scheduled_at as string);
        const breakActualEnd = nextStart < breakEnd ? nextStart : breakEnd;
        timeline.push({
          type: "break",
          start: bEnd.toISOString(),
          end: breakActualEnd.toISOString(),
          durationMin: BREAK_MIN,
          label: isFaith ? "Rest & reflect" : "Break & travel",
        });
      } else {
        // Last booking — show break after
        timeline.push({
          type: "break",
          start: bEnd.toISOString(),
          end: breakEnd.toISOString(),
          durationMin: BREAK_MIN,
          label: isFaith ? "Rest & reflect" : "Break & travel",
        });
      }
    }

    // Calculate available windows
    const available: { start: string; end: string; durationMin: number }[] = [];
    const workDayStart = new Date(dateStr + "T" + String(WORK_START).padStart(2, "0") + ":00:00Z");
    const workDayEnd = new Date(dateStr + "T" + String(WORK_END).padStart(2, "0") + ":00:00Z");

    if (bookings.length === 0) {
      available.push({
        start: workDayStart.toISOString(),
        end: workDayEnd.toISOString(),
        durationMin: (WORK_END - WORK_START) * 60,
      });
    } else {
      // Before first booking
      const firstStart = new Date(bookings[0].scheduled_at as string);
      if (firstStart > workDayStart) {
        const gap = (firstStart.getTime() - workDayStart.getTime()) / 60000;
        if (gap >= 30) available.push({ start: workDayStart.toISOString(), end: firstStart.toISOString(), durationMin: gap });
      }
      // Between bookings
      for (let i = 0; i < bookings.length - 1; i++) {
        const curEnd = new Date(new Date(bookings[i].scheduled_at as string).getTime() + (Number(bookings[i].duration_min) + BREAK_MIN) * 60000);
        const nextStart = new Date(bookings[i + 1].scheduled_at as string);
        const gap = (nextStart.getTime() - curEnd.getTime()) / 60000;
        if (gap >= 30) available.push({ start: curEnd.toISOString(), end: nextStart.toISOString(), durationMin: gap });
      }
      // After last booking
      const lastB = bookings[bookings.length - 1];
      const lastEnd = new Date(new Date(lastB.scheduled_at as string).getTime() + (Number(lastB.duration_min) + BREAK_MIN) * 60000);
      if (lastEnd < workDayEnd) {
        const gap = (workDayEnd.getTime() - lastEnd.getTime()) / 60000;
        if (gap >= 30) available.push({ start: lastEnd.toISOString(), end: workDayEnd.toISOString(), durationMin: gap });
      }
    }

    await sql.end();
    return NextResponse.json({
      success: true,
      date: dateStr,
      providerType: isFaith ? "faith_volunteer" : "charged_provider",
      breakConfig: { breakMinutes: BREAK_MIN, maxPerDay: MAX_PER_DAY, workingHours: WORK_START + ":00–" + WORK_END + ":00" },
      bookingCount: bookings.length,
      remainingSlots: MAX_PER_DAY - bookings.length,
      timeline,
      available,
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
