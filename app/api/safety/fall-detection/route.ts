import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({
    eventId: `fall_${Date.now()}`,
    status: "detected",
    confidence: body.confidence || 0,
    severity: body.severity || "medium",
    escalation: "user_notified",
    timestamp: new Date().toISOString(),
  });
}
