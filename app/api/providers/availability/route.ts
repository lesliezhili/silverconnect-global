import { NextRequest, NextResponse } from "next/server";
import { setAvailabilityWindows, toggleEmergencyOptIn } from "@/lib/providers/actions";
import { requireUser } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const { slots } = await req.json();
  // setAvailabilityWindows(providerId: string, slots: AvailabilitySlot[])
  const result = await setAvailabilityWindows(user.id, slots);

  if (!result.success) {
    return NextResponse.json({ error: (result as any).error }, { status: 422 });
  }
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const user = await requireUser();
  const { emergencyOptIn } = await req.json();
  // toggleEmergencyOptIn(providerId: string, optIn: boolean)
  const result = await toggleEmergencyOptIn(user.id, emergencyOptIn);
  return NextResponse.json(result);
}
