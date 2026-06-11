import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * POST /api/bookings/[id]/donate
 * Customer sends a thank-you donation after a faith service.
 * Body: { amount: number, currency?: string, message?: string, anonymous?: boolean }
 * Note: Faith services are FREE. Donations are purely voluntary.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { getIronSession } = await import("iron-session");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const session = await getIronSession<{ userId?: string }>(cookieStore, getSession());
    if (!session.userId) { await sql.end(); return NextResponse.json({ error: "Not logged in" }, { status: 401 }); }

    const { amount, currency, message, anonymous } = await req.json();

    // Verify booking
    const [booking] = await sql`SELECT id, customer_id, provider_id, status FROM bookings WHERE id = ${bookingId}`;
    if (!booking) { await sql.end(); return NextResponse.json({ error: "Booking not found" }, { status: 404 }); }
    if (booking.customer_id !== session.userId) { await sql.end(); return NextResponse.json({ error: "Not your booking" }, { status: 403 }); }

    // Ensure donations table
    await sql`CREATE TABLE IF NOT EXISTS faith_donations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      booking_id UUID NOT NULL,
      donor_id UUID NOT NULL,
      recipient_provider_id UUID,
      amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      currency TEXT DEFAULT 'AUD',
      message TEXT,
      is_anonymous BOOLEAN DEFAULT false,
      status TEXT DEFAULT 'completed',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    // Record donation (or just thank-you if amount = 0)
    const donationAmount = amount && amount > 0 ? amount : 0;
    const [donation] = await sql`INSERT INTO faith_donations (booking_id, donor_id, recipient_provider_id, amount, currency, message, is_anonymous)
      VALUES (${bookingId}, ${session.userId}, ${booking.provider_id}, ${donationAmount}, ${currency || 'AUD'}, ${message || null}, ${anonymous || false})
      RETURNING id, amount, currency`;

    // Notify volunteer (if not anonymous and provider exists)
    if (booking.provider_id && !anonymous) {
      const [provProfile] = await sql`SELECT user_id FROM provider_profiles WHERE id = ${booking.provider_id}`;
      if (provProfile) {
        const [donor] = await sql`SELECT name FROM users WHERE id = ${session.userId}`;
        const thankTitle = donationAmount > 0
          ? "Thank You Received! \u2764\ufe0f"
          : "Thank You Note \u2764\ufe0f";
        const thankBody = donationAmount > 0
          ? (donor?.name || "A senior") + " sent a $" + donationAmount.toFixed(2) + " donation" + (message ? ": \"" + message + "\"" : "")
          : (donor?.name || "A senior") + " sent you a thank-you" + (message ? ": \"" + message + "\"" : "");
        await sql`INSERT INTO notifications (user_id, kind, title, body, link)
          VALUES (${provProfile.user_id}, 'payment', ${thankTitle}, ${thankBody}, '/provider')`;
      }
    }

    // Update booking to released (service fully complete)
    await sql`UPDATE bookings SET status = 'released' WHERE id = ${bookingId} AND status = 'completed'`;

    await sql.end();
    return NextResponse.json({
      success: true,
      donationId: donation.id,
      amount: Number(donation.amount),
      currency: donation.currency,
      message: donationAmount > 0
        ? "Thank you for your generous donation! God bless you."
        : "Thank you for your kind words! The volunteer has been notified.",
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
