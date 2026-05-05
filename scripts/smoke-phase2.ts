/**
 * Phase 2 smoke test: services + bookings + payments tables.
 *
 * Run: `npx tsx scripts/smoke-phase2.ts`
 *
 * Cleans up the test rows at the end.
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { users } from "../lib/db/schema/users";
import { providerProfiles } from "../lib/db/schema/providers";
import { addresses } from "../lib/db/schema/customer-data";
import {
  serviceCategories,
  services,
  servicePrices,
} from "../lib/db/schema/services";
import {
  bookings,
  bookingChanges,
  recurringSeries,
} from "../lib/db/schema/bookings";
import { payments, refunds, payouts, wallets } from "../lib/db/schema/payments";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");
const client = postgres(url, { ssl: "require", prepare: false, max: 5 });
const db = drizzle(client);

const TEST_CUSTOMER = "phase2-customer@example.com";
const TEST_PROVIDER = "phase2-provider@example.com";
const CAT_CODE = "phase2_test_cat";
const SVC_CODE = "phase2_test_svc";

function check(label: string, ok: boolean, extra?: string) {
  const tag = ok ? "✅" : "❌";
  console.log(`${tag} ${label}${extra ? ` — ${extra}` : ""}`);
  if (!ok) process.exitCode = 1;
}

async function cleanup() {
  await db
    .delete(users)
    .where(
      sql`lower(${users.email}) in (lower(${TEST_CUSTOMER}), lower(${TEST_PROVIDER}))`,
    );
  await db.delete(services).where(eq(services.code, SVC_CODE));
  await db.delete(serviceCategories).where(eq(serviceCategories.code, CAT_CODE));
}

async function main() {
  await cleanup();

  // 1. Services hierarchy
  const [cat] = await db
    .insert(serviceCategories)
    .values({ code: CAT_CODE, iconKey: "spray-can", sortOrder: 99 })
    .returning();
  check("services: category created", !!cat?.id, cat?.id);

  const [svc] = await db
    .insert(services)
    .values({
      categoryCode: CAT_CODE,
      code: SVC_CODE,
      durationMin: 120,
    })
    .returning();
  check("services: service created", !!svc?.id, svc?.id);

  await db.insert(servicePrices).values([
    {
      serviceId: svc.id,
      country: "AU",
      basePrice: "100.00",
      taxRate: "0.1000",
      currency: "AUD",
    },
    {
      serviceId: svc.id,
      country: "CN",
      basePrice: "300.00",
      taxRate: "0.0000",
      currency: "CNY",
    },
  ]);
  const prices = await db
    .select()
    .from(servicePrices)
    .where(eq(servicePrices.serviceId, svc.id));
  check("services: 2 country prices saved", prices.length === 2);

  // 2. Customer + Provider + Address
  const passwordHash = await bcrypt.hash("Phase2Test12", 10);
  const [customer] = await db
    .insert(users)
    .values({ email: TEST_CUSTOMER, passwordHash, role: "customer" })
    .returning();
  const [providerUser] = await db
    .insert(users)
    .values({ email: TEST_PROVIDER, passwordHash, role: "provider" })
    .returning();
  const [provider] = await db
    .insert(providerProfiles)
    .values({ userId: providerUser.id, onboardingStatus: "approved" })
    .returning();
  const [addr] = await db
    .insert(addresses)
    .values({
      userId: customer.id,
      line1: "1 Test Pl",
      city: "Sydney",
      country: "AU",
    })
    .returning();
  check("seed: customer/provider/address created", !!customer.id && !!provider.id && !!addr.id);

  // 3. Booking
  const [booking] = await db
    .insert(bookings)
    .values({
      customerId: customer.id,
      providerId: provider.id,
      serviceId: svc.id,
      addressId: addr.id,
      scheduledAt: new Date(Date.now() + 86400_000),
      durationMin: 120,
      basePrice: "100.00",
      taxAmount: "10.00",
      totalPrice: "110.00",
      currency: "AUD",
    })
    .returning();
  check("booking: created with default status=pending", booking.status === "pending");

  // 4. Booking change audit
  await db.insert(bookingChanges).values({
    bookingId: booking.id,
    type: "status_change",
    fromStatus: "pending",
    toStatus: "confirmed",
    actorId: provider.userId,
    note: "Provider confirmed",
  });
  await db
    .update(bookings)
    .set({ status: "confirmed", confirmedAt: new Date() })
    .where(eq(bookings.id, booking.id));
  const changes = await db
    .select()
    .from(bookingChanges)
    .where(eq(bookingChanges.bookingId, booking.id));
  check("booking: status_change audit row written", changes.length === 1);

  // 5. Recurring series
  const [series] = await db
    .insert(recurringSeries)
    .values({
      customerId: customer.id,
      serviceId: svc.id,
      addressId: addr.id,
      frequency: "weekly",
      startDate: new Date().toISOString().slice(0, 10),
      weekday: 3,
      hour: 10,
      minute: 0,
    })
    .returning();
  check("recurring: weekly series created", !!series.id);

  // 6. Payment + Refund
  const [pay] = await db
    .insert(payments)
    .values({
      bookingId: booking.id,
      stripePaymentIntentId: `pi_test_${Date.now()}`,
      amount: "110.00",
      currency: "AUD",
      status: "captured",
      capturedAt: new Date(),
    })
    .returning();
  check("payments: captured PI inserted", pay.status === "captured");

  // Duplicate stripe_payment_intent_id rejected
  let dupErr: string | null = null;
  try {
    await db.insert(payments).values({
      bookingId: booking.id,
      stripePaymentIntentId: pay.stripePaymentIntentId!,
      amount: "1.00",
      currency: "AUD",
      status: "pending",
    });
  } catch (e) {
    dupErr = e instanceof Error ? e.message : String(e);
  }
  check(
    "payments: duplicate stripe_payment_intent_id rejected",
    dupErr !== null,
    dupErr ? "as expected" : "no error thrown",
  );

  const [refund] = await db
    .insert(refunds)
    .values({
      paymentId: pay.id,
      stripeRefundId: `re_test_${Date.now()}`,
      amount: "110.00",
      reason: "customer_cancelled",
      status: "succeeded",
    })
    .returning();
  check("refunds: refund inserted", !!refund.id);

  // 7. Provider wallet + payout
  const [wallet] = await db
    .insert(wallets)
    .values({
      providerId: provider.id,
      balanceAvailable: "92.00",
      balancePending: "0.00",
      currency: "AUD",
    })
    .returning();
  check("wallets: 1:1 provider wallet inserted", !!wallet.id);

  // Duplicate wallet for same provider rejected
  let dupWalletErr: string | null = null;
  try {
    await db.insert(wallets).values({
      providerId: provider.id,
      balanceAvailable: "0",
      currency: "AUD",
    });
  } catch (e) {
    dupWalletErr = e instanceof Error ? e.message : String(e);
  }
  check(
    "wallets: 1:1 provider unique constraint",
    dupWalletErr !== null,
    dupWalletErr ? "as expected" : "no error",
  );

  const [payout] = await db
    .insert(payouts)
    .values({
      providerId: provider.id,
      stripeTransferId: `tr_test_${Date.now()}`,
      amount: "92.00",
      currency: "AUD",
      status: "paid",
      paidAt: new Date(),
    })
    .returning();
  check("payouts: paid transfer inserted", payout.status === "paid");

  // 8. Cascade delete: removing booking removes payments + refunds + changes
  await db.delete(bookings).where(eq(bookings.id, booking.id));
  const [orphanPay] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, pay.id));
  const [orphanRefund] = await db
    .select()
    .from(refunds)
    .where(eq(refunds.id, refund.id));
  const orphanChanges = await db
    .select()
    .from(bookingChanges)
    .where(eq(bookingChanges.bookingId, booking.id));
  check("cascade: payment removed when booking deleted", !orphanPay);
  check("cascade: refund removed when payment deleted", !orphanRefund);
  check(
    "cascade: booking_changes removed when booking deleted",
    orphanChanges.length === 0,
  );

  // 9. Cleanup
  await db.delete(recurringSeries).where(eq(recurringSeries.id, series.id));
  await cleanup();
  await db.delete(servicePrices).where(eq(servicePrices.serviceId, svc.id));

  console.log(
    "\nDone. Exit code:",
    process.exitCode ?? 0,
    process.exitCode ? "(some checks failed)" : "(all green)",
  );
  await client.end();
  process.exit(process.exitCode ?? 0);
}

main().catch(async (e) => {
  console.error("FATAL:", e);
  await client.end();
  process.exit(1);
});
