import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("orgId");
  return NextResponse.json({ organizationId: orgId, entries: [], total: 0 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({ success: true, action: body.action, affected: body.entryIds?.length || 0 });
}
