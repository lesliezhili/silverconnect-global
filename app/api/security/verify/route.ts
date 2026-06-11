import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({
    checkId: body.checkId,
    status: body.approved ? "verified" : "rejected",
    verifiedAt: new Date().toISOString(),
    verifiedBy: body.adminId,
  });
}
