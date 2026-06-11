import { NextRequest, NextResponse } from "next/server";
import { getLedgerHistory } from "@/lib/payments/escrow";
import { requireUser } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  await requireUser();
  const url = new URL(req.url);
  const bookingId = url.searchParams.get("bookingId") ?? undefined;
  const ledger = await getLedgerHistory(bookingId);
  return NextResponse.json({ blocks: ledger });
}
