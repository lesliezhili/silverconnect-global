import { NextRequest, NextResponse } from "next/server";
import { validateClaim, submitBatchToPRODA } from "@/lib/ndis/claim-lodgement";
import { getCurrentUser } from "@/lib/auth/server";
import { hasGovtFundingAccess } from "@/lib/auth/govtFundingAccess";

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasGovtFundingAccess(me.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  if (body.action === "submit") {
    const validation = validateClaim(body.claim);
    if (!validation.valid) return NextResponse.json({ errors: validation.errors }, { status: 422 });
    const result = await submitBatchToPRODA([body.claim], { environment: "sandbox", orgId: process.env.NDIS_PRODA_ORG_ID || "" });
    return NextResponse.json(result);
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasGovtFundingAccess(me.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const claimId = req.nextUrl.searchParams.get("claimId");
  return NextResponse.json({ claimId, status: "pending" });
}
