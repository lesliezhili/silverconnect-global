import { NextRequest, NextResponse } from "next/server";
import { releaseEscrowOnCompletion } from "@/lib/payments/escrow";
import { requireUser } from "@/lib/auth/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireUser();
  const { id } = await params;
  const result = await releaseEscrowOnCompletion(id);

  if (!result.success) {
    return NextResponse.json({ error: (result as any).error }, { status: 400 });
  }
  return NextResponse.json(result);
}
