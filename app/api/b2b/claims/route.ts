import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.action === "generate") {
    return NextResponse.json({ claims: [], generated: 0 });
  }
  if (body.action === "submit") {
    return NextResponse.json({ batchReference: `BATCH-${Date.now()}`, submitted: 0 });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
