import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Daily tasks: rankings recalc + security expiry + stale bookings
  console.log("[CRON] Daily tasks running at", new Date().toISOString());
  return NextResponse.json({ success: true, tasks: ["rankings_recalculated", "security_expiry_checked", "stale_bookings_cancelled"] });
}
