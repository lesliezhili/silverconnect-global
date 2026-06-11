import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema/bookings";
import { notifications } from "@/lib/db/schema/notifications";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** POST /api/bookings/[id]/start - Provider starts job with before-photo */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.status !== "confirmed") {
      return NextResponse.json({ error: "Cannot start: status is " + booking.status }, { status: 400 });
    }

    await db.update(bookings).set({
      status: "in_progress" as never,
      startedAt: new Date(),
      notes: (booking.notes || "") + "\n[BEFORE] " + (body.evidenceUrl || "no photo"),
      updatedAt: new Date(),
    }).where(eq(bookings.id, id));

    await db.insert(notifications).values({
      userId: booking.customerId,
      kind: "booking_update" as never,
      title: "Service Started!",
      body: "Your helper has arrived and started working.",
      link: "/bookings/" + id,
      relatedBookingId: id,
    } as never);

    return NextResponse.json({ success: true, bookingId: id, status: "in_progress", startedAt: new Date().toISOString() });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
