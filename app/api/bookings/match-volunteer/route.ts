import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * GET /api/bookings/match-volunteer — Find best volunteer for a senior
 * Query: ?serviceCode=xxx&dayOfWeek=0-6&hour=10&customerId=xxx
 *
 * Scoring factors (weighted):
 *  - Availability match (40pts)
 *  - Service offered (30pts)
 *  - Prior relationship/visits (20pts bonus)
 *  - Rating (10pts max)
 *  - Workload balance (penalty for overloaded)
 *  - Proximity bonus (same language/church preference)
 */
export async function GET(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { searchParams } = new URL(req.url);
    const serviceCode = searchParams.get("serviceCode") || "";
    const dayOfWeek = parseInt(searchParams.get("dayOfWeek") || "1");
    const hour = parseInt(searchParams.get("hour") || "10");
    const customerId = searchParams.get("customerId") || "";

    // Get all approved faith volunteers
    const volunteers = await sql`
      SELECT pp.id as provider_id, pp.user_id, pp.notes, u.name, u.email
      FROM provider_profiles pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.onboarding_status = 'approved' AND pp.notes LIKE '%faith_volunteer%'`;

    if (volunteers.length === 0) {
      await sql.end();
      return NextResponse.json({ success: true, matches: [], message: "No volunteers available" });
    }

    const scored: Array<{
      providerId: string; userId: string; name: string; score: number;
      reasons: string[]; availability: boolean; servicesMatch: boolean;
      priorVisits: number; rating: number; weeklyLoad: number;
    }> = [];

    for (const vol of volunteers) {
      let score = 0;
      const reasons: string[] = [];
      let notesData: Record<string, unknown> = {};
      try { notesData = JSON.parse(vol.notes as string || "{}"); } catch {}

      // 1. Availability check (40pts)
      let availMatch = false;
      try {
        const slots = await sql`SELECT * FROM faith_volunteer_schedule
          WHERE provider_id = ${vol.provider_id} AND day_of_week = ${dayOfWeek}
          AND start_hour <= ${hour} AND end_hour > ${hour} AND is_active = true`;
        if (slots.length > 0) { availMatch = true; score += 40; reasons.push("Available at requested time"); }
      } catch {}

      // 2. Service match (30pts)
      let svcMatch = false;
      const offered = (notesData.servicesOffered as string[]) || [];
      if (serviceCode && offered.includes(serviceCode)) {
        svcMatch = true; score += 30; reasons.push("Offers requested service");
      } else if (!serviceCode) {
        score += 15; // No specific service requested
      }

      // 3. Prior relationship (20pts bonus)
      let priorVisits = 0;
      if (customerId) {
        try {
          const [pv] = await sql`SELECT COUNT(*) as cnt FROM bookings
            WHERE provider_id = ${vol.provider_id} AND customer_id = ${customerId}
            AND status IN ('completed','released')`;
          priorVisits = Number(pv?.cnt || 0);
          if (priorVisits > 0) {
            score += Math.min(20, priorVisits * 5); // 5pts per visit, max 20
            reasons.push("Previous relationship (" + priorVisits + " visits)");
          }
        } catch {}
      }

      // 4. Rating (10pts max)
      let avgRating = 0;
      try {
        const [rv] = await sql`SELECT AVG(rating) as avg FROM reviews WHERE provider_id = ${vol.provider_id}`;
        avgRating = Number(rv?.avg || 0);
        if (avgRating > 0) { score += Math.round(avgRating * 2); reasons.push(avgRating.toFixed(1) + " star rating"); }
      } catch {}

      // 5. Workload balance (-penalty for overloaded)
      let weeklyLoad = 0;
      try {
        const [wl] = await sql`SELECT COUNT(*) as cnt FROM bookings
          WHERE provider_id = ${vol.provider_id} AND status = 'confirmed'
          AND scheduled_at >= DATE_TRUNC('week', NOW()) AND scheduled_at < DATE_TRUNC('week', NOW()) + INTERVAL '7 days'`;
        weeklyLoad = Number(wl?.cnt || 0);
        if (weeklyLoad >= 5) { score -= 10; reasons.push("Heavy load this week"); }
        else if (weeklyLoad === 0) { score += 5; reasons.push("Available capacity"); }
      } catch {}

      // 6. Prayer report engagement bonus
      try {
        const [pr] = await sql`SELECT COUNT(*) as cnt FROM faith_prayer_reports WHERE volunteer_id = ${vol.user_id}`;
        if (Number(pr?.cnt || 0) > 0) { score += 5; reasons.push("Active reporter"); }
      } catch {}

      scored.push({
        providerId: vol.provider_id as string, userId: vol.user_id as string,
        name: (vol.name as string) || (vol.email as string)?.split("@")[0] || "Volunteer",
        score, reasons, availability: availMatch, servicesMatch: svcMatch,
        priorVisits, rating: Math.round(avgRating * 10) / 10, weeklyLoad,
      });
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    await sql.end();
    return NextResponse.json({
      success: true,
      totalCandidates: scored.length,
      matches: scored.slice(0, 5).map((s, i) => ({ ...s, rank: i + 1 })),
    });
  } catch (e: unknown) { await sql.end(); return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
