import { NextRequest, NextResponse } from "next/server";
import { submitFeedback } from "@/lib/ranking/service";
import { requireUser } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json();
  const result = await submitFeedback({
    bookingId: body.bookingId, customerId: user.id, providerId: body.providerId,
    overallRating: body.overallRating, punctualityRating: body.punctualityRating,
    qualityRating: body.qualityRating, communicationRating: body.communicationRating,
    safetyRating: body.safetyRating, comment: body.comment, wouldRecommend: body.wouldRecommend,
  });
  if (!(result as any).success) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result, { status: 201 });
}
