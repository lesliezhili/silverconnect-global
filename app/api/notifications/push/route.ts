import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * POST /api/notifications/push — Register push subscription OR send push notification
 * Body (register): { action: "register", subscription: PushSubscription }
 * Body (send): { action: "send", userId: string, title: string, body: string, url?: string }
 */
export async function POST(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    // Ensure push_subscriptions table
    await sql`CREATE TABLE IF NOT EXISTS push_subscriptions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_used_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    const body = await req.json();

    if (body.action === "register") {
      // Register push subscription
      const { getIronSession } = await import("iron-session");
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const session = await getIronSession<{ userId?: string }>(cookieStore, getSession());
      if (!session.userId) { await sql.end(); return NextResponse.json({ error: "Not logged in" }, { status: 401 }); }

      const { subscription } = body;
      if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
        await sql.end();
        return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
      }

      await sql`INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
        VALUES (${session.userId}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth})
        ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, last_used_at = NOW()`;

      await sql.end();
      return NextResponse.json({ success: true, message: "Push subscription registered" });
    }

    if (body.action === "send") {
      // Send push notification to a user
      const { userId, title, body: notifBody, url: notifUrl } = body;
      if (!userId || !title) { await sql.end(); return NextResponse.json({ error: "userId and title required" }, { status: 400 }); }

      // Get user's push subscriptions
      const subs = await sql`SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ${userId}`;

      if (subs.length === 0) {
        await sql.end();
        return NextResponse.json({ success: true, sent: 0, reason: "No push subscriptions for user" });
      }

      // Send via web-push (if configured)
      const vapidPublic = process.env.VAPID_PUBLIC_KEY;
      const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

      if (vapidPublic && vapidPrivate) {
        try {
          const webpush = await import("web-push");
          webpush.default.setVapidDetails("mailto:hello@silverconnect.app", vapidPublic, vapidPrivate);

          let sent = 0;
          for (const sub of subs) {
            try {
              await webpush.default.sendNotification(
                { endpoint: sub.endpoint as string, keys: { p256dh: sub.p256dh as string, auth: sub.auth as string } },
                JSON.stringify({ title, body: notifBody, url: notifUrl || "/" })
              );
              sent++;
            } catch (pushErr) {
              // Remove invalid subscriptions
              await sql`DELETE FROM push_subscriptions WHERE endpoint = ${sub.endpoint}`;
            }
          }
          await sql.end();
          return NextResponse.json({ success: true, sent, total: subs.length });
        } catch {
          await sql.end();
          return NextResponse.json({ success: true, sent: 0, reason: "web-push module not available" });
        }
      }

      await sql.end();
      return NextResponse.json({ success: true, sent: 0, reason: "VAPID keys not configured (push disabled)", subscriptions: subs.length });
    }

    await sql.end();
    return NextResponse.json({ error: "Invalid action. Use 'register' or 'send'" }, { status: 400 });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

/**
 * GET /api/notifications/push — Check push subscription status
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

    await sql`CREATE TABLE IF NOT EXISTS push_subscriptions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL,
      endpoint TEXT NOT NULL UNIQUE, p256dh TEXT NOT NULL, auth TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(), last_used_at TIMESTAMPTZ DEFAULT NOW())`;

    const subs = await sql`SELECT id, endpoint, created_at FROM push_subscriptions WHERE user_id = ${session.userId}`;
    await sql.end();

    return NextResponse.json({
      success: true,
      registered: subs.length > 0,
      subscriptions: subs.length,
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null,
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
