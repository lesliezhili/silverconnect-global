import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/volunteer-management — Full volunteer list with stats
 * POST /api/admin/volunteer-management — Bulk actions (approve, suspend, message, assign)
 */
export async function GET(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const sort = searchParams.get("sort") || "recent";

    let statusFilter = sql`1=1`;
    if (status === "approved") statusFilter = sql`pp.onboarding_status = 'approved'`;
    else if (status === "pending") statusFilter = sql`pp.onboarding_status = 'pending'`;
    else if (status === "suspended") statusFilter = sql`pp.onboarding_status = 'suspended'`;

    const volunteers = await sql`
      SELECT pp.id as provider_id, pp.user_id, pp.onboarding_status, pp.notes, pp.approved_at, pp.created_at,
        u.name, u.email, u.phone,
        (SELECT COUNT(*) FROM bookings b WHERE b.provider_id = pp.id AND b.status IN ('completed','released')) as completed_visits,
        (SELECT COUNT(*) FROM faith_prayer_reports fpr WHERE fpr.volunteer_id = pp.user_id) as report_count,
        (SELECT COUNT(*) FROM reviews r WHERE r.provider_id = pp.id AND r.rating = 5) as five_stars,
        (SELECT AVG(r.rating) FROM reviews r WHERE r.provider_id = pp.id) as avg_rating,
        (SELECT COUNT(DISTINCT b.customer_id) FROM bookings b WHERE b.provider_id = pp.id AND b.status IN ('completed','released')) as seniors_served
      FROM provider_profiles pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.notes LIKE '%faith_volunteer%' AND ${statusFilter}
      ORDER BY ${sort === "visits" ? sql`completed_visits DESC` : sort === "rating" ? sql`avg_rating DESC NULLS LAST` : sql`pp.created_at DESC`}`;

    // Overall stats
    const [stats] = await sql`SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE pp.onboarding_status = 'approved') as active,
      COUNT(*) FILTER (WHERE pp.onboarding_status = 'pending') as pending,
      COUNT(*) FILTER (WHERE pp.onboarding_status = 'suspended') as suspended
      FROM provider_profiles pp WHERE pp.notes LIKE '%faith_volunteer%'`;

    await sql.end();
    return NextResponse.json({
      success: true,
      stats: { total: Number(stats.total||0), active: Number(stats.active||0), pending: Number(stats.pending||0), suspended: Number(stats.suspended||0) },
      volunteers: volunteers.map((v: Record<string, unknown>) => {
        let churchName = "";
        try { const n = JSON.parse(v.notes as string || "{}"); churchName = n.churchName || ""; } catch {}
        return {
          providerId: v.provider_id, userId: v.user_id, name: v.name, email: v.email, phone: v.phone,
          status: v.onboarding_status, churchName, approvedAt: v.approved_at, createdAt: v.created_at,
          completedVisits: Number(v.completed_visits || 0), reportCount: Number(v.report_count || 0),
          fiveStars: Number(v.five_stars || 0), avgRating: v.avg_rating ? Math.round(Number(v.avg_rating) * 10) / 10 : null,
          seniorsServed: Number(v.seniors_served || 0),
        };
      }),
    });
  } catch (e: unknown) { await sql.end(); return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const body = await req.json();
    const { action, providerIds, message } = body;
    if (!action || !providerIds || !Array.isArray(providerIds) || providerIds.length === 0) {
      await sql.end(); return NextResponse.json({ error: "action and providerIds required" }, { status: 400 });
    }

    let affected = 0;

    switch (action) {
      case "approve":
        for (const pid of providerIds) {
          await sql`UPDATE provider_profiles SET onboarding_status = 'approved', approved_at = NOW() WHERE id = ${pid}`;
          affected++;
        }
        break;

      case "suspend":
        for (const pid of providerIds) {
          await sql`UPDATE provider_profiles SET onboarding_status = 'suspended' WHERE id = ${pid}`;
          affected++;
        }
        break;

      case "reactivate":
        for (const pid of providerIds) {
          await sql`UPDATE provider_profiles SET onboarding_status = 'approved' WHERE id = ${pid}`;
          affected++;
        }
        break;

      case "message":
        if (!message) { await sql.end(); return NextResponse.json({ error: "message required" }, { status: 400 }); }
        for (const pid of providerIds) {
          const [pp] = await sql`SELECT user_id FROM provider_profiles WHERE id = ${pid}`;
          if (pp) {
            await sql`INSERT INTO notifications (user_id, kind, title, body)
              VALUES (${pp.user_id}, 'system', 'Admin Message', ${message})`;
            affected++;
          }
        }
        break;

      case "assign_badge":
        // Create achievement for selected volunteers
        await sql`CREATE TABLE IF NOT EXISTS volunteer_achievements (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL,
          achievement_id TEXT NOT NULL, unlocked_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, achievement_id))`;
        const badgeId = body.badgeId || "admin_recognition";
        for (const pid of providerIds) {
          const [pp] = await sql`SELECT user_id FROM provider_profiles WHERE id = ${pid}`;
          if (pp) {
            await sql`INSERT INTO volunteer_achievements (user_id, achievement_id) VALUES (${pp.user_id}, ${badgeId}) ON CONFLICT DO NOTHING`;
            affected++;
          }
        }
        break;

      default:
        await sql.end(); return NextResponse.json({ error: "Unknown action: " + action }, { status: 400 });
    }

    await sql.end();
    return NextResponse.json({ success: true, action, affected });
  } catch (e: unknown) { await sql.end(); return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
