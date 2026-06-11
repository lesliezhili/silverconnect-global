import { NextRequest, NextResponse } from "next/server";
import { providerCheckIn, triggerDuressSignal } from "@/lib/safety/service";
import { requireUser } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json();

  if (body.duress) {
    const result = await triggerDuressSignal({
      bookingId: body.bookingId, userId: user.id,
      lat: body.lat, lng: body.lng, role: body.role || "provider",
    });
    return NextResponse.json(result);
  }

  const result = await providerCheckIn({
    bookingId: body.bookingId, providerId: user.id,
    lat: body.lat, lng: body.lng, type: body.type || "arrival",
  });
  if (!(result as any).success) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
