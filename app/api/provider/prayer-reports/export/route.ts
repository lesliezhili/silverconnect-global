import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * GET /api/provider/prayer-reports/export
 * Generates a styled HTML document (printable as PDF via browser print).
 * Query: ?id=reportId (single report) | default (all reports)
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

    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("id");

    const [user] = await sql`SELECT name, email FROM users WHERE id = ${session.userId}`;
    const volunteerName = (user?.name as string) || (user?.email as string) || "Volunteer";

    let reports;
    if (reportId) {
      reports = await sql`
        SELECT fpr.*, u.name as customer_name, s.code as service_code, b.scheduled_at
        FROM faith_prayer_reports fpr
        LEFT JOIN users u ON u.id = fpr.customer_id
        LEFT JOIN bookings b ON b.id = fpr.booking_id
        LEFT JOIN services s ON s.id = b.service_id
        WHERE fpr.id = ${reportId} AND fpr.volunteer_id = ${session.userId}`;
    } else {
      reports = await sql`
        SELECT fpr.*, u.name as customer_name, s.code as service_code, b.scheduled_at
        FROM faith_prayer_reports fpr
        LEFT JOIN users u ON u.id = fpr.customer_id
        LEFT JOIN bookings b ON b.id = fpr.booking_id
        LEFT JOIN services s ON s.id = b.service_id
        WHERE fpr.volunteer_id = ${session.userId}
        ORDER BY fpr.created_at DESC LIMIT 50`;
    }

    const [stats] = await sql`SELECT COUNT(*) as total, SUM(attendees) as attended,
      COUNT(DISTINCT customer_id) as seniors, COUNT(*) FILTER (WHERE follow_up_needed) as followups
      FROM faith_prayer_reports WHERE volunteer_id = ${session.userId}`;

    await sql.end();

    const moodEmoji: Record<string, string> = { joyful: "\ud83d\ude0a", peaceful: "\u262e\ufe0f", struggling: "\ud83d\ude1f", grieving: "\ud83d\ude22" };

    const reportCards = reports.map((r: Record<string, unknown>) => {
      const topics = (r.prayer_topics as string[])?.join(", ") || "\u2014";
      const mood = r.mood ? (moodEmoji[r.mood as string] || "") + " " + r.mood : "\u2014";
      const date = r.created_at ? new Date(r.created_at as string).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "\u2014";
      return `<div class="report-card">
        <div class="rh"><div><strong>${(r.customer_name as string) || "Senior"}</strong> <span class="svc">${((r.service_code as string) || "faith service").replace(/_/g, " ")}</span></div><div class="dt">${date}</div></div>
        <div class="rb">
          <div class="f"><label>Summary</label><p>${r.summary}</p></div>
          ${r.scripture_shared ? `<div class="f sc"><label>Scripture</label><p>${r.scripture_shared}</p></div>` : ""}
          <div class="f"><label>Prayer Topics</label><p>${topics}</p></div>
          <div class="mr"><span>Mood: ${mood}</span><span>Attendees: ${r.attendees || 1}</span>${r.follow_up_needed ? `<span class="fu">\u26a0\ufe0f Follow-up</span>` : ""}</div>
          ${r.follow_up_notes ? `<div class="f fn"><label>Follow-up Notes</label><p>${r.follow_up_notes}</p></div>` : ""}
          ${r.private_prayer_note ? `<div class="f pn"><label>\ud83d\udd12 Private Prayer Note</label><p>${r.private_prayer_note}</p></div>` : ""}
        </div></div>`;
    }).join("\n");

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Prayer Reports \u2014 ${volunteerName}</title>
<style>
@media print{body{margin:0}.no-print{display:none}.report-card{break-inside:avoid}}
*{box-sizing:border-box}body{font-family:Georgia,'Times New Roman',serif;max-width:800px;margin:0 auto;padding:32px;color:#1f2937;line-height:1.6}
.hdr{text-align:center;margin-bottom:32px;border-bottom:2px solid #7c3aed;padding-bottom:24px}
.hdr h1{font-size:28px;color:#7c3aed;margin:0 0 8px}.hdr .sub{color:#6b7280;font-size:16px}.hdr .cross{font-size:32px;margin-bottom:8px}
.stats{display:flex;justify-content:center;gap:32px;margin-bottom:32px}.stat{text-align:center}
.stat .n{font-size:28px;font-weight:bold;color:#7c3aed}.stat .l{font-size:12px;color:#6b7280;text-transform:uppercase}
.report-card{border:1px solid #e5e7eb;border-radius:12px;margin-bottom:20px;overflow:hidden}
.rh{display:flex;justify-content:space-between;align-items:center;background:#faf5ff;padding:12px 16px;border-bottom:1px solid #e5e7eb}
.rh strong{font-size:16px}.rh .svc{margin-left:8px;color:#7c3aed;font-size:14px}.rh .dt{color:#6b7280;font-size:14px}
.rb{padding:16px}.f{margin-bottom:12px}.f label{font-size:12px;font-weight:bold;color:#7c3aed;text-transform:uppercase;display:block;margin-bottom:4px}.f p{margin:0;font-size:15px}
.f.sc{background:#eff6ff;padding:10px 12px;border-radius:8px}.f.sc p{color:#1e40af;font-style:italic}
.f.pn{background:#f9fafb;padding:10px 12px;border-radius:8px;border:1px dashed #d1d5db}
.f.fn{background:#fffbeb;padding:10px 12px;border-radius:8px}
.mr{display:flex;gap:16px;font-size:14px;color:#6b7280;margin-bottom:12px}.mr .fu{color:#d97706;font-weight:bold}
.ftr{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb}
.ftr .v{font-style:italic;color:#6b7280;font-size:14px}.ftr .r{color:#9ca3af;font-size:12px}
.pbtn{position:fixed;bottom:24px;right:24px;background:#7c3aed;color:white;border:none;padding:14px 28px;font-size:16px;font-weight:bold;border-radius:12px;cursor:pointer;box-shadow:0 4px 12px rgba(124,58,237,0.3)}
.pbtn:hover{background:#6d28d9}
</style></head><body>
<div class="hdr"><div class="cross">\u271d</div><h1>Prayer Report Summary</h1>
<div class="sub">${volunteerName} \u2022 SilverConnect Faith Ministry</div>
<div class="sub">Generated ${new Date().toLocaleDateString("en-AU",{day:"numeric",month:"long",year:"numeric"})}</div></div>
<div class="stats"><div class="stat"><div class="n">${stats.total||0}</div><div class="l">Reports</div></div>
<div class="stat"><div class="n">${stats.attended||0}</div><div class="l">Attended</div></div>
<div class="stat"><div class="n">${stats.seniors||0}</div><div class="l">Seniors</div></div>
<div class="stat"><div class="n">${stats.followups||0}</div><div class="l">Follow-ups</div></div></div>
${reportCards}
<div class="ftr"><p class="v">&ldquo;Whatever you did for one of the least of these, you did for me.&rdquo;</p><p class="r">&mdash; Matthew 25:40</p></div>
<button class="pbtn no-print" onclick="window.print()">\ud83d\udda8\ufe0f Print / Save PDF</button>
</body></html>`;

    return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
