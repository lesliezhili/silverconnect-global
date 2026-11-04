import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, bookingChanges } from "@/lib/db/schema/bookings";
import { services } from "@/lib/db/schema/services";
import { addresses } from "@/lib/db/schema/customer-data";
import { providerProfiles } from "@/lib/db/schema/providers";
import { users } from "@/lib/db/schema/users";
import { notify } from "@/lib/notifications/server";
import { eligibleProviders } from "@/lib/trust";

/**
 * Emergency cover: when a provider withdraws, hand the booking to another
 * provider — emergency-team members first — who passes the trust gate for
 * this customer, offers the category in the booking's country, and has no
 * overlapping job. Same time, same price. Returns the replacement or null.
 */
export async function assignEmergencyCover(bookingId: string, locale = "en"): Promise<{ providerId: string; userId: string } | null> {
  const [b] = await db
    .select({
      id: bookings.id,
      providerId: bookings.providerId,
      customerId: bookings.customerId,
      scheduledAt: bookings.scheduledAt,
      durationMin: bookings.durationMin,
      category: services.categoryCode,
      country: addresses.country,
    })
    .from(bookings)
    .leftJoin(services, eq(services.id, bookings.serviceId))
    .leftJoin(addresses, eq(addresses.id, bookings.addressId))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!b || !b.category) return null;

  const candidates = (await eligibleProviders(b.category, b.customerId, b.country ?? undefined)).filter(
    (p) => p.id !== b.providerId,
  );
  if (candidates.length === 0) return null;

  const end = new Date(b.scheduledAt.getTime() + b.durationMin * 60000);
  const ids = candidates.map((c) => c.id);
  const busy = (await db.execute(sql`
    SELECT DISTINCT provider_id FROM bookings
    WHERE provider_id IN (${sql.join(ids.map((i) => sql`${i}::uuid`), sql`, `)})
      AND status IN ('pending', 'confirmed', 'in_progress')
      AND scheduled_at < ${end}
      AND scheduled_at + (duration_min || ' minutes')::interval > ${b.scheduledAt}`)) as unknown as { provider_id: string }[];
  const busyIds = new Set(busy.map((r) => String(r.provider_id)));
  const team = await db
    .select({ id: providerProfiles.id })
    .from(providerProfiles)
    .where(eq(providerProfiles.emergencyOptIn, true));
  const teamIds = new Set(team.map((t) => t.id));

  const free = candidates.filter((c) => !busyIds.has(c.id));
  const pick = free.find((c) => teamIds.has(c.id)) ?? free[0];
  if (!pick) return null;

  await db.transaction(async (tx) => {
    await tx.update(bookings).set({ providerId: pick.id, updatedAt: new Date() }).where(eq(bookings.id, b.id));
    await tx.insert(bookingChanges).values({
      bookingId: b.id,
      type: "status_change",
      actorId: pick.userId,
      note: `Emergency cover: reassigned from ${b.providerId} to ${pick.id}${teamIds.has(pick.id) ? " (emergency team)" : ""}`,
    });
    await tx.execute(sql`
      INSERT INTO emergency_reroutes (booking_id, original_provider_id, replacement_provider_id, reason, customer_notified)
      VALUES (${b.id}, ${b.providerId}, ${pick.id}, 'provider_cancelled', true)`);
  });

  await notify({
    userId: b.customerId,
    kind: "booking_update",
    title: "Your helper changed — same time, same price",
    body: "Your original helper can't make it. A background-checked replacement has been assigned.",
    link: `/${locale}/bookings/${b.id}`,
    relatedBookingId: b.id,
  }).catch(() => {});
  await notify({
    userId: pick.userId,
    kind: "booking_update",
    title: "Emergency cover job assigned",
    body: "You've been assigned a job another helper couldn't attend. Please check the details.",
    link: `/${locale}/provider/jobs/${b.id}`,
    relatedBookingId: b.id,
  }).catch(() => {});
  return { providerId: pick.id, userId: pick.userId };
}

/** Alert every admin that a booking has no cover. */
export async function alertAdminsNoCover(bookingId: string, locale = "en") {
  const admins = await db.select({ id: users.id }).from(users).where(and(eq(users.isAdmin, true)));
  await Promise.all(
    admins.map((a) =>
      notify({
        userId: a.id,
        kind: "booking_update",
        title: "Emergency: no cover found",
        body: "A provider withdrew and no replacement was available. The customer was refunded in full — please follow up.",
        link: `/${locale}/admin/quality`,
        relatedBookingId: bookingId,
      }).catch(() => {}),
    ),
  );
}
