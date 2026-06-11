import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/weekly-ministry-summary
 * Sends a weekly ministry summary email to all active faith volunteers.
 * Call via external cron (every Monday 8am AEST).
 * Protected by CRON_SECRET header.
 */
export async function POST(req: NextRequest) {
  // Auth
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== "Bearer " + secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    // Get all active faith volunteers
    const volunteers = await sql`
      SELECT pp.id as provider_id, pp.user_id, pp.notes, u.name, u.email
      FROM provider_profiles pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.onboarding_status = 'approved' AND pp.notes LIKE '%faith_volunteer%'`;

    if (volunteers.length === 0) {
      await sql.end();
      return NextResponse.json({ success: true, sent: 0, reason: "No active faith volunteers" });
    }

    // For each volunteer, calculate their weekly stats
    const summaries: { email: string; name: string; stats: Record<string, unknown> }[] = [];

    for (const vol of volunteers) {
      // Bookings completed this week
      const [weekStats] = await sql`SELECT
        COUNT(*) FILTER (WHERE status IN ('completed', 'released')) as completed,
        COUNT(*) FILTER (WHERE status = 'confirmed') as upcoming
        FROM bookings
        WHERE provider_id = ${vol.provider_id}
          AND (completed_at >= NOW() - INTERVAL '7 days' OR (scheduled_at >= NOW() AND scheduled_at <= NOW() + INTERVAL '7 days'))`;

      // Donations this week
      let weekDonations = 0;
      try {
        const [d] = await sql`SELECT COALESCE(SUM(amount), 0) as total
          FROM faith_donations WHERE recipient_provider_id = ${vol.provider_id} AND created_at >= NOW() - INTERVAL '7 days'`;
        weekDonations = Number(d?.total || 0);
      } catch {}

      // Prayer reports this week
      let prayerCount = 0;
      try {
        const [p] = await sql`SELECT COUNT(*) as total FROM faith_prayer_reports WHERE volunteer_id = ${vol.user_id} AND created_at >= NOW() - INTERVAL '7 days'`;
        prayerCount = Number(p?.total || 0);
      } catch {}

      // Thank-you messages this week
      let thankYous: string[] = [];
      try {
        const msgs = await sql`SELECT message FROM faith_donations WHERE recipient_provider_id = ${vol.provider_id} AND message IS NOT NULL AND created_at >= NOW() - INTERVAL '7 days' LIMIT 3`;
        thankYous = msgs.map((m: Record<string, unknown>) => m.message as string);
      } catch {}

      summaries.push({
        email: vol.email as string,
        name: vol.name as string || "Volunteer",
        stats: {
          completed: Number(weekStats?.completed || 0),
          upcoming: Number(weekStats?.upcoming || 0),
          donations: weekDonations,
          prayerReports: prayerCount,
          thankYous,
        },
      });
    }

    // Send emails (or log if SMTP not configured)
    let sent = 0;
    const smtpUser = process.env.SMTP_USER;

    for (const summary of summaries) {
      const s = summary.stats as { completed: number; upcoming: number; donations: number; prayerReports: number; thankYous: string[] };
      const hasActivity = s.completed > 0 || s.upcoming > 0 || s.donations > 0;

      // Build email body
      const html = buildMinistryEmail(summary.name, s);

      if (smtpUser) {
        try {
          const nodemailer = (await import("nodemailer")).default;
          const transport = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.ethereal.email",
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === "true",
            auth: { user: smtpUser, pass: process.env.SMTP_PASS },
          });
          await transport.sendMail({
            from: process.env.EMAIL_FROM || "SilverConnect <hello@silverconnect.app>",
            to: summary.email,
            subject: hasActivity ? "Your Ministry This Week \u2764\ufe0f" : "Weekly Update from SilverConnect \u271D",
            html,
          });
          sent++;
        } catch (emailErr) {
          console.error("Email failed for " + summary.email, emailErr);
        }
      } else {
        // Log instead of sending
        console.log("[weekly-summary] Would send to:", summary.email, JSON.stringify(s));
        sent++;
      }
    }

    await sql.end();
    return NextResponse.json({
      success: true,
      volunteersProcessed: summaries.length,
      emailsSent: sent,
      smtpConfigured: !!smtpUser,
      preview: summaries.slice(0, 2).map(s => ({ name: s.name, ...s.stats })),
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

function buildMinistryEmail(name: string, stats: { completed: number; upcoming: number; donations: number; prayerReports: number; thankYous: string[] }) {
  const thankSection = stats.thankYous.length > 0
    ? stats.thankYous.map(t => '<p style="font-style:italic;color:#555;margin:8px 0;">&ldquo;' + t + '&rdquo;</p>').join("")
    : '<p style="color:#888;">No messages this week. Keep serving!</p>';

  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:36px;">\u271D</span>
      <h1 style="color:#065f46;font-size:24px;margin:8px 0;">Your Ministry This Week</h1>
      <p style="color:#6b7280;font-size:16px;">Hello ${name}, here is your weekly summary</p>
    </div>
    <div style="background:white;border-radius:16px;padding:24px;border:1px solid #e5e7eb;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:12px;text-align:center;background:#ecfdf5;border-radius:8px;">
            <div style="font-size:28px;font-weight:bold;color:#065f46;">${stats.completed}</div>
            <div style="font-size:14px;color:#047857;">Visits Completed</div>
          </td>
          <td style="width:12px;"></td>
          <td style="padding:12px;text-align:center;background:#eff6ff;border-radius:8px;">
            <div style="font-size:28px;font-weight:bold;color:#1e40af;">${stats.upcoming}</div>
            <div style="font-size:14px;color:#1d4ed8;">Upcoming</div>
          </td>
        </tr>
        <tr><td colspan="3" style="height:12px;"></td></tr>
        <tr>
          <td style="padding:12px;text-align:center;background:#faf5ff;border-radius:8px;">
            <div style="font-size:28px;font-weight:bold;color:#7c3aed;">${stats.prayerReports}</div>
            <div style="font-size:14px;color:#6d28d9;">Prayer Reports</div>
          </td>
          <td style="width:12px;"></td>
          <td style="padding:12px;text-align:center;background:#fffbeb;border-radius:8px;">
            <div style="font-size:28px;font-weight:bold;color:#b45309;">$${stats.donations.toFixed(0)}</div>
            <div style="font-size:14px;color:#d97706;">Donations</div>
          </td>
        </tr>
      </table>
    </div>
    <div style="margin-top:24px;background:white;border-radius:16px;padding:20px;border:1px solid #e5e7eb;">
      <h3 style="color:#374151;margin:0 0 12px;">\ud83d\ude4f Words from Seniors</h3>
      ${thankSection}
    </div>
    <div style="margin-top:24px;text-align:center;padding:16px;background:#ecfdf5;border-radius:12px;">
      <p style="font-style:italic;color:#065f46;font-size:16px;margin:0;">&ldquo;Whatever you did for one of the least of these, you did for me.&rdquo;</p>
      <p style="color:#047857;font-size:14px;margin:4px 0 0;">&mdash; Matthew 25:40</p>
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">SilverConnect Global &bull; Faith Service Ministry</p>
  </body></html>`;
}
