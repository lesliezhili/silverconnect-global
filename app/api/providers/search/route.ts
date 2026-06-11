import { NextRequest, NextResponse } from "next/server";
import { getProvidersForPostcode } from "@/lib/ranking/service";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const postcode = url.searchParams.get("postcode") || "";
  const tier = url.searchParams.get("tier") || undefined;
  const funding = url.searchParams.get("funding") || undefined;

  if (!postcode) return NextResponse.json({ error: "Postcode required" }, { status: 400 });

  const providers = await getProvidersForPostcode({
    postcode, serviceTier: tier, fundingSource: funding,
  });
  return NextResponse.json({ providers, postcode });
}
