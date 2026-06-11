import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/approve-faith-volunteer
 * Body: { profileId: string, action: "approve" | "reject", reason?: string }
 * Admin approves or rejects a faith volunteer application.
 */
export async function POST(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { profileId, action, reason } = await req.json();
    if (!profileId || !action) return NextResponse.json({ error: "profileId and action required" }, { status: 400 });
    if (!["approve", "reject"].includes(action)) return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });

    // Get profile
    const [profile] = await sql`SELECT id, user_id, onboarding_status, notes FROM provider_profiles WHERE id = ${profileId}`;
    if (!profile) { await sql.end(); return NextResponse.json({ error: "Profile not found" }, { status: 404 }); }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update status
    await sql`UPDATE provider_profiles SET onboarding_status = ${newStatus}, approved_at = NOW() WHERE id = ${profileId}`;

    // Notify volunteer
    const title = action === "approve"
      ? "You're Approved! Start Serving"
      : "Application Update";
    const body = action === "approve"
      ? "Congratulations! Your faith volunteer application has been approved. You can now accept service requests from seniors in your area. God bless your ministry!"
      : "Your application requires additional information: " + (reason || "Please contact us for details.");

    await sql`INSERT INTO notifications (user_id, kind, title, body, link)
      VALUES (${profile.user_id}, 'system', ${title}, ${body}, '/provider')`;

    await sql.end();
    return NextResponse.json({
      success: true,
      profileId,
      action,
      newStatus,
      message: action === "approve"
        ? "Volunteer approved and notified! They can now serve."
        : "Volunteer rejected. Notification sent.",
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

/**
 * GET /api/admin/approve-faith-volunteer
 * Lists pending faith volunteer applications.
 */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    try { await sql`ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS notes TEXT`; } catch {}

    const pending = await sql`
      SELECT pp.id, pp.user_id, pp.bio, pp.onboarding_status, pp.notes, pp.submitted_at,
             u.name, u.email, u.phone
      FROM provider_profiles pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.notes LIKE '%faith_volunteer%'
      ORDER BY pp.created_at DESC`;

    await sql.end();
    return NextResponse.json({
      success: true,
      total: pending.length,
      pending: pending.filter((p: { onboarding_status: string }) => p.onboarding_status === "pending").length,
      volunteers: pending.map((p: Record<string, unknown>) => ({
        profileId: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        status: p.onboarding_status,
        bio: p.bio,
        faithDetails: (() => { try { return JSON.parse(p.notes as string); } catch { return null; } })(),
      })),
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
