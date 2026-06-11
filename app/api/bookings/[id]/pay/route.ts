import { NextRequest, NextResponse } from "next/server";
import { processBookingPayment } from "@/lib/payments/escrow";
import { requireUser } from "@/lib/auth/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireUser();
  const { id } = await params;
  const result = await processBookingPayment(id);

  if (!result.success) {
    return NextResponse.json({ error: (result as any).error }, { status: 402 });
  }
  return NextResponse.json(result);
}
