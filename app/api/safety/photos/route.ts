import { NextRequest, NextResponse } from "next/server";
import { uploadServicePhoto, customerVerifyPhotos } from "@/lib/safety/service";
import { requireUser } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json();
  const result = await uploadServicePhoto({
    bookingId: body.bookingId, providerId: user.id,
    photoType: body.photoType, photoUrl: body.photoUrl,
    caption: body.caption, lat: body.lat, lng: body.lng,
  });
  return NextResponse.json(result, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json();
  const result = await customerVerifyPhotos({
    bookingId: body.bookingId, customerId: user.id, approved: body.approved,
  });
  return NextResponse.json(result);
}
