import { NextRequest, NextResponse } from "next/server";
import { calculateChangeQuote } from "@/lib/bookings/same-day-changes";

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const quote = calculateChangeQuote({
    request: { bookingId: params.bookingId, changeType: "reschedule" as any },
    originalAmount: Number(params.amount || 0),
    serviceDate: new Date(params.serviceDate || ""),
    serviceTime: params.serviceTime || "09:00",
  });
  return NextResponse.json(quote);
}

export async function POST(req: NextRequest) {
  const confirm = req.headers.get("X-Confirm");
  if (confirm !== "true") return NextResponse.json({ error: "Set X-Confirm: true header to execute" }, { status: 400 });
  const body = await req.json();
  return NextResponse.json({ ...body, status: "changed", changedAt: new Date().toISOString() });
}
