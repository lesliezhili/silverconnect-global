import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";

/**
 * GET /api/admin/providers — List all providers with onboarding status
 *   ?status=pending|docs_review|approved|rejected|suspended — filter
 *   ?country=AU|NZ — filter by country
 *
 * PATCH /api/admin/providers — Approve/reject/suspend provider
 *   Body: { providerId, action: "approve"|"reject"|"suspend"|"docs_review", reason? }
 */
export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me || !me.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const country = req.nextUrl.searchParams.get("country");
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    let providers;
    if (status) {
      providers = await sql`
        SELECT pp.id, pp.user_id, pp.onboarding_status, pp.bio, pp.address_line, pp.bsb, pp.account_number, pp.account_name, pp.service_radius_km, pp.notes, pp.submitted_at, pp.approved_at, pp.rejected_at, pp.rejection_reason, pp.created_at, pp.updated_at,
        u.name, u.email
        FROM provider_profiles pp JOIN users u ON pp.user_id = u.id
        WHERE pp.onboarding_status = ${status}
        ORDER BY pp.submitted_at DESC NULLS LAST
      `;
    } else {
      providers = await sql`
        SELECT pp.id, pp.user_id, pp.onboarding_status, pp.bio, pp.address_line, pp.bsb, pp.account_number, pp.account_name, pp.service_radius_km, pp.notes, pp.submitted_at, pp.approved_at, pp.rejected_at, pp.rejection_reason, pp.created_at, pp.updated_at,
        u.name, u.email
        FROM provider_profiles pp JOIN users u ON pp.user_id = u.id
        ORDER BY CASE pp.onboarding_status WHEN 'pending' THEN 1 WHEN 'docs_review' THEN 2 WHEN 'approved' THEN 3 WHEN 'rejected' THEN 4 ELSE 5 END, pp.submitted_at DESC NULLS LAST
      `;
    }

    // Enrich with country data
    const enriched = [];
    for (const p of providers) {
      const [pref] = await sql`SELECT value FROM platform_settings WHERE key = ${'user_country_' + p.user_id}`.catch(() => []);
      const countryData = pref ? JSON.parse(pref.value) : { country: "AU" };
      if (country && countryData.country !== country) continue;
      const docs = await sql`SELECT * FROM provider_documents WHERE provider_id = ${p.id}`.catch(() => []);
      const [rating] = await sql`SELECT AVG(rating)::numeric(3,2) as avg, COUNT(*) as count FROM reviews WHERE provider_id = ${p.id}`.catch(() => [{ avg: null, count: 0 }]);
      const [bookingCount] = await sql`SELECT COUNT(*) as count FROM bookings WHERE provider_id = ${p.id} AND status = 'completed'`.catch(() => [{ count: 0 }]);
      enriched.push({
        ...p,
        country: countryData.country,
        region: countryData.region,
        documents: docs,
        documentsCount: docs.length,
        avgRating: rating?.avg ? parseFloat(rating.avg) : null,
        reviewCount: parseInt(rating?.count) || 0,
        completedBookings: parseInt(bookingCount?.count) || 0,
      });
    }

    // Summary stats
    const allProviders = await sql`SELECT onboarding_status, COUNT(*) as count FROM provider_profiles GROUP BY onboarding_status`;
    const stats: Record<string, number> = {};
    for (const s of allProviders) stats[s.onboarding_status] = parseInt(s.count);

    await sql.end();
    return NextResponse.json({ success: true, providers: enriched, total: enriched.length, stats });
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}

export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me || !me.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { providerId, action, reason } = await req.json();
  if (!providerId || !action) return NextResponse.json({ error: "providerId, action required" }, { status: 400 });
  if (!["approve", "reject", "suspend", "docs_review"].includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const statusMap: Record<string, string> = { approve: "approved", reject: "rejected", suspend: "suspended", docs_review: "docs_review" };
  const newStatus = statusMap[action];

  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    if (action === "approve") {
      await sql`UPDATE provider_profiles SET onboarding_status = 'approved', approved_at = NOW(), updated_at = NOW() WHERE id = ${providerId}`;
    } else if (action === "reject") {
      await sql`UPDATE provider_profiles SET onboarding_status = 'rejected', rejected_at = NOW(), rejection_reason = ${reason || 'Rejected by admin'}, updated_at = NOW() WHERE id = ${providerId}`;
    } else {
      await sql`UPDATE provider_profiles SET onboarding_status = ${newStatus}, updated_at = NOW() WHERE id = ${providerId}`;
    }

    // Notify provider
    const [profile] = await sql`SELECT user_id FROM provider_profiles WHERE id = ${providerId}`;
    if (profile) {
      const titles: Record<string, string> = { approve: "Application Approved!", reject: "Application Not Approved", suspend: "Account Suspended", docs_review: "Documents Under Review" };
      const bodies: Record<string, string> = { approve: "Congratulations! You can now accept bookings.", reject: reason || "Please contact support for details.", suspend: "Your account has been temporarily suspended.", docs_review: "We are reviewing your submitted documents." };
      await sql`INSERT INTO notifications (user_id, kind, title, body) VALUES (${profile.user_id}, 'system', ${titles[action]}, ${bodies[action]})`.catch(() => {});
    }

    await sql.end();
    return NextResponse.json({ success: true, providerId, action, newStatus });
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}
