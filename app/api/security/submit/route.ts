import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({
    checkId: `check_${Date.now()}`,
    providerId: body.providerId,
    checkType: body.checkType,
    status: "submitted",
    submittedAt: new Date().toISOString(),
  });
}
