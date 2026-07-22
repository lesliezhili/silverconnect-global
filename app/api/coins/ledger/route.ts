import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getAccountSummary, isAuUser } from "@/lib/coins/ledger";

export const dynamic = "force-dynamic";

/**
 * GET /api/coins/ledger
 * The current user's most recent coin transactions (their credit/debit/
 * receipt rows), each with its hash and prevHash so the chain can be
 * inspected client-side. Australia-only.
 */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAuUser(me.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const summary = await getAccountSummary(me.id);
  return NextResponse.json({ entries: summary.ledger });
}
