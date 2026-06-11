import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, bookingChanges } from "@/lib/db/schema/bookings";
import { verifyCronAuth } from "@/lib/cron/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cancels any booking still `pending` 24h after creation. Avoids leaving
 * customers in limbo when no provider accepts. Idempotent: re-running
 * does nothing because the WHERE clause filters out non-pending rows.
 */
export async function GET(req: NextRequest) {
  const fail = verifyCronAuth(req);
  if (fail) return fail;

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const stale = await db
    .select({ id: bookings.id, status: bookings.status })
    .from(bookings)
    .where(and(eq(bookings.status, "pending"), lt(bookings.createdAt, cutoff)));

  let cancelled = 0;
  for (const row of stale) {
    await db.transaction(async (tx) => {
      await tx
        .update(bookings)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          cancelReason: "auto_no_provider_24h",
          updatedAt: new Date(),
        })
        .where(and(eq(bookings.id, row.id), eq(bookings.status, "pending")));
      await tx.insert(bookingChanges).values({
        bookingId: row.id,
        type: "cancel",
        fromStatus: "pending",
        toStatus: "cancelled",
        note: "Auto-cancelled: no provider accepted within 24h",
      });
    });
    cancelled++;
  }

  return NextResponse.json({ ok: true, scanned: stale.length, cancelled });
}
