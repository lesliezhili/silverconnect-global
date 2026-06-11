import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * GET /api/provider/earnings — Provider's earnings + donation history
 * Returns: paid earnings (from bookings), faith donations, total, monthly breakdown
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

    const [profile] = await sql`SELECT id FROM provider_profiles WHERE user_id = ${session.userId}`;
    if (!profile) { await sql.end(); return NextResponse.json({ error: "Not registered as provider" }, { status: 404 }); }

    // Paid earnings (from wallets table for non-faith bookings)
    let paidEarnings = { total: 0, currency: "AUD" };
    try {
      const [wallet] = await sql`SELECT balance_available, balance_pending, currency FROM wallets WHERE provider_id = ${profile.id}`;
      if (wallet) paidEarnings = { total: Number(wallet.balance_available || 0) + Number(wallet.balance_pending || 0), currency: wallet.currency || "AUD" };
    } catch {}

    // Faith donations received
    let donations: Record<string, unknown>[] = [];
    let donationTotal = 0;
    try {
      await sql`CREATE TABLE IF NOT EXISTS faith_donations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY, booking_id UUID NOT NULL,
        donor_id UUID NOT NULL, recipient_provider_id UUID, amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        currency TEXT DEFAULT 'AUD', message TEXT, is_anonymous BOOLEAN DEFAULT false,
        status TEXT DEFAULT 'completed', created_at TIMESTAMPTZ DEFAULT NOW())`;

      donations = await sql`
        SELECT fd.id, fd.amount, fd.currency, fd.message, fd.is_anonymous, fd.created_at,
               CASE WHEN fd.is_anonymous THEN 'Anonymous' ELSE u.name END as donor_name,
               s.code as service_code
        FROM faith_donations fd
        LEFT JOIN users u ON u.id = fd.donor_id
        LEFT JOIN bookings b ON b.id = fd.booking_id
        LEFT JOIN services s ON s.id = b.service_id
        WHERE fd.recipient_provider_id = ${profile.id}
        ORDER BY fd.created_at DESC
        LIMIT 50`;

      const [total] = await sql`SELECT COALESCE(SUM(amount), 0) as total FROM faith_donations WHERE recipient_provider_id = ${profile.id}`;
      donationTotal = Number(total?.total || 0);
    } catch {}

    // Monthly breakdown (last 6 months)
    let monthlyBreakdown: Record<string, unknown>[] = [];
    try {
      monthlyBreakdown = await sql`
        SELECT TO_CHAR(created_at, 'YYYY-MM') as month,
               COUNT(*) as donation_count,
               COALESCE(SUM(amount), 0) as total_amount
        FROM faith_donations
        WHERE recipient_provider_id = ${profile.id}
          AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month DESC`;
    } catch {}

    // Completed services count
    let completedServices = 0;
    try {
      const [count] = await sql`SELECT COUNT(*) as total FROM bookings WHERE provider_id = ${profile.id} AND status IN ('completed', 'released')`;
      completedServices = Number(count?.total || 0);
    } catch {}

    // Thank-you messages (recent)
    const thankYouMessages = donations.filter((d: Record<string, unknown>) => d.message).slice(0, 10);

    await sql.end();
    return NextResponse.json({
      success: true,
      summary: {
        paidEarnings: paidEarnings.total,
        donationsReceived: donationTotal,
        totalIncome: paidEarnings.total + donationTotal,
        currency: paidEarnings.currency,
        completedServices,
        totalDonationCount: donations.length,
      },
      donations: donations.map((d: Record<string, unknown>) => ({
        id: d.id, amount: Number(d.amount), currency: d.currency,
        donorName: d.donor_name, message: d.message, service: d.service_code,
        date: d.created_at,
      })),
      monthlyBreakdown,
      recentThankYous: thankYouMessages.map((d: Record<string, unknown>) => ({
        message: d.message, donor: d.donor_name, date: d.created_at,
      })),
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
