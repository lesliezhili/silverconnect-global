import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("orgId");
  return NextResponse.json({
    organizationId: orgId,
    utilization: { rate: 0, bookedHours: 0, availableHours: 0 },
    compliance: { rate: 0, fullyCompliant: 0, total: 0 },
    financial: { revenue: 0, costs: 0, margin: 0 },
    performance: { avgRating: 0, punctualityRate: 0, completionRate: 0 },
  });
}
