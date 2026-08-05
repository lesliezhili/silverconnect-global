import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { hasGovtFundingAccess } from "@/lib/auth/govtFundingAccess";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/govt-funding-access
 * Lets client components (e.g. the booking flow) check eligibility for
 * government-funded scheme options without a full server-component
 * rewrite. This is UX only — the real enforcement happens server-side
 * wherever a funding scheme is actually accepted (e.g. /api/bookings/charged).
 */
export async function GET() {
  const me = await getCurrentUser();
  return NextResponse.json({ allowed: await hasGovtFundingAccess(me?.email) });
}
