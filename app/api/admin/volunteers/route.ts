import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/volunteers — Full volunteer management dashboard data
 * Query params: ?status=pending|approved|rejected&type=faith|all
 */
export async function GET(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || null;
    const typeFilter = searchParams.get("type") || "faith";

    // Stats overview
    const [stats] = await sql`SELECT
      COUNT(*) FILTER (WHERE onboarding_status = 'pending') as pending,
      COUNT(*) FILTER (WHERE onboarding_status = 'docs_review') as docs_review,
      COUNT(*) FILTER (WHERE onboarding_status = 'approved') as approved,
      COUNT(*) FILTER (WHERE onboarding_status = 'rejected') as rejected,
      COUNT(*) as total
      FROM provider_profiles
      WHERE notes LIKE '%faith_volunteer%'`;

    // Document stats
    let docStats = { pending: 0, approved: 0, rejected: 0 };
    try {
      const [ds] = await sql`SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected
        FROM provider_documents pd
        JOIN provider_profiles pp ON pp.id = pd.provider_id
        WHERE pp.notes LIKE '%faith_volunteer%'`;
      docStats = ds as typeof docStats;
    } catch {}

    // Booking stats (faith services)
    let bookingStats = { total: 0, confirmed: 0, completed: 0, thisWeek: 0 };
    try {
      const [bs] = await sql`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE b.status = 'confirmed') as confirmed,
        COUNT(*) FILTER (WHERE b.status = 'completed') as completed,
        COUNT(*) FILTER (WHERE b.scheduled_at >= NOW() AND b.scheduled_at <= NOW() + INTERVAL '7 days') as this_week
        FROM bookings b
        JOIN services s ON s.id = b.service_id
        WHERE s.category_code = 'faith'`;
      bookingStats = { total: Number(bs.total), confirmed: Number(bs.confirmed), completed: Number(bs.completed), thisWeek: Number(bs.this_week) };
    } catch {}

    // Volunteer list with details
    let whereClause = "pp.notes LIKE '%faith_volunteer%'";
    if (statusFilter) whereClause += ` AND pp.onboarding_status = '${statusFilter}'`;

    const volunteers = await sql.unsafe(`
      SELECT pp.id as profile_id, pp.user_id, pp.bio, pp.onboarding_status, pp.notes,
             pp.created_at, pp.approved_at,
             u.name, u.email, u.phone,
             (SELECT COUNT(*) FROM bookings b JOIN services s ON s.id = b.service_id WHERE b.provider_id = pp.id AND s.category_code = 'faith') as total_bookings,
             (SELECT COUNT(*) FROM bookings b JOIN services s ON s.id = b.service_id WHERE b.provider_id = pp.id AND s.category_code = 'faith' AND b.status = 'completed') as completed_bookings,
             (SELECT AVG(r.rating) FROM reviews r WHERE r.provider_id = pp.id) as avg_rating
      FROM provider_profiles pp
      JOIN users u ON u.id = pp.user_id
      WHERE ${whereClause}
      ORDER BY pp.created_at DESC`);

    // Documents per volunteer
    let docsByProvider: Record<string, unknown>[] = [];
    try {
      docsByProvider = await sql`
        SELECT pd.provider_id, pd.type, pd.status, pd.expires_at
        FROM provider_documents pd
        JOIN provider_profiles pp ON pp.id = pd.provider_id
        WHERE pp.notes LIKE '%faith_volunteer%'`;
    } catch {}

    await sql.end();

    // Build response
    const volunteerList = volunteers.map((v: Record<string, unknown>) => {
      let faithDetails = null;
      try { faithDetails = JSON.parse(v.notes as string); } catch {}
      const docs = docsByProvider.filter((d: Record<string, unknown>) => d.provider_id === v.profile_id);
      return {
        profileId: v.profile_id, userId: v.user_id,
        name: v.name, email: v.email, phone: v.phone,
        status: v.onboarding_status, bio: v.bio,
        registeredAt: v.created_at, approvedAt: v.approved_at,
        church: faithDetails?.churchName || null,
        denomination: faithDetails?.denomination || null,
        pastorReference: faithDetails?.pastorReference || null,
        servicesOffered: faithDetails?.servicesOffered || [],
        availability: faithDetails?.availability || [],
        ministryExperience: faithDetails?.ministryExperience || null,
        totalBookings: Number(v.total_bookings || 0),
        completedBookings: Number(v.completed_bookings || 0),
        avgRating: v.avg_rating ? Number(Number(v.avg_rating).toFixed(1)) : null,
        documents: docs.map((d: Record<string, unknown>) => ({ type: d.type, status: d.status, expires: d.expires_at })),
      };
    });

    return NextResponse.json({
      success: true,
      overview: {
        volunteers: stats,
        documents: docStats,
        bookings: bookingStats,
      },
      volunteers: volunteerList,
      filters: { status: statusFilter, type: typeFilter },
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
