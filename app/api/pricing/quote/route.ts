import { NextRequest, NextResponse } from "next/server";
import { calculateSmartPricing } from "@/lib/pricing/smart-engine";
import { getOptionalAuthSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const session = await getOptionalAuthSession();
  const body = await req.json();

  const result = await calculateSmartPricing({
    providerBaseRate: body.providerBaseRate || 45,
    durationHours: body.durationHours || 2,
    targetDate: new Date(body.targetDate),
    country: body.country || "AU",
    fundingSource: body.fundingSource,
    serviceTier: body.serviceTier,
    serviceType: body.serviceType,
    customerId: session?.userId || undefined,
  });

  return NextResponse.json(result);
}
