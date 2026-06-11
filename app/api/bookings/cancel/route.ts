import { NextRequest, NextResponse } from "next/server";
import { calculateCancellationQuote } from "@/lib/bookings/cancellation";

export async function GET(req: NextRequest) {
  const bookingId = req.nextUrl.searchParams.get("bookingId");
  const amount = Number(req.nextUrl.searchParams.get("amount") || 0);
  const serviceDate = new Date(req.nextUrl.searchParams.get("serviceDate") || "");
  const quote = calculateCancellationQuote({ bookingId: bookingId!, totalAmount: amount, serviceDate });
  return NextResponse.json(quote);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const quote = calculateCancellationQuote({ bookingId: body.bookingId, totalAmount: body.amount, serviceDate: new Date(body.serviceDate) });
  return NextResponse.json({ ...quote, status: "cancelled", cancelledAt: new Date().toISOString() });
}
