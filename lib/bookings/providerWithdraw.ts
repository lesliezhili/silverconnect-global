import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, bookingChanges } from "@/lib/db/schema/bookings";
import { cancelBooking } from "./cancelBooking";
import { assignEmergencyCover, alertAdminsNoCover } from "./emergencyCover";
import { providerNotice, providerPenalty, type ProviderNotice } from "@/lib/release-cancellation";

/**
 * A provider declines or cancels a job (Release 1 policy, lib/release-cancellation.ts):
 *  - Not started: try emergency cover first; the customer keeps the booking.
 *    No cover → cancel with a full refund to the customer and alert admins.
 *  - Already started: end it pro-rata (lib/bookings/cancelBooking.ts).
 *  - Provider penalty + strike depend on notice; declining an unpaid request is free.
 */
export async function providerWithdraw(input: {
  bookingId: string;
  providerUserId: string;
  reason: string;
  locale: string;
}): Promise<{ covered: boolean; notice: ProviderNotice; penalty: number }> {
  const [b] = await db
    .select({
      status: bookings.status,
      scheduledAt: bookings.scheduledAt,
      totalPrice: bookings.totalPrice,
      currency: bookings.currency,
      providerId: bookings.providerId,
    })
    .from(bookings)
    .where(eq(bookings.id, input.bookingId))
    .limit(1);
  if (!b?.providerId) throw new Error("Booking not found");

  const notice = providerNotice(b.status, b.scheduledAt);
  const penalty = providerPenalty(notice, Number(b.totalPrice));
  const note = `Provider withdrew (${notice}): ${input.reason || "—"}`;

  const cover = b.status === "in_progress" ? null : await assignEmergencyCover(input.bookingId, input.locale);

  if (cover) {
    // Booking continues with the replacement; record the original provider's withdrawal.
    await db.execute(sql`
      INSERT INTO cancellations (booking_id, cancelled_by, reason, notes, refund_amount, provider_penalty, refund_status, policy_applied)
      VALUES (${input.bookingId}, ${input.providerUserId}, 'provider_unavailable', ${note}, 0, ${penalty}, 'none', ${notice})`);
  } else {
    const { default: postgres } = await import("postgres");
    const client = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
    try {
      await cancelBooking(client, {
        bookingId: input.bookingId,
        cancelledBy: input.providerUserId,
        reason: b.status === "pending" ? "provider_declined" : "provider_unavailable",
        notes: note,
      });
    } finally {
      await client.end().catch(() => {});
    }
    await db.execute(sql`
      UPDATE cancellations SET policy_applied = ${notice}, provider_penalty = ${penalty}
      WHERE booking_id = ${input.bookingId} AND cancelled_by = ${input.providerUserId}`);
    await db.insert(bookingChanges).values({
      bookingId: input.bookingId,
      type: "cancel",
      fromStatus: b.status,
      toStatus: "cancelled",
      actorId: input.providerUserId,
      note,
    });
    if (b.status !== "pending") await alertAdminsNoCover(input.bookingId, input.locale);
  }

  if (penalty > 0) {
    // Deducted from the provider's balance (may go negative = owed).
    await db.execute(sql`
      INSERT INTO wallets (id, provider_id, balance_available, balance_pending, currency, updated_at)
      VALUES (gen_random_uuid(), ${b.providerId}, ${-penalty}, '0', ${b.currency || "AUD"}, NOW())
      ON CONFLICT (provider_id) DO UPDATE SET
        balance_available = wallets.balance_available::numeric - ${penalty}::numeric,
        updated_at = NOW()`);
  }
  return { covered: !!cover, notice, penalty };
}
