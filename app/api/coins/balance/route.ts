import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getAccountSummary, isAuUser, PERK_CATALOG } from "@/lib/coins/ledger";

export const dynamic = "force-dynamic";

/**
 * GET /api/coins/balance
 * Current user's coin balance, unlocked perks, and the redemption
 * catalog. Australia-only — a client-side hidden nav entry is UX only,
 * this 403 is the real boundary.
 */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAuUser(me.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const summary = await getAccountSummary(me.id);
  return NextResponse.json({
    balance: summary.balance,
    unlockedPerks: summary.unlockedPerks,
    catalog: PERK_CATALOG,
  });
}
