import { NextRequest, NextResponse } from "next/server";
import { confirmCheckIn } from "@/lib/dispatch/emergency";
import { requireUser } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const { bookingId } = await req.json();
  const result = await confirmCheckIn(bookingId, user.id);

  if (!result.success) {
    return NextResponse.json({ error: (result as any).error }, { status: 400 });
  }
  return NextResponse.json(result);
}
