import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { hasChinaSiteAccess } from "@/lib/auth/chinaSiteAccess";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/china-site-access
 * Lets the client-side country switcher check whether to show the "CN"
 * option, without turning the whole Header into a server component.
 * Low-stakes gate (currency display only, no payment/PII behind it) —
 * this is UX-only preview gating while the real mainland deployment is
 * built, not a security boundary.
 */
export async function GET() {
  const me = await getCurrentUser();
  return NextResponse.json({ allowed: hasChinaSiteAccess(me?.email) });
}
