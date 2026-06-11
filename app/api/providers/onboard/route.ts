import { NextRequest, NextResponse } from "next/server";
import { onboardProvider } from "@/lib/providers/actions";
import { requireUser } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json();
  // onboardProvider takes OnboardProviderInput object
  const result = await onboardProvider({
    userId: user.id,
    serviceTypes: body.serviceTypes,
    baseRate: body.baseRate,
    servicePostcodes: body.servicePostcodes,
    abn: body.abn,
    country: body.country,
    serviceTier: body.serviceTier,
  });

  if (!result.success) {
    return NextResponse.json({ error: (result as any).error }, { status: 422 });
  }
  return NextResponse.json(result, { status: 201 });
}
