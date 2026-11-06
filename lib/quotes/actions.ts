"use server";

import { redirect as nextRedirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, serviceQuotes } from "@/lib/db/schema/bookings";
import { providerProfiles } from "@/lib/db/schema/providers";
import { addresses } from "@/lib/db/schema/customer-data";
import { services } from "@/lib/db/schema/services";
import { getCurrentUser } from "@/lib/auth/server";
import { notify } from "@/lib/notifications/server";
import { findLiveArea, isReleaseCategory } from "@/lib/release";
import { TIER, isEffortTier, priceFor, tierHours } from "@/lib/release-pricing";
import { quoteEligibility } from "./eligibility";

const QUOTE_VALID_DAYS = 90;

/** Provider sends a quote for later visits from a completed first job. */
export async function submitQuote(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  const bookingId = String(formData.get("bookingId") ?? "");
  const back = `/${locale}/provider/jobs/${bookingId}`;
  const me = await getCurrentUser();
  if (!me || me.role !== "provider") nextRedirect(`/${locale}/auth/login`);

  const [job] = await db
    .select({
      id: bookings.id,
      customerId: bookings.customerId,
      providerId: bookings.providerId,
      providerUserId: providerProfiles.userId,
      status: bookings.status,
      tier: bookings.effortTier,
      durationMin: bookings.durationMin,
      startedAt: bookings.startedAt,
      completedAt: bookings.completedAt,
      category: services.categoryCode,
      country: addresses.country,
      postcode: addresses.postcode,
    })
    .from(bookings)
    .innerJoin(providerProfiles, eq(providerProfiles.id, bookings.providerId))
    .leftJoin(services, eq(services.id, bookings.serviceId))
    .leftJoin(addresses, eq(addresses.id, bookings.addressId))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!job || job.providerUserId !== me.id) nextRedirect(`/${locale}/provider/jobs`);

  const elig = await quoteEligibility(job);
  if (!elig.ok) nextRedirect(`${back}?error=quote_not_allowed`);

  const tier = String(formData.get("tier") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!isEffortTier(tier) || !isReleaseCategory(job.category) || reason.length < 10) {
    nextRedirect(`${back}?error=quote_invalid`);
  }
  // Regular stays a fixed package: a quote may move a regular job up a
  // tier, but never re-price regular time.
  const hours = tierHours(tier, Number(formData.get("hours")));
  const area = findLiveArea(job.country ?? "", job.postcode);
  if (!area) nextRedirect(`${back}?error=quote_invalid`);
  const price = priceFor({ country: area.country, category: job.category, tier, hours, taxRate: area.tax.rate });

  await db.insert(serviceQuotes).values({
    bookingId: job.id,
    customerId: job.customerId,
    providerId: job.providerId!,
    category: job.category,
    fromTier: elig.fromTier,
    tier,
    hours: String(TIER[tier].fixed ? TIER[tier].minHours : hours),
    bookedMin: job.durationMin,
    actualMin: elig.actualMin,
    basePrice: price.base.toFixed(2),
    currency: area.country === "CA" ? "CAD" : "AUD",
    reason,
    expiresAt: new Date(Date.now() + QUOTE_VALID_DAYS * 24 * 3600 * 1000),
  }).onConflictDoNothing();

  await notify({
    userId: job.customerId,
    kind: "booking_update",
    title: "New quote for your next visits",
    body: `${tier} · ${price.hours}h · ${price.total.toFixed(2)} incl. tax — please approve or decline`,
    link: `/${locale}/bookings/${job.id}`,
    relatedBookingId: job.id,
  }).catch(() => {});

  nextRedirect(`${back}?quote=sent`);
}

/** Customer approves or declines a pending quote. */
export async function decideQuote(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  const quoteId = String(formData.get("quoteId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);

  const [q] = await db.select().from(serviceQuotes).where(eq(serviceQuotes.id, quoteId)).limit(1);
  const back = `/${locale}/bookings/${q?.bookingId ?? ""}`;
  if (!q || q.customerId !== me.id) nextRedirect(`/${locale}/bookings`);
  if (q.status !== "pending" || q.expiresAt < new Date() || (decision !== "approve" && decision !== "decline")) {
    nextRedirect(`${back}?error=quote_closed`);
  }

  await db.transaction(async (tx) => {
    if (decision === "approve") {
      // One live quote per customer + provider + category.
      await tx
        .update(serviceQuotes)
        .set({ status: "expired" })
        .where(
          and(
            eq(serviceQuotes.customerId, q.customerId),
            eq(serviceQuotes.providerId, q.providerId),
            eq(serviceQuotes.category, q.category),
            eq(serviceQuotes.status, "approved"),
            ne(serviceQuotes.id, q.id),
          ),
        );
    }
    await tx
      .update(serviceQuotes)
      .set({ status: decision === "approve" ? "approved" : "declined", decidedAt: new Date() })
      .where(and(eq(serviceQuotes.id, q.id), eq(serviceQuotes.status, "pending")));
  });

  const [p] = await db
    .select({ userId: providerProfiles.userId })
    .from(providerProfiles)
    .where(eq(providerProfiles.id, q.providerId))
    .limit(1);
  if (p?.userId) {
    await notify({
      userId: p.userId,
      kind: "booking_update",
      title: decision === "approve" ? "Quote approved" : "Quote declined",
      body: decision === "approve" ? "Next bookings will use your quoted tier and hours." : "Next bookings stay at the standard price.",
      link: `/${locale}/provider/jobs/${q.bookingId}`,
      relatedBookingId: q.bookingId,
    }).catch(() => {});
  }

  nextRedirect(`${back}?quote=${decision === "approve" ? "approved" : "declined"}`);
}
