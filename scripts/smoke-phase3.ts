/**
 * Phase 3 smoke: reviews + disputes + safety + notifications + ai + admin.
 *
 * Run: `npx tsx scripts/smoke-phase3.ts`
 *
 * Cleans up at the end so it can be re-run.
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, sql, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { users } from "../lib/db/schema/users";
import { addresses } from "../lib/db/schema/customer-data";
import { providerProfiles } from "../lib/db/schema/providers";
import {
  serviceCategories,
  services,
} from "../lib/db/schema/services";
import { bookings } from "../lib/db/schema/bookings";
import {
  reviews,
  reviewReplies,
  reviewReports,
} from "../lib/db/schema/reviews";
import {
  disputes,
  disputeMessages,
  disputeEvidence,
} from "../lib/db/schema/disputes";
import {
  safetyEvents,
  incidentReports,
} from "../lib/db/schema/safety";
import {
  notifications,
  notificationPrefs,
} from "../lib/db/schema/notifications";
import {
  aiConversations,
  aiMessages,
  aiKb,
  aiEmergencyKeywords,
} from "../lib/db/schema/ai";
import {
  adminActions,
  adminSettings,
  auditLog,
} from "../lib/db/schema/admin";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");
const client = postgres(url, { ssl: "require", prepare: false, max: 1 });
const db = drizzle(client);

const CUSTOMER = "phase3-customer@example.com";
const PROVIDER = "phase3-provider@example.com";
const ADMIN = "phase3-admin@example.com";
const CAT = "phase3_test_cat";
const SVC = "phase3_test_svc";
const KW = "phase3_test_kw";

function check(label: string, ok: boolean, extra?: string) {
  const tag = ok ? "✅" : "❌";
  console.log(`${tag} ${label}${extra ? ` — ${extra}` : ""}`);
  if (!ok) process.exitCode = 1;
}

async function cleanup() {
  await db
    .delete(users)
    .where(
      sql`lower(${users.email}) in (lower(${CUSTOMER}), lower(${PROVIDER}), lower(${ADMIN}))`,
    );
  await db.delete(services).where(eq(services.code, SVC));
  await db.delete(serviceCategories).where(eq(serviceCategories.code, CAT));
  await db.delete(aiEmergencyKeywords).where(eq(aiEmergencyKeywords.keyword, KW));
  await db
    .delete(adminSettings)
    .where(inArray(adminSettings.key, ["phase3.smoke.flag", "phase3.smoke.fee"]));
}

async function main() {
  await cleanup();

  // --- Seed users + provider + booking
  const ph = await bcrypt.hash("Phase3Test12", 10);
  const [customer] = await db
    .insert(users)
    .values({ email: CUSTOMER, passwordHash: ph, role: "customer" })
    .returning();
  const [providerUser] = await db
    .insert(users)
    .values({ email: PROVIDER, passwordHash: ph, role: "provider" })
    .returning();
  const [adminUser] = await db
    .insert(users)
    .values({ email: ADMIN, passwordHash: ph, role: "admin" })
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
  const [cat] = await db
    .insert(serviceCategories)
    .values({ code: CAT, sortOrder: 99 })
    .returning();
  const [svc] = await db
    .insert(services)
    .values({ code: SVC, categoryCode: CAT, durationMin: 60 })
    .returning();
  const [booking] = await db
    .insert(bookings)
    .values({
      customerId: customer.id,
      providerId: provider.id,
      serviceId: svc.id,
      addressId: addr.id,
      scheduledAt: new Date(Date.now() - 86400_000),
      durationMin: 60,
      basePrice: "100.00",
      taxAmount: "10.00",
      totalPrice: "110.00",
      currency: "AUD",
      status: "completed",
      completedAt: new Date(),
    })
    .returning();
  check("seed: users + provider + booking", !!booking?.id);

  // --- Reviews
  const [review] = await db
    .insert(reviews)
    .values({
      bookingId: booking.id,
      customerId: customer.id,
      providerId: provider.id,
      rating: 5,
      comment: "Great service!",
    })
    .returning();
  check("reviews: insert", review.rating === 5);

  let dupReviewErr: string | null = null;
  try {
    await db.insert(reviews).values({
      bookingId: booking.id,
      customerId: customer.id,
      providerId: provider.id,
      rating: 4,
    });
  } catch (e) {
    dupReviewErr = e instanceof Error ? e.message : String(e);
  }
  check("reviews: 1 review per booking unique", dupReviewErr !== null);

  await db
    .insert(reviewReplies)
    .values({
      reviewId: review.id,
      providerId: provider.id,
      body: "Thank you!",
    });
  check("review_replies: insert", true);

  let dupReplyErr: string | null = null;
  try {
    await db.insert(reviewReplies).values({
      reviewId: review.id,
      providerId: provider.id,
      body: "Another reply",
    });
  } catch (e) {
    dupReplyErr = e instanceof Error ? e.message : String(e);
  }
  check("review_replies: 1 reply per review unique", dupReplyErr !== null);

  await db.insert(reviewReports).values({
    reviewId: review.id,
    reporterId: customer.id,
    reason: "spam",
    details: "Test report",
  });
  check("review_reports: insert", true);

  // --- Disputes
  const [dispute] = await db
    .insert(disputes)
    .values({
      bookingId: booking.id,
      raisedBy: customer.id,
      reason: "Provider didn't show up.",
    })
    .returning();
  check("disputes: insert (status=open default)", dispute.status === "open");

  await db.insert(disputeMessages).values([
    {
      disputeId: dispute.id,
      authorId: customer.id,
      body: "I waited 30 minutes",
    },
    {
      disputeId: dispute.id,
      authorId: adminUser.id,
      body: "Internal note",
      isAdminOnly: true,
    },
  ]);
  await db.insert(disputeEvidence).values({
    disputeId: dispute.id,
    uploadedBy: customer.id,
    kind: "image",
    fileUrl: "https://example.com/photo.jpg",
  });
  check("dispute_messages + evidence inserted", true);

  // --- Safety
  const [event] = await db
    .insert(safetyEvents)
    .values({
      userId: customer.id,
      bookingId: booking.id,
      kind: "sos_button",
      severity: "high",
      description: "Test SOS",
    })
    .returning();
  check("safety_events: insert", event.severity === "high");

  await db.insert(incidentReports).values({
    userId: customer.id,
    bookingId: booking.id,
    category: "harassment",
    body: "Detailed incident description",
    photos: ["https://example.com/p1.jpg", "https://example.com/p2.jpg"],
  });
  check("incident_reports: insert with jsonb photos", true);

  // --- Notifications
  await db.insert(notifications).values({
    userId: customer.id,
    kind: "booking_update",
    title: "Booking confirmed",
    body: "Your booking is confirmed",
    link: "/en/bookings/" + booking.id,
    relatedBookingId: booking.id,
  });
  await db.insert(notificationPrefs).values({
    userId: customer.id,
    channel: "email",
    kind: "booking_update",
    enabled: true,
  });
  check("notifications + prefs inserted", true);

  let dupPrefErr: string | null = null;
  try {
    await db.insert(notificationPrefs).values({
      userId: customer.id,
      channel: "email",
      kind: "booking_update",
      enabled: false,
    });
  } catch (e) {
    dupPrefErr = e instanceof Error ? e.message : String(e);
  }
  check(
    "notification_prefs: (user, channel, kind) unique",
    dupPrefErr !== null,
  );

  // --- AI
  const [conv] = await db
    .insert(aiConversations)
    .values({ userId: customer.id, locale: "en" })
    .returning();
  await db.insert(aiMessages).values([
    { conversationId: conv.id, role: "user", content: "Hi" },
    { conversationId: conv.id, role: "assistant", content: "Hello!" },
  ]);
  check("ai_conversations + messages inserted", true);

  await db.insert(aiKb).values({
    category: "pricing",
    question: "How much is cleaning?",
    answer: "Starts at $110 in AU.",
    locale: "en",
  });
  await db.insert(aiEmergencyKeywords).values({
    keyword: KW,
    locale: "en",
    severity: "critical",
  });
  check("ai_kb + emergency_keywords inserted", true);

  let dupKwErr: string | null = null;
  try {
    await db.insert(aiEmergencyKeywords).values({
      keyword: KW,
      locale: "en",
      severity: "high",
    });
  } catch (e) {
    dupKwErr = e instanceof Error ? e.message : String(e);
  }
  check("ai_emergency_keywords: (keyword, locale) unique", dupKwErr !== null);

  // --- Admin
  await db.insert(adminActions).values({
    adminId: adminUser.id,
    action: "provider.approve",
    targetType: "provider",
    targetId: provider.id,
    notes: "Verified docs",
  });
  await db.insert(adminSettings).values([
    {
      key: "phase3.smoke.flag",
      value: { enabled: true } as never,
      updatedBy: adminUser.id,
    },
    {
      key: "phase3.smoke.fee",
      value: { rate: 0.18 } as never,
      updatedBy: adminUser.id,
    },
  ]);
  await db.insert(auditLog).values({
    actorId: adminUser.id,
    actorRole: "admin",
    action: "settings.update",
    targetType: "admin_settings",
    targetId: "phase3.smoke.fee",
    metadata: { from: 0.15, to: 0.18 } as never,
  });
  check("admin_actions + admin_settings + audit_log inserted", true);

  let dupSettingErr: string | null = null;
  try {
    await db.insert(adminSettings).values({
      key: "phase3.smoke.flag",
      value: { enabled: false } as never,
      updatedBy: adminUser.id,
    });
  } catch (e) {
    dupSettingErr = e instanceof Error ? e.message : String(e);
  }
  check("admin_settings: key unique", dupSettingErr !== null);

  // --- Cascade verification: delete booking, expect reviews/disputes/etc gone
  await db.delete(bookings).where(eq(bookings.id, booking.id));
  const [orphanReview] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, review.id));
  const [orphanDispute] = await db
    .select()
    .from(disputes)
    .where(eq(disputes.id, dispute.id));
  check("cascade: review removed when booking deleted", !orphanReview);
  check("cascade: dispute removed when booking deleted", !orphanDispute);

  // Delete customer → notifications + ai_conversations + ai_messages cascade
  await db.delete(users).where(eq(users.id, customer.id));
  const orphanConvs = await db
    .select()
    .from(aiConversations)
    .where(eq(aiConversations.id, conv.id));
  const orphanNotifs = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, customer.id));
  check("cascade: ai_conversations removed with user", orphanConvs.length === 0);
  check("cascade: notifications removed with user", orphanNotifs.length === 0);

  // audit_log retains action even after admin user deleted (actor → SET NULL)
  await db.delete(users).where(eq(users.id, adminUser.id));
  const adminAuditRows = await db
    .select()
    .from(auditLog)
    .where(eq(auditLog.action, "settings.update"));
  // After admin deletion, the audit row still exists (actor_id was set null)
  check(
    "audit_log: rows retained after admin deletion (actor_id SET NULL)",
    adminAuditRows.length > 0,
  );

  await cleanup();

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
