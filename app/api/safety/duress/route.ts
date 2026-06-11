import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("[DURESS] Emergency activated:", body);
  return NextResponse.json({
    status: "dispatched",
    alertId: `duress_${Date.now()}`,
    notified: ["family", "emergency_contact"],
    location: body.location,
    timestamp: new Date().toISOString(),
  });
}
