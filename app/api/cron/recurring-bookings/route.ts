import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { and, eq, gte, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, recurringSeries } from "@/lib/db/schema/bookings";
import { addresses } from "@/lib/db/schema/customer-data";
import { servicePrices } from "@/lib/db/schema/services";
import { services as servicesTable } from "@/lib/db/schema/services";
import { verifyCronAuth } from "@/lib/cron/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HORIZON_DAYS = 14;

/**
 * Walks active recurringSeries and materializes booking rows for the
 * next HORIZON_DAYS. Idempotent: a booking is only created if no
 * existing booking on the same series shares the target scheduledAt.
 */
export async function GET(req: NextRequest) {
  const fail = verifyCronAuth(req);
  if (fail) return fail;

  const now = new Date();
  const horizon = new Date(now.getTime() + HORIZON_DAYS * 24 * 60 * 60 * 1000);

  const active = await db
    .select({
      id: recurringSeries.id,
      customerId: recurringSeries.customerId,
      serviceId: recurringSeries.serviceId,
      addressId: recurringSeries.addressId,
      frequency: recurringSeries.frequency,
      startDate: recurringSeries.startDate,
      endsAt: recurringSeries.endsAt,
      weekday: recurringSeries.weekday,
      hour: recurringSeries.hour,
      minute: recurringSeries.minute,
    })
    .from(recurringSeries)
    .where(or(isNull(recurringSeries.endsAt), gte(recurringSeries.endsAt, now)));

  let created = 0;
  let skipped = 0;

  for (const s of active) {
    if (!s.addressId) {
      skipped++;
      continue;
    }
    const [addr] = await db
      .select({ country: addresses.country })
      .from(addresses)
      .where(eq(addresses.id, s.addressId))
      .limit(1);
    if (!addr) {
      skipped++;
      continue;
    }
    const [svc] = await db
      .select({ durationMin: servicesTable.durationMin })
      .from(servicesTable)
      .where(eq(servicesTable.id, s.serviceId))
      .limit(1);
    if (!svc) {
      skipped++;
      continue;
    }
    const [price] = await db
      .select({
        basePrice: servicePrices.basePrice,
        taxRate: servicePrices.taxRate,
        currency: servicePrices.currency,
      })
      .from(servicePrices)
      .where(
        and(
          eq(servicePrices.serviceId, s.serviceId),
          eq(servicePrices.country, addr.country),
          eq(servicePrices.enabled, true),
        ),
      )
      .limit(1);
    if (!price) {
      skipped++;
      continue;
    }

    for (const target of upcomingSlots(s, now, horizon)) {
      const dup = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.recurringSeriesId, s.id),
            eq(bookings.scheduledAt, target),
          ),
        )
        .limit(1);
      if (dup.length > 0) continue;

      const base = Number(price.basePrice);
      const tax = +(base * Number(price.taxRate)).toFixed(2);
      const total = +(base + tax).toFixed(2);

      await db.insert(bookings).values({
        customerId: s.customerId,
        serviceId: s.serviceId,
        addressId: s.addressId,
        recurringSeriesId: s.id,
        scheduledAt: target,
        durationMin: svc.durationMin,
        status: "pending",
        basePrice: String(base),
        taxAmount: String(tax),
        totalPrice: String(total),
        currency: price.currency,
      });
      created++;
    }
  }

  return NextResponse.json({
    ok: true,
    seriesScanned: active.length,
    bookingsCreated: created,
    skipped,
  });
}

type Series = {
  startDate: string;
  endsAt: Date | null;
  frequency: "weekly" | "biweekly" | "monthly";
  weekday: number;
  hour: number;
  minute: number;
};

function upcomingSlots(s: Series, from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const start = new Date(s.startDate + "T00:00:00Z");
  const cap = s.endsAt && s.endsAt < to ? s.endsAt : to;
  const cursor = new Date(Math.max(start.getTime(), from.getTime()));
  cursor.setUTCHours(0, 0, 0, 0);

  // ISO weekday: Mon=1 .. Sun=7. JS getUTCDay: Sun=0..Sat=6.
  const targetIsoDow = s.weekday;
  const stepDays =
    s.frequency === "weekly" ? 7 : s.frequency === "biweekly" ? 14 : 30;

  // Advance cursor to the next matching weekday.
  const cursorIsoDow = ((cursor.getUTCDay() + 6) % 7) + 1;
  const diff = (targetIsoDow - cursorIsoDow + 7) % 7;
  cursor.setUTCDate(cursor.getUTCDate() + diff);

  while (cursor <= cap) {
    const slot = new Date(cursor);
    slot.setUTCHours(s.hour, s.minute, 0, 0);
    if (slot >= from && slot <= cap) out.push(new Date(slot));
    cursor.setUTCDate(cursor.getUTCDate() + stepDays);
  }
  return out;
}
