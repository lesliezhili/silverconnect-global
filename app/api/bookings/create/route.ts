import { NextRequest, NextResponse } from "next/server";
import { createBookingRequest } from "@/lib/bookings/engine";
import { requireUser } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json();
  // createBookingRequest takes CreateBookingInput object
  const result = await createBookingRequest({
    customerId: user.id,
    serviceId: body.serviceId,
    targetDatetime: body.targetDatetime,
    durationHours: body.durationHours,
    addressId: body.addressId,
    notes: body.notes,
  });

  if (!result.success) {
    return NextResponse.json({ error: (result as any).error }, { status: 404 });
  }
  return NextResponse.json(result, { status: 201 });
}
