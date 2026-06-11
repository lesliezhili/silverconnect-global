import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings/check-availability
 * Query: ?providerId=xxx&scheduledAt=ISO&durationMin=60&type=faith|charged
 * 
 * Checks if a booking time slot is available, respecting break times:
 * - Faith services: 15 min break between jobs
 * - Charged services: 30 min break between jobs
 * - Max bookings per day enforced
 * - Working hours: 7AM-8PM
 * 
 * Returns: { available, conflicts[], nextSlot, breakInfo }
 */
export async function GET(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get("providerId") || "";
    const scheduledAt = searchParams.get("scheduledAt") || "";
    const durationMin = parseInt(searchParams.get("durationMin") || "60");
    const serviceType = searchParams.get("type") || "faith"; // faith or charged

    if (!providerId || !scheduledAt) {
      await sql.end();
      return NextResponse.json({ error: "providerId and scheduledAt required" }, { status: 400 });
    }

    // Break time config
    const BREAK_MIN = serviceType === "faith" ? 15 : 30;
    const MAX_PER_DAY = serviceType === "faith" ? 6 : 4;
    const EARLIEST_HOUR = 7;
    const LATEST_HOUR = 20;

    const requestedStart = new Date(scheduledAt);
    const requestedEnd = new Date(requestedStart.getTime() + durationMin * 60000);
    const hour = requestedStart.getUTCHours();

    const issues: string[] = [];

    // 1. Check working hours
    if (hour < EARLIEST_HOUR) {
      issues.push("Too early — service hours start at 7:00 AM");
    }
    if (hour >= LATEST_HOUR) {
      issues.push("Too late — service hours end at 8:00 PM");
    }
    const endHour = requestedEnd.getUTCHours() + (requestedEnd.getUTCMinutes() > 0 ? 1 : 0);
    if (endHour > LATEST_HOUR) {
      issues.push("Service would end after 8:00 PM");
    }

    // 2. Check daily booking count
    const dayStart = new Date(requestedStart);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const [dayCount] = await sql`
      SELECT COUNT(*) as cnt FROM bookings
      WHERE provider_id = ${providerId}
        AND status IN ('confirmed', 'in_progress')
        AND scheduled_at >= ${dayStart.toISOString()}
        AND scheduled_at < ${dayEnd.toISOString()}`;
    
    const todayCount = Number(dayCount?.cnt || 0);
    if (todayCount >= MAX_PER_DAY) {
      issues.push("Maximum " + MAX_PER_DAY + " bookings per day reached (" + todayCount + " already scheduled)");
    }

    // 3. Check time conflicts (including break time buffer)
    // A booking blocks: [scheduled_at - BREAK_MIN, scheduled_at + duration + BREAK_MIN]
    const bufferStart = new Date(requestedStart.getTime() - BREAK_MIN * 60000).toISOString();
    const bufferEnd = new Date(requestedEnd.getTime() + BREAK_MIN * 60000).toISOString();

    const conflicts = await sql`
      SELECT id, scheduled_at, duration_min, status
      FROM bookings
      WHERE provider_id = ${providerId}
        AND status IN ('confirmed', 'in_progress')
        AND scheduled_at < ${bufferEnd}
        AND (scheduled_at + (duration_min || ' minutes')::interval) > ${new Date(requestedStart.getTime() - BREAK_MIN * 60000).toISOString()}`;

    if (conflicts.length > 0) {
      for (const c of conflicts) {
        const cStart = new Date(c.scheduled_at as string);
        const cEnd = new Date(cStart.getTime() + Number(c.duration_min) * 60000);
        issues.push("Conflicts with existing booking at " + cStart.toISOString().slice(11, 16) + "–" + cEnd.toISOString().slice(11, 16) + " (+" + BREAK_MIN + "min break)");
      }
    }

    // 4. Find next available slot if not available
    let nextSlot: string | null = null;
    if (issues.length > 0) {
      // Find the next free window after the conflicting bookings
      const dayBookings = await sql`
        SELECT scheduled_at, duration_min FROM bookings
        WHERE provider_id = ${providerId}
          AND status IN ('confirmed', 'in_progress')
          AND scheduled_at >= ${dayStart.toISOString()}
          AND scheduled_at < ${dayEnd.toISOString()}
        ORDER BY scheduled_at ASC`;

      if (dayBookings.length > 0) {
        // Check after last booking + break
        const last = dayBookings[dayBookings.length - 1];
        const lastEnd = new Date(new Date(last.scheduled_at as string).getTime() + (Number(last.duration_min) + BREAK_MIN) * 60000);
        const suggestedEnd = new Date(lastEnd.getTime() + durationMin * 60000);
        if (suggestedEnd.getUTCHours() <= LATEST_HOUR) {
          nextSlot = lastEnd.toISOString();
        }
      }
    }

    await sql.end();

    const available = issues.length === 0;
    return NextResponse.json({
      success: true,
      available,
      issues: issues.length > 0 ? issues : undefined,
      conflicts: conflicts.length > 0 ? conflicts.map((c: Record<string, unknown>) => ({
        bookingId: c.id,
        scheduledAt: c.scheduled_at,
        duration: c.duration_min,
      })) : undefined,
      nextSlot: nextSlot || undefined,
      breakInfo: {
        breakMinutes: BREAK_MIN,
        maxPerDay: MAX_PER_DAY,
        workingHours: EARLIEST_HOUR + ":00–" + LATEST_HOUR + ":00",
        reason: serviceType === "faith"
          ? "15 min rest between spiritual visits ensures quality presence"
          : "30 min break between physical service jobs prevents burnout",
      },
      request: {
        start: requestedStart.toISOString(),
        end: requestedEnd.toISOString(),
        withBreak: new Date(requestedEnd.getTime() + BREAK_MIN * 60000).toISOString(),
      },
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
