import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { isAuUser, verifyChain } from "@/lib/coins/ledger";

export const dynamic = "force-dynamic";

/**
 * GET /api/coins/verify
 * Recomputes the entire global hash chain and confirms every row's hash
 * matches — the "prove the ledger hasn't been tampered with" endpoint.
 * Any signed-in Australian user can run this; it doesn't leak anyone's
 * individual balances, only structural integrity.
 */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAuUser(me.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await verifyChain();
  return NextResponse.json(result);
}
