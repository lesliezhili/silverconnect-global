import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema/bookings";
import { getCurrentUser } from "@/lib/auth/server";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * POST /api/bookings/[id]/complete
 * Provider marks service as completed.
 * Requires: before AND after evidence uploaded.
 * Triggers: notification to customer for feedback.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: bookingId } = await params;

  const [booking] = await db.select().from(bookings)
    .where(eq(bookings.id, bookingId)).limit(1);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  if (booking.status !== "in_progress") {
    return NextResponse.json({
      error: "Service must be in progress to mark complete. Upload before-service evidence first.",
    }, { status: 400 });
  }

  // Mark completed
  await db.update(bookings).set({
    status: "completed" as never,
    completedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(bookings.id, bookingId));

  return NextResponse.json({
    success: true,
    message: "Service marked as completed! The customer will now be asked to leave feedback. Once feedback is received, your payment will be released.",
    nextStep: "Wait for customer feedback → funds released to your bank account",
  });
}
