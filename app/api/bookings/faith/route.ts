import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * GET /api/bookings/faith — List available faith services + volunteers
 * POST /api/bookings/faith — Book a faith service (FREE)
 */
export async function GET(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { searchParams } = new URL(req.url);
    const serviceCode = searchParams.get("service") || null;

    // Get faith services
    const services = await sql`SELECT id, code, duration_min, sort_order FROM services WHERE category_code = 'faith' AND enabled = true ORDER BY sort_order`;

    // Get approved faith volunteers
    const volunteers = await sql`
      SELECT pp.id as provider_id, pp.bio, pp.notes, pp.service_radius_km,
             u.id as user_id, u.name, u.phone
      FROM provider_profiles pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.onboarding_status = 'approved'
        AND pp.notes LIKE '%faith_volunteer%'
      ORDER BY u.name`;

    // Get translations
    let translations: Record<string, unknown>[] = [];
    try {
      translations = await sql`SELECT service_code, locale, name, description FROM service_translations WHERE locale IN ('en', 'zh') AND service_code IN (SELECT code FROM services WHERE category_code = 'faith')`;
    } catch {}

    // Get volunteer schedule (next 7 days)
    let schedules: Record<string, unknown>[] = [];
    try {
      schedules = await sql`SELECT provider_id, day_of_week, start_hour, end_hour, service_code FROM faith_volunteer_schedule WHERE is_active = true`;
    } catch {}

    await sql.end();

    // Build service list with translations
    const serviceList = services.map((s: Record<string, unknown>) => {
      const enT = translations.find((t: Record<string, unknown>) => t.service_code === s.code && t.locale === "en");
      const zhT = translations.find((t: Record<string, unknown>) => t.service_code === s.code && t.locale === "zh");
      return {
        id: s.id, code: s.code, durationMin: s.duration_min,
        name: (enT as Record<string, unknown>)?.name || s.code,
        name_zh: (zhT as Record<string, unknown>)?.name || null,
        description: (enT as Record<string, unknown>)?.description || null,
      };
    });

    // Parse volunteer details
    const volunteerList = volunteers.map((v: Record<string, unknown>) => {
      let faithDetails = null;
      try { faithDetails = JSON.parse(v.notes as string); } catch {}
      const volunteerSchedule = schedules.filter((s: Record<string, unknown>) => s.provider_id === v.provider_id);
      return {
        providerId: v.provider_id, name: v.name, bio: v.bio,
        church: faithDetails?.churchName || null,
        servicesOffered: faithDetails?.servicesOffered || [],
        availability: volunteerSchedule.map((s: Record<string, unknown>) => ({
          day: s.day_of_week, start: s.start_hour, end: s.end_hour,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      services: serviceList,
      volunteers: volunteerList,
      pricing: "FREE (donation-based)",
      note: "Faith services are provided by volunteers at no cost. Donations are welcome but never required.",
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
    if (!session.userId) { await sql.end(); return NextResponse.json({ error: "Please log in to book" }, { status: 401 }); }

    const body = await req.json();
    const { serviceCode, providerId, scheduledAt, notes } = body;

    if (!serviceCode) { await sql.end(); return NextResponse.json({ error: "Service code required" }, { status: 400 }); }
    if (!scheduledAt) { await sql.end(); return NextResponse.json({ error: "Preferred date/time required" }, { status: 400 }); }

    // Get service
    const [service] = await sql`SELECT id, code, duration_min FROM services WHERE code = ${serviceCode} AND category_code = 'faith'`;
    if (!service) { await sql.end(); return NextResponse.json({ error: "Service not found" }, { status: 404 }); }

    // Find provider (if specified) or auto-assign
    let assignedProvider = providerId;
    if (!assignedProvider) {
      // Auto-assign: find approved faith volunteer who offers this service
      const candidates = await sql`
        SELECT pp.id FROM provider_profiles pp
        WHERE pp.onboarding_status = 'approved' AND pp.notes LIKE ${'%' + serviceCode + '%'}
        LIMIT 1`;
      if (candidates.length > 0) assignedProvider = candidates[0].id;
    }

    
    // === BREAK TIME ENFORCEMENT (15 min between faith visits) ===
    const FAITH_BREAK_MIN = 15;
    const MAX_FAITH_PER_DAY = 6;
    const serviceDuration = Number(service.duration_min) || 60;
    
    if (assignedProvider) {
      const reqStart = new Date(scheduledAt);
      const reqEnd = new Date(reqStart.getTime() + serviceDuration * 60000);
      const bufferStart = new Date(reqStart.getTime() - FAITH_BREAK_MIN * 60000).toISOString();
      const bufferEnd = new Date(reqEnd.getTime() + FAITH_BREAK_MIN * 60000).toISOString();
      
      // Check time conflicts
      const conflicts = await sql`
        SELECT id, scheduled_at, duration_min FROM bookings
        WHERE provider_id = ${assignedProvider} AND status IN ('confirmed', 'in_progress')
        AND scheduled_at < ${bufferEnd}
        AND (scheduled_at + (duration_min || ' minutes')::interval) > ${bufferStart}`;
      
      if (conflicts.length > 0) {
        const c = conflicts[0];
        const cEnd = new Date(new Date(c.scheduled_at as string).getTime() + (Number(c.duration_min) + FAITH_BREAK_MIN) * 60000);
        await sql.end();
        return NextResponse.json({
          error: "Volunteer needs a 15-minute break between visits. Next available: " + cEnd.toISOString().slice(11, 16),
          nextAvailable: cEnd.toISOString(),
          breakMinutes: FAITH_BREAK_MIN,
        }, { status: 409 });
      }

      // Check daily max
      const dayStart = new Date(reqStart); dayStart.setUTCHours(0,0,0,0);
      const dayEnd = new Date(dayStart); dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
      const [dc] = await sql`SELECT COUNT(*) as cnt FROM bookings WHERE provider_id = ${assignedProvider} AND status IN ('confirmed','in_progress') AND scheduled_at >= ${dayStart.toISOString()} AND scheduled_at < ${dayEnd.toISOString()}`;
      if (Number(dc?.cnt || 0) >= MAX_FAITH_PER_DAY) {
        await sql.end();
        return NextResponse.json({ error: "Volunteer has reached maximum 6 visits for this day. Please choose another date.", maxPerDay: MAX_FAITH_PER_DAY }, { status: 409 });
      }
    }
    // === END BREAK TIME ENFORCEMENT ===

    // Create booking (FREE — no payment)
    const [booking] = await sql`INSERT INTO bookings (customer_id, provider_id, service_id, status, scheduled_at, duration_min, base_price, tax_amount, total_price, currency, notes)
      VALUES (${session.userId}, ${assignedProvider || null}, ${service.id}, ${assignedProvider ? 'confirmed' : 'pending'}, ${scheduledAt}, ${service.duration_min}, 0, 0, 0, 'AUD', ${notes || 'Faith service booking (free)'})
      RETURNING id, status, scheduled_at, duration_min`;

    // Notify customer
    await sql`INSERT INTO notifications (user_id, kind, title, body, link)
      VALUES (${session.userId}, 'booking_update', 'Booking Confirmed', ${'Your ' + serviceCode.replace(/_/g, ' ') + ' has been booked for ' + new Date(scheduledAt).toLocaleDateString() + '. A volunteer will be in touch!'}, ${'/bookings/' + booking.id})`;

    // Notify provider (if assigned)
    if (assignedProvider) {
      const [pProfile] = await sql`SELECT user_id FROM provider_profiles WHERE id = ${assignedProvider}`;
      if (pProfile) {
        await sql`INSERT INTO notifications (user_id, kind, title, body, link)
          VALUES (${pProfile.user_id}, 'booking_update', 'New Faith Service Request', ${'A senior has booked ' + serviceCode.replace(/_/g, ' ') + ' on ' + new Date(scheduledAt).toLocaleDateString() + '. After the visit, please submit a prayer report.'}, ${'/provider/prayer-report/' + booking.id})`;
      }
    }

    await sql.end();
    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      status: booking.status,
      scheduledAt: booking.scheduled_at,
      durationMin: booking.duration_min,
      price: "FREE",
      message: assignedProvider
        ? "Booking confirmed! Your volunteer will contact you before the visit."
        : "Request received! We will match you with a volunteer within 24 hours.",
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
