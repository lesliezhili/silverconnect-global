import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { hasGovtFundingAccess } from "@/lib/auth/govtFundingAccess";

export const dynamic = "force-dynamic";

const VALID_SCHEMES = ["tac", "worksafe", "ndis", "my_aged_care", "dva", "hcp", "aged_pension", "super"];

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * POST /api/bookings/charged — Book a PAID service
 * Body: { categoryCode, durationMin, scheduledAt, notes, basePrice, taxAmount, totalPrice }

    // Extended care (8+ hours) should use /api/bookings/extended-care endpoint
    // which handles shift rotation per local labour law (8-12hr shifts).
    // Allow up to 480min here for edge cases, but recommend extended-care for longer.
    if (durationMin > 720) {
      await sql.end();
      return NextResponse.json({
        error: "For bookings over 12 hours, please use the Extended Care booking system which handles shift rotation per local labour law.",
        redirect: "/api/bookings/extended-care",
        tip: "Extended care auto-splits into 8-12hr shifts with mandatory breaks and provider rotation"
      }, { status: 400 });
    }
 */
export async function POST(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { getIronSession } = await import("iron-session");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const session = await getIronSession<{ userId?: string; email?: string }>(cookieStore, getSession());
    if (!session.userId) { await sql.end(); return NextResponse.json({ error: "Please sign in to book" }, { status: 401 }); }

    const body = await req.json();
    const { categoryCode, durationMin, scheduledAt, notes, basePrice, taxAmount, totalPrice } = body;

    if (!categoryCode || !scheduledAt || !basePrice) {
      await sql.end();
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // A funding scheme is only honored for allowlisted accounts — a
    // client-side toggle is UX only, this is the real boundary. Anyone
    // else (or an invalid scheme id) silently falls back to self-funded,
    // matching today's existing behavior rather than hard-failing.
    const requestedScheme = typeof body.fundingScheme === "string" ? body.fundingScheme : null;
    const fundingScheme =
      requestedScheme && VALID_SCHEMES.includes(requestedScheme) && (await hasGovtFundingAccess(session.email))
        ? requestedScheme
        : null;

    // Find a service in this category
    const [service] = await sql`
      SELECT s.id FROM services s
      JOIN service_categories sc ON sc.code = s.category_code
      WHERE s.category_code = ${categoryCode} AND s.enabled = true
      ORDER BY s.sort_order ASC LIMIT 1`;

    // Customer's default saved address (if any) drives distance-based
    // ranking below — best-effort, no new UI needed. Customers without a
    // saved default just fall back to rating-only ranking (distance_km
    // is NULL, so it naturally sorts last / doesn't exclude anyone).
    const [defaultAddress] = await sql`
      SELECT lat, lng FROM addresses WHERE user_id = ${session.userId} AND is_default = true LIMIT 1`;
    const customerLat = defaultAddress?.lat != null ? Number(defaultAddress.lat) : null;
    const customerLng = defaultAddress?.lng != null ? Number(defaultAddress.lng) : null;

    // Ranks candidate providers who offer this category by: rating (desc),
    // then distance from the customer's default address (asc, unknown
    // distances sort last), then review count as a confidence tie-break.
    // Replaces the previous ORDER BY RANDOM() — which also never checked
    // category at all, so a customer could be matched to a provider who
    // doesn't even offer the requested service.
    async function rankedProviders(schemeFilter: string | null) {
      return sql`
        WITH scored AS (
          SELECT pp.id, pp.service_radius_km,
            COALESCE(AVG(r.rating), 0) AS avg_rating,
            COUNT(r.id) AS review_count,
            CASE WHEN pp.service_lat IS NOT NULL AND pp.service_lng IS NOT NULL
                 AND ${customerLat}::float IS NOT NULL AND ${customerLng}::float IS NOT NULL THEN
              6371 * acos(LEAST(1, GREATEST(-1,
                cos(radians(${customerLat}::float)) * cos(radians(pp.service_lat::float)) * cos(radians(pp.service_lng::float) - radians(${customerLng}::float)) +
                sin(radians(${customerLat}::float)) * sin(radians(pp.service_lat::float))
              )))
            ELSE NULL END AS distance_km
          FROM provider_profiles pp
          JOIN provider_categories pc ON pc.provider_id = pp.id AND pc.category = ${categoryCode}
          LEFT JOIN reviews r ON r.provider_id = pp.id AND r.status = 'published'
          WHERE pp.onboarding_status = 'approved'
            ${schemeFilter ? sql`AND pp.govt_schemes IS NOT NULL AND ${schemeFilter} = ANY(pp.govt_schemes)` : sql``}
          GROUP BY pp.id
        )
        SELECT id FROM scored
        WHERE distance_km IS NULL OR distance_km <= service_radius_km
        ORDER BY avg_rating DESC, distance_km ASC NULLS LAST, review_count DESC
        LIMIT 1`;
    }

    // Find an available provider — scheme-registered only when a
    // government funding scheme was selected, otherwise any approved
    // provider offering this category.
    let providerId: string | undefined;
    if (fundingScheme) {
      const [schemeProvider] = await rankedProviders(fundingScheme);
      providerId = schemeProvider?.id;
      if (!providerId) {
        await sql.end();
        return NextResponse.json({
          error: `No providers currently registered for ${fundingScheme.toUpperCase()} are available. Please try again later or choose self-funded.`,
        }, { status: 404 });
      }
    } else {
      const [provider] = await rankedProviders(null);
      providerId = provider?.id;

      // Fallback: any approved provider, regardless of category — only
      // reached if literally no one offers this category yet.
      if (!providerId) {
        const [any] = await sql`SELECT id FROM provider_profiles WHERE onboarding_status = 'approved' LIMIT 1`;
        providerId = any?.id;
      }
    }

    if (!providerId) { await sql.end(); return NextResponse.json({ error: "No available providers" }, { status: 404 }); }

    
    // === BREAK TIME ENFORCEMENT (30 min between charged service jobs) ===
    const CHARGED_BREAK_MIN = 30;
    const MAX_CHARGED_PER_DAY = 4;
    
    if (providerId) {
      const reqStart = new Date(scheduledAt);
      const reqEnd = new Date(reqStart.getTime() + (durationMin || 60) * 60000);
      const bufferStart = new Date(reqStart.getTime() - CHARGED_BREAK_MIN * 60000).toISOString();
      const bufferEnd = new Date(reqEnd.getTime() + CHARGED_BREAK_MIN * 60000).toISOString();
      
      const conflicts = await sql`
        SELECT id, scheduled_at, duration_min FROM bookings
        WHERE provider_id = ${providerId} AND status IN ('confirmed', 'in_progress')
        AND scheduled_at < ${bufferEnd}
        AND (scheduled_at + (duration_min || ' minutes')::interval) > ${bufferStart}`;
      
      if (conflicts.length > 0) {
        const c = conflicts[0];
        const cEnd = new Date(new Date(c.scheduled_at as string).getTime() + (Number(c.duration_min) + CHARGED_BREAK_MIN) * 60000);
        await sql.end();
        return NextResponse.json({
          error: "Provider needs a 30-minute break between jobs. Next available: " + cEnd.toISOString().slice(11, 16),
          nextAvailable: cEnd.toISOString(),
          breakMinutes: CHARGED_BREAK_MIN,
        }, { status: 409 });
      }

      // Check daily max
      const dayStart = new Date(reqStart); dayStart.setUTCHours(0,0,0,0);
      const dayEnd = new Date(dayStart); dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
      const [dc] = await sql`SELECT COUNT(*) as cnt FROM bookings WHERE provider_id = ${providerId} AND status IN ('confirmed','in_progress') AND scheduled_at >= ${dayStart.toISOString()} AND scheduled_at < ${dayEnd.toISOString()}`;
      if (Number(dc?.cnt || 0) >= MAX_CHARGED_PER_DAY) {
        await sql.end();
        return NextResponse.json({ error: "Provider has reached maximum 4 jobs for this day. Please choose another date.", maxPerDay: MAX_CHARGED_PER_DAY }, { status: 409 });
      }
    }
    // === END BREAK TIME ENFORCEMENT ===

    // Create booking with price
    const [booking] = await sql`
      INSERT INTO bookings (customer_id, provider_id, service_id, status, scheduled_at, duration_min, base_price, tax_amount, total_price, currency, notes, funding_scheme)
      VALUES (${session.userId}, ${providerId}, ${service?.id || null}, 'confirmed', ${scheduledAt}, ${durationMin || 60}, ${basePrice}, ${taxAmount}, ${totalPrice}, 'AUD', ${notes || ''}, ${fundingScheme})
      RETURNING id, status, total_price`;

    // Create payment intent (mock for now)
    const paymentIntentId = "pi_charged_" + Date.now();
    await sql`INSERT INTO payments (booking_id, stripe_payment_intent_id, amount, currency, status)
      VALUES (${booking.id}, ${paymentIntentId}, ${totalPrice}, 'AUD', 'authorized')`;

    // Notify provider
    await sql`INSERT INTO notifications (user_id, kind, title, body, related_booking_id)
      SELECT pp.user_id, 'booking_update', 'New Booking', ${'New ' + categoryCode + ' booking — $' + totalPrice}, ${booking.id}
      FROM provider_profiles pp WHERE pp.id = ${providerId}`;

    await sql.end();
    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      status: booking.status,
      totalPrice: Number(booking.total_price),
      paymentIntent: paymentIntentId,
      message: "Booking confirmed. Payment authorized.",
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

/**
 * GET /api/bookings/charged — List available paid services with pricing
 */
export async function GET(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const services = await sql`
      SELECT s.id, s.code, s.category_code, s.duration_min, sc.icon_key,
        COALESCE(sp.base_rate_per_hour, 45) as hourly_rate,
        COALESCE(sp.currency, 'AUD') as currency,
        COALESCE(sp.tax_rate, 0.10) as tax_rate
      FROM services s
      JOIN service_categories sc ON sc.code = s.category_code
      LEFT JOIN service_pricing sp ON sp.service_id = s.id
      WHERE s.enabled = true AND s.category_code != 'faith'
      ORDER BY sc.sort_order, s.sort_order`;

    await sql.end();
    return NextResponse.json({
      success: true,
      services: services.map((s: Record<string, unknown>) => ({
        id: s.id, code: s.code, category: s.category_code,
        duration: s.duration_min, hourlyRate: Number(s.hourly_rate),
        currency: s.currency, taxRate: Number(s.tax_rate),
      })),
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
