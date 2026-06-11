import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({
    bookingId: body.bookingId,
    confirmed: true,
    confirmedBy: body.customerId,
    confirmedAt: new Date().toISOString(),
  });
}
