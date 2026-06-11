import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

const ACHIEVEMENTS = [
  { id: "first_visit", name: "First Steps", nameZh: "\u7b2c\u4e00\u6b65", icon: "\ud83d\udc63", desc: "Complete your first visit", descZh: "\u5b8c\u6210\u7b2c\u4e00\u6b21\u63a2\u8bbf", threshold: 1, metric: "visits" },
  { id: "five_visits", name: "Faithful Five", nameZh: "\u4e94\u6b21\u5fe0\u5fc3", icon: "\u2b50", desc: "Complete 5 visits", descZh: "\u5b8c\u6210 5 \u6b21\u63a2\u8bbf", threshold: 5, metric: "visits" },
  { id: "ten_visits", name: "Dedicated Servant", nameZh: "\u5341\u6b21\u5949\u732e", icon: "\ud83c\udf1f", desc: "Complete 10 visits", descZh: "\u5b8c\u6210 10 \u6b21\u63a2\u8bbf", threshold: 10, metric: "visits" },
  { id: "twentyfive_visits", name: "Silver Shepherd", nameZh: "\u94f6\u8272\u7267\u4eba", icon: "\ud83d\udee1\ufe0f", desc: "Complete 25 visits", descZh: "\u5b8c\u6210 25 \u6b21\u63a2\u8bbf", threshold: 25, metric: "visits" },
  { id: "fifty_visits", name: "Golden Guardian", nameZh: "\u91d1\u8272\u5b88\u62a4", icon: "\ud83d\udc51", desc: "Complete 50 visits", descZh: "\u5b8c\u6210 50 \u6b21\u63a2\u8bbf", threshold: 50, metric: "visits" },
  { id: "first_report", name: "Prayer Warrior", nameZh: "\u7977\u544a\u52c7\u58eb", icon: "\ud83d\ude4f", desc: "Submit your first prayer report", descZh: "\u63d0\u4ea4\u7b2c\u4e00\u4efd\u7977\u544a\u62a5\u544a", threshold: 1, metric: "reports" },
  { id: "ten_reports", name: "Report Master", nameZh: "\u62a5\u544a\u5927\u5e08", icon: "\ud83d\udcdd", desc: "Submit 10 prayer reports", descZh: "\u63d0\u4ea4 10 \u4efd\u7977\u544a\u62a5\u544a", threshold: 10, metric: "reports" },
  { id: "first_fivestar", name: "Joy Bringer", nameZh: "\u5e26\u6765\u559c\u4e50", icon: "\ud83c\udf08", desc: "Receive your first 5-star review", descZh: "\u83b7\u5f97\u7b2c\u4e00\u4e2a\u4e94\u661f\u8bc4\u4ef7", threshold: 1, metric: "fiveStars" },
  { id: "ten_fivestars", name: "Beloved Helper", nameZh: "\u53d7\u7231\u52a9\u624b", icon: "\u2764\ufe0f", desc: "Receive 10 five-star reviews", descZh: "\u83b7\u5f97 10 \u4e2a\u4e94\u661f\u8bc4\u4ef7", threshold: 10, metric: "fiveStars" },
  { id: "three_seniors", name: "Community Builder", nameZh: "\u793e\u533a\u5efa\u8bbe\u8005", icon: "\ud83c\udfe1", desc: "Serve 3 different seniors", descZh: "\u670d\u52a1 3 \u4f4d\u4e0d\u540c\u957f\u8005", threshold: 3, metric: "seniors" },
  { id: "first_donation", name: "Blessed Giver", nameZh: "\u84c4\u798f\u4e4b\u4eba", icon: "\ud83c\udf81", desc: "Receive your first donation", descZh: "\u6536\u5230\u7b2c\u4e00\u7b14\u6350\u8d60", threshold: 1, metric: "donations" },
  { id: "week_streak", name: "Consistency Crown", nameZh: "\u575a\u6301\u4e4b\u51a0", icon: "\ud83d\udd25", desc: "Meet weekly goals 4 weeks in a row", descZh: "\u8fde\u7eed 4 \u5468\u5b8c\u6210\u76ee\u6807", threshold: 4, metric: "streak" },
];

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

    // Ensure achievements table
    await sql`CREATE TABLE IF NOT EXISTS volunteer_achievements (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, achievement_id)
    )`;

    const [profile] = await sql`SELECT id FROM provider_profiles WHERE user_id = ${session.userId}`;
    if (!profile) { await sql.end(); return NextResponse.json({ error: "Not a provider" }, { status: 404 }); }

    // Get metrics
    const [vc] = await sql`SELECT COUNT(*) as cnt FROM bookings WHERE provider_id = ${profile.id} AND status IN ('completed','released')`;
    const visits = Number(vc?.cnt || 0);

    const [rc] = await sql`SELECT COUNT(*) as cnt FROM faith_prayer_reports WHERE volunteer_id = ${session.userId}`;
    const reports = Number(rc?.cnt || 0);

    let fiveStars = 0;
    try { const [fs] = await sql`SELECT COUNT(*) as cnt FROM reviews WHERE provider_id = ${profile.id} AND rating = 5`; fiveStars = Number(fs?.cnt || 0); } catch {}

    const [sc] = await sql`SELECT COUNT(DISTINCT customer_id) as cnt FROM bookings WHERE provider_id = ${profile.id} AND status IN ('completed','released')`;
    const seniors = Number(sc?.cnt || 0);

    let donations = 0;
    try { const [dc] = await sql`SELECT COUNT(*) as cnt FROM faith_donations WHERE recipient_provider_id = ${profile.id}`; donations = Number(dc?.cnt || 0); } catch {}

    let streak = 0;
    try {
      const [sk] = await sql`SELECT COUNT(*) as cnt FROM volunteer_weekly_goals WHERE user_id = ${session.userId}`;
      streak = Number(sk?.cnt || 0);
    } catch {}

    const metrics: Record<string, number> = { visits, reports, fiveStars, seniors, donations, streak };

    // Check and unlock achievements
    const existing = await sql`SELECT achievement_id, unlocked_at FROM volunteer_achievements WHERE user_id = ${session.userId}`;
    const unlockedMap: Record<string, string> = {};
    for (const e of existing) unlockedMap[e.achievement_id as string] = e.unlocked_at as string;

    const newlyUnlocked: string[] = [];
    for (const a of ACHIEVEMENTS) {
      if (!unlockedMap[a.id] && metrics[a.metric] >= a.threshold) {
        await sql`INSERT INTO volunteer_achievements (user_id, achievement_id) VALUES (${session.userId}, ${a.id}) ON CONFLICT DO NOTHING`;
        unlockedMap[a.id] = new Date().toISOString();
        newlyUnlocked.push(a.id);
      }
    }

    // Push notification for new achievements
    if (newlyUnlocked.length > 0) {
      try {
        const subs = await sql`SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ${session.userId}`;
        if (subs.length > 0) {
          const names = ACHIEVEMENTS.filter(a => newlyUnlocked.includes(a.id)).map(a => a.icon + " " + a.name).join(", ");
          const payload = JSON.stringify({ title: "\ud83c\udfc5 Achievement Unlocked!", body: names, icon: "/icon-192.png", url: "/en/provider/achievements", tag: "achievement-" + newlyUnlocked[0] });
          const vapidPub = process.env.VAPID_PUBLIC_KEY;
          const vapidPri = process.env.VAPID_PRIVATE_KEY;
          if (vapidPub && vapidPri) {
            const webpush = await import("web-push");
            webpush.setVapidDetails("mailto:hello@silverconnect.app", vapidPub, vapidPri);
            for (const sub of subs) {
              try { await webpush.sendNotification({ endpoint: sub.endpoint as string, keys: { p256dh: sub.p256dh as string, auth: sub.auth as string } }, payload); } catch {}
            }
          }
        }
      } catch {}
    }

    await sql.end();
    return NextResponse.json({
      success: true,
      metrics,
      totalUnlocked: Object.keys(unlockedMap).length,
      totalAchievements: ACHIEVEMENTS.length,
      newlyUnlocked,
      achievements: ACHIEVEMENTS.map(a => ({
        ...a,
        unlocked: !!unlockedMap[a.id],
        unlockedAt: unlockedMap[a.id] || null,
        progress: Math.min(metrics[a.metric], a.threshold),
      })),
    });
  } catch (e: unknown) { await sql.end(); return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
