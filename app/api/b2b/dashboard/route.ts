import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    alerts: [],
    metrics: { activeProviders: 0, bookingsToday: 0, pendingClaims: 0, complianceRate: 0 },
    weeklyHours: { scheduled: 0, completed: 0, cancelled: 0 },
  });
}
