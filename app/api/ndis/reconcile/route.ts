import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({ reconciled: 0, matched: [], unmatched: [], bankTransactions: body.transactions?.length || 0 });
}
