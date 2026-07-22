import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import {
  redeemPerk,
  isAuUser,
  PERK_CATALOG,
  InsufficientCoinsError,
  PerkAlreadyUnlockedError,
  type PerkKey,
} from "@/lib/coins/ledger";

export const dynamic = "force-dynamic";

/**
 * POST /api/coins/redeem
 * Body: { perkKey: "founding_badge" | "priority_support" | "wall_of_honor" }
 * Redeems coins for a one-time, non-financial recognition perk.
 */
export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAuUser(me.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const perkKey = body?.perkKey as PerkKey;
  if (!perkKey || !(perkKey in PERK_CATALOG)) {
    return NextResponse.json({ error: "Unknown perk" }, { status: 400 });
  }

  try {
    const result = await redeemPerk(me.id, perkKey);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    if (e instanceof PerkAlreadyUnlockedError) {
      return NextResponse.json({ error: "You've already unlocked this perk" }, { status: 409 });
    }
    if (e instanceof InsufficientCoinsError) {
      return NextResponse.json({ error: "Not enough coins for this perk" }, { status: 400 });
    }
    console.error("[coins/redeem] failed:", e);
    return NextResponse.json({ error: "Redemption failed" }, { status: 500 });
  }
}
