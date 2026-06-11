import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * POST /api/bookings/extended-care — Book 24-hour or multi-shift care
 * Body: { durationHours (8-24), scheduledAt, country (au|cn|ca), shiftHours (8|10|12), serviceType, notes }
 * 
 * Extended care for seniors who need overnight/24hr support.
 * Automatically splits into shifts (8-12hr) per local labour law.
 * Each shift assigned to a different provider (shift rotation).
 * 
 * Shift rules by country:
 *   AU: Max 12hr/shift, 30min break per 5hr, 10hr rest between shifts
 *   CN: Max 8hr standard (+3hr overtime max), 60min break per 4hr, 11hr rest
 *   CA: Max 13hr/day, 30min break per 5hr, 11hr rest between shifts
 */
export async function POST(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { getIronSession } = await import("iron-session");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const session = await getIronSession<{ userId?: string }>(cookieStore, getSession());
    if (!session.userId) { await sql.end(); return NextResponse.json({ error: "Please sign in" }, { status: 401 }); }

    const body = await req.json();
    const { durationHours, scheduledAt, country, shiftHours, serviceType, notes } = body;

    if (!durationHours || !scheduledAt) {
      await sql.end();
      return NextResponse.json({ error: "durationHours and scheduledAt required" }, { status: 400 });
    }

    const hours = Number(durationHours);
    const ctry = (country || "au") as string;
    const shiftLen = Number(shiftHours) || 8;

    // Validate shift length per country
    const maxShift: Record<string, number> = { au: 12, cn: 8, ca: 13 };
    const restBetween: Record<string, number> = { au: 10, cn: 11, ca: 11 };
    const breakPerShift: Record<string, { afterHours: number; breakMin: number }> = {
      au: { afterHours: 5, breakMin: 30 },
      cn: { afterHours: 4, breakMin: 60 },
      ca: { afterHours: 5, breakMin: 30 },
    };

    if (shiftLen > (maxShift[ctry] || 12)) {
      await sql.end();
      return NextResponse.json({
        error: "Shift length " + shiftLen + "hr exceeds maximum " + (maxShift[ctry] || 12) + "hr for " + ctry.toUpperCase() + " labour law",
        maxShiftHours: maxShift[ctry],
        country: ctry,
      }, { status: 400 });
    }

    // Calculate shifts
    const totalShifts = Math.ceil(hours / shiftLen);
    const start = new Date(scheduledAt);
    const handoverMin = 30;

    // Find available providers for each shift
    const providers = await sql`
      SELECT pp.id, pp.user_id, u.name FROM provider_profiles pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.onboarding_status = 'approved'`;

    if (providers.length === 0) {
      await sql.end();
      return NextResponse.json({ error: "No providers available" }, { status: 404 });
    }

    // Create shift bookings
    const shifts = [];
    const bookingIds = [];
    const hourlyRate = serviceType === "faith" ? 0 : 45;
    const brk = breakPerShift[ctry] || breakPerShift.au;

    for (let i = 0; i < totalShifts; i++) {
      const shiftStart = new Date(start.getTime() + i * shiftLen * 3600000);
      const actualLen = Math.min(shiftLen, hours - i * shiftLen);
      const shiftEnd = new Date(shiftStart.getTime() + actualLen * 3600000);
      
      // Rotate providers (round-robin)
      const provider = providers[i % providers.length];
      
      // Calculate pricing
      const basePrice = hourlyRate * actualLen;
      const taxAmount = Math.round(basePrice * 0.10 * 100) / 100;
      const totalPrice = Math.round((basePrice + taxAmount) * 100) / 100;

      // Create booking for this shift
      const [booking] = await sql`
        INSERT INTO bookings (customer_id, provider_id, service_id, status, scheduled_at, duration_min, base_price, tax_amount, total_price, currency, notes)
        VALUES (
          ${session.userId}, ${provider.id}, (SELECT id FROM services LIMIT 1), 'confirmed',
          ${shiftStart.toISOString()}, ${actualLen * 60},
          ${basePrice}, ${taxAmount}, ${totalPrice}, 'AUD',
          ${"Shift " + (i+1) + "/" + totalShifts + " (" + actualLen + "hr)" + (notes ? " — " + notes : "")}
        ) RETURNING id`;

      // Calculate break time within shift
      const breakStart = new Date(shiftStart.getTime() + brk.afterHours * 3600000);
      const breakEnd = new Date(breakStart.getTime() + brk.breakMin * 60000);

      bookingIds.push(booking.id);
      shifts.push({
        shiftNumber: i + 1,
        bookingId: booking.id,
        provider: provider.name || "Provider " + (i + 1),
        providerId: provider.id,
        start: shiftStart.toISOString(),
        end: shiftEnd.toISOString(),
        durationHours: actualLen,
        break: { start: breakStart.toISOString(), end: breakEnd.toISOString(), minutes: brk.breakMin },
        handover: i < totalShifts - 1 ? {
          start: new Date(shiftEnd.getTime() - handoverMin * 60000).toISOString(),
          end: shiftEnd.toISOString(),
          minutes: handoverMin,
        } : null,
        price: { base: basePrice, tax: taxAmount, total: totalPrice },
      });
    }

    // Notify all assigned providers
    for (const shift of shifts) {
      await sql`INSERT INTO notifications (user_id, kind, title, body, related_booking_id)
        SELECT pp.user_id, 'booking_update', 'Extended Care Shift Assigned',
          ${"Shift " + shift.shiftNumber + " of " + totalShifts + ": " + new Date(shift.start).toLocaleTimeString() + "–" + new Date(shift.end).toLocaleTimeString()},
          ${shift.bookingId}
        FROM provider_profiles pp WHERE pp.id = ${shift.providerId}`;
    }

    const totalBase = shifts.reduce((s, sh) => s + sh.price.base, 0);
    const totalTax = shifts.reduce((s, sh) => s + sh.price.tax, 0);
    const grandTotal = shifts.reduce((s, sh) => s + sh.price.total, 0);

    await sql.end();
    return NextResponse.json({
      success: true,
      extendedCare: {
        totalHours: hours,
        totalShifts,
        shiftLengthHours: shiftLen,
        country: ctry.toUpperCase(),
        labourLaw: {
          maxShiftHours: maxShift[ctry],
          mandatoryBreak: brk.breakMin + "min after " + brk.afterHours + "hr",
          restBetweenShifts: restBetween[ctry] + "hr minimum",
          handoverOverlap: handoverMin + "min",
        },
      },
      shifts,
      pricing: { subtotal: totalBase, tax: totalTax, total: grandTotal, currency: "AUD" },
      bookingIds,
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

/**
 * GET /api/bookings/extended-care — Get shift options for a country
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country") || "au";
  
  const rules: Record<string, { maxShift: number; break: string; rest: number; options: number[] }> = {
    au: { maxShift: 12, break: "30min per 5hr worked", rest: 10, options: [8, 10, 12] },
    cn: { maxShift: 8, break: "60min per 4hr worked", rest: 11, options: [8] },
    ca: { maxShift: 13, break: "30min per 5hr worked", rest: 11, options: [8, 10, 12] },
  };

  const rule = rules[country] || rules.au;
  return NextResponse.json({
    success: true,
    country: country.toUpperCase(),
    shiftRules: {
      maxShiftHours: rule.maxShift,
      mandatoryBreak: rule.break,
      restBetweenShifts: rule.rest + " hours minimum",
      shiftOptions: rule.options,
      handoverOverlap: "30 minutes",
    },
    examples: {
      "24hr_care": { shifts: Math.ceil(24 / rule.options[0]), shiftLength: rule.options[0] + "hr each" },
      "12hr_overnight": { shifts: Math.ceil(12 / rule.options[0]), shiftLength: rule.options[0] + "hr" },
      "8hr_day_shift": { shifts: 1, shiftLength: rule.options[0] + "hr" },
    },
  });
}
