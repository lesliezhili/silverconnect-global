import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";

/**
 * GET /api/admin/analytics-nz — NZ vs AU analytics comparison
 * Returns: provider counts, booking volume, revenue, avg ratings, growth by country
 */
export async function GET() {
  const me = await getCurrentUser();
  if (!me || !me.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    // Get all user country preferences
    const prefs = await sql`SELECT key, value FROM platform_settings WHERE key LIKE 'user_country_%'`;
    const userCountries: Record<string, string> = {};
    for (const p of prefs) {
      const userId = p.key.replace("user_country_", "");
      try { userCountries[userId] = JSON.parse(p.value).country || "AU"; } catch { userCountries[userId] = "AU"; }
    }

    // Provider stats by country
    const providers = await sql`
      SELECT pp.user_id, pp.onboarding_status, pp.approved_at, pp.created_at
      FROM provider_profiles pp
    `;
    const providerStats = { AU: { total: 0, approved: 0, pending: 0, rejected: 0 }, NZ: { total: 0, approved: 0, pending: 0, rejected: 0 } };
    for (const p of providers) {
      const country = userCountries[p.user_id] || "AU";
      const c = country === "NZ" ? "NZ" : "AU";
      providerStats[c].total++;
      if (p.onboarding_status === "approved") providerStats[c].approved++;
      else if (p.onboarding_status === "pending") providerStats[c].pending++;
      else if (p.onboarding_status === "rejected") providerStats[c].rejected++;
    }

    // Booking stats
    const bookings = await sql`
      SELECT b.id, b.customer_id, b.provider_id, b.status, b.total_price, b.currency,
        b.scheduled_at, b.completed_at, b.duration_min, b.base_price, b.tax_amount
      FROM bookings b ORDER BY b.scheduled_at DESC
    `;
    const bookingStats = {
      AU: { total: 0, completed: 0, revenue: 0, avgPrice: 0, avgDuration: 0, taxCollected: 0 },
      NZ: { total: 0, completed: 0, revenue: 0, avgPrice: 0, avgDuration: 0, taxCollected: 0 },
    };
    for (const b of bookings) {
      const country = (b.currency === "NZD" || userCountries[b.customer_id] === "NZ") ? "NZ" : "AU";
      const c = country === "NZ" ? "NZ" : "AU";
      bookingStats[c].total++;
      if (b.status === "completed") {
        bookingStats[c].completed++;
        bookingStats[c].revenue += parseFloat(b.total_price || "0");
        bookingStats[c].avgDuration += parseInt(b.duration_min || "0");
        bookingStats[c].taxCollected += parseFloat(b.tax_amount || "0");
      }
    }
    for (const c of ["AU", "NZ"] as const) {
      if (bookingStats[c].completed > 0) {
        bookingStats[c].avgPrice = Math.round(bookingStats[c].revenue / bookingStats[c].completed * 100) / 100;
        bookingStats[c].avgDuration = Math.round(bookingStats[c].avgDuration / bookingStats[c].completed);
      }
    }

    // Review/rating stats
    const reviews = await sql`
      SELECT r.provider_id, r.rating, r.customer_id
      FROM reviews r
    `;
    const ratingStats = { AU: { total: 0, sum: 0, avg: 0, five_star: 0 }, NZ: { total: 0, sum: 0, avg: 0, five_star: 0 } };
    for (const r of reviews) {
      const country = userCountries[r.customer_id] === "NZ" ? "NZ" : "AU";
      ratingStats[country].total++;
      ratingStats[country].sum += parseInt(r.rating || "0");
      if (parseInt(r.rating) === 5) ratingStats[country].five_star++;
    }
    for (const c of ["AU", "NZ"] as const) {
      if (ratingStats[c].total > 0) ratingStats[c].avg = Math.round(ratingStats[c].sum / ratingStats[c].total * 10) / 10;
    }

    // Membership stats
    const memberships = await sql`
      SELECT m.user_id, m.status, mp.code as plan_code, mp.price_monthly
      FROM memberships m JOIN membership_plans mp ON m.plan_id = mp.id
    `.catch(() => []);
    const memberStats = { AU: { total: 0, active: 0, mrr: 0 }, NZ: { total: 0, active: 0, mrr: 0 } };
    for (const m of memberships) {
      const country = userCountries[m.user_id] === "NZ" ? "NZ" : "AU";
      memberStats[country].total++;
      if (m.status === "active") {
        memberStats[country].active++;
        memberStats[country].mrr += parseFloat(m.price_monthly || "0");
      }
    }

    // Monthly trend (last 6 months)
    const monthlyBookings = await sql`
      SELECT TO_CHAR(scheduled_at, 'YYYY-MM') as month, currency, COUNT(*) as count, SUM(COALESCE(total_price, 0)) as revenue
      FROM bookings WHERE scheduled_at > NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(scheduled_at, 'YYYY-MM'), currency ORDER BY month
    `.catch(() => []);

    await sql.end();
    return NextResponse.json({
      success: true,
      summary: {
        totalProviders: providerStats.AU.total + providerStats.NZ.total,
        totalBookings: bookingStats.AU.total + bookingStats.NZ.total,
        totalRevenue: Math.round((bookingStats.AU.revenue + bookingStats.NZ.revenue) * 100) / 100,
        nzShare: bookingStats.NZ.total > 0 ? Math.round(bookingStats.NZ.total / (bookingStats.AU.total + bookingStats.NZ.total) * 100) : 0,
      },
      providers: providerStats,
      bookings: bookingStats,
      ratings: ratingStats,
      memberships: memberStats,
      monthlyTrend: monthlyBookings,
      taxComparison: {
        AU: { rate: "10%", name: "GST", collected: Math.round(bookingStats.AU.taxCollected * 100) / 100 },
        NZ: { rate: "15%", name: "GST", collected: Math.round(bookingStats.NZ.taxCollected * 100) / 100 },
      },
    });
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}
