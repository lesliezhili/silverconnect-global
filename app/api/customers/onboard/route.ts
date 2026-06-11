import { NextRequest, NextResponse } from "next/server";
import { onboardCustomer } from "@/lib/customers/actions";
import { requireUser } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json();
  // onboardCustomer takes OnboardCustomerInput object
  const result = await onboardCustomer({
    userId: user.id,
    flatAddress: body.address,
    coordinates: body.coordinates,
    emergencyContact: body.emergencyContact,
    country: body.country,
  });

  if (!result.success) {
    return NextResponse.json({ error: (result as any).error }, { status: 422 });
  }
  return NextResponse.json(result, { status: 201 });
}
