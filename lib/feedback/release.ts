import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, bookingChanges } from "@/lib/db/schema/bookings";
import { TRUST_RULES } from "@/lib/release-quality";

const PLATFORM_FEE = 0.15;

/**
 * The single payout release path, run when the customer confirms a job by
 * leaving feedback:
 *  - held for admin review if QC flagged the visit or the rating is <= 2★
 *  - otherwise completed → released, and the provider's share moves from
 *    pending (credited at completion) to available.
 * The status guard makes it idempotent — repeat submissions never pay twice.
 */
export async function releaseOrHold(input: {
  bookingId: string;
  actorId: string;
  rating: number;
  /** Admin release after review — skips the hold rules. */
  force?: boolean;
}): Promise<{ released: boolean; held: boolean }> {
  const [b] = await db
    .select({
      status: bookings.status,
      qcFlag: bookings.qcFlag,
      providerId: bookings.providerId,
      totalPrice: bookings.totalPrice,
      currency: bookings.currency,
    })
    .from(bookings)
    .where(eq(bookings.id, input.bookingId))
    .limit(1);
  if (!b || b.status !== "completed") return { released: false, held: false };

  if (!input.force && (b.qcFlag || input.rating <= TRUST_RULES.pairBlockAt)) {
    await db.insert(bookingChanges).values({
      bookingId: input.bookingId,
      type: "status_change",
      fromStatus: "completed",
      toStatus: "completed",
      actorId: input.actorId,
      note: `Payout held for admin review (${b.qcFlag ? `qc:${b.qcFlag}` : `rating ${input.rating}`})`,
    });
    return { released: false, held: true };
  }

  const released = await db.transaction(async (tx) => {
    const rows = await tx
      .update(bookings)
      .set({ status: "released" as never, updatedAt: new Date() })
      .where(and(eq(bookings.id, input.bookingId), eq(bookings.status, "completed")))
      .returning({ id: bookings.id });
    if (rows.length === 0) return false;
    await tx.insert(bookingChanges).values({
      bookingId: input.bookingId,
      type: "status_change",
      fromStatus: "completed",
      toStatus: "released",
      actorId: input.actorId,
      note: input.force ? "Admin released payout after review" : "Customer confirmed the job — payout released",
    });
    if (b.providerId) {
      const earning = +(Number(b.totalPrice || 0) * (1 - PLATFORM_FEE)).toFixed(2);
      await tx.execute(sql`
        INSERT INTO wallets (id, provider_id, balance_available, balance_pending, currency, updated_at)
        VALUES (gen_random_uuid(), ${b.providerId}, ${earning}, '0', ${b.currency || "AUD"}, NOW())
        ON CONFLICT (provider_id) DO UPDATE SET
          balance_available = wallets.balance_available::numeric + ${earning}::numeric,
          balance_pending = GREATEST(0, wallets.balance_pending::numeric - ${earning}::numeric),
          updated_at = NOW()
      `);
    }
    return true;
  });
  return { released, held: false };
}
