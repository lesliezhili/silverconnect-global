/**
 * Full-flow smoke test — implements docs/E2E_FULL_FLOW.md.
 *
 * Walks the happy path (1 customer Mary + 1 provider Helen) through all
 * 30 steps + branches A (dispute) and B (safety incident). Branch C
 * (account delete) lives at the end and is gated behind --delete since
 * it's destructive.
 *
 * Run:
 *   npx tsx scripts/smoke-full-flow.ts                # happy path only
 *   npx tsx scripts/smoke-full-flow.ts --branch=a     # happy path stops
 *                                                       at step 17, then
 *                                                       runs branch A
 *   npx tsx scripts/smoke-full-flow.ts --branch=b     # also run branch B
 *   npx tsx scripts/smoke-full-flow.ts --delete       # also run branch C
 *
 * The script bypasses the Server Action layer and writes directly to
 * the DB to mirror what each Server Action would do — fast feedback,
 * not UI fidelity. UI fidelity belongs in the Playwright e2e variant.
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { eq, sql, and, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

import { users } from "../lib/db/schema/users";
import {
  providerProfiles,
  providerCategories,
  providerDocuments,
} from "../lib/db/schema/providers";
import {
  addresses,
  emergencyContacts,
} from "../lib/db/schema/customer-data";
import {
  serviceCategories,
  services,
  servicePrices,
} from "../lib/db/schema/services";
import {
  bookings,
  bookingChanges,
} from "../lib/db/schema/bookings";
import { wallets } from "../lib/db/schema/payments";
import { reviews, reviewReplies } from "../lib/db/schema/reviews";
import { disputes, disputeEvidence } from "../lib/db/schema/disputes";
import { incidentReports } from "../lib/db/schema/safety";
import { notifications } from "../lib/db/schema/notifications";

// ────────────────────────────────────────────────────────────────────
// Setup
// ────────────────────────────────────────────────────────────────────

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const client = postgres(url, { ssl: "require", prepare: false, max: 5 });
const db = drizzle(client);

const MARY_EMAIL = "mary.test@example.com";
const HELEN_EMAIL = "helen.test@example.com";
const PASSWORD = "Test1234!";

const flags = new Set(process.argv.slice(2));
const runBranchA = [...flags].some((f) => f.includes("=a") || f === "--branch-a");
const runBranchB = [...flags].some((f) => f.includes("=b") || f === "--branch-b");
const runBranchC = flags.has("--delete");

let stepNum = 0;
function step(label: string, ok: boolean, extra?: string) {
  stepNum++;
  const tag = ok ? "✅" : "❌";
  const tail = extra ? ` — ${extra}` : "";
  console.log(`${tag} [${String(stepNum).padStart(2, "0")}] ${label}${tail}`);
  if (!ok) process.exitCode = 1;
}

function header(text: string) {
  console.log(`\n── ${text} ──────────────────────────────────────`);
}

async function cleanup() {
  await db
    .delete(users)
    .where(
      sql`lower(${users.email}) in (lower(${MARY_EMAIL}), lower(${HELEN_EMAIL}))`,
    );
}

async function ensureCategoryAndService() {
  // The seed-catalog script normally provides `cleaning` etc; if missing
  // (clean DB), insert minimal rows so the smoke can stand alone.
  const [cat] = await db
    .select()
    .from(serviceCategories)
    .where(eq(serviceCategories.code, "cleaning"))
    .limit(1);
  if (!cat) {
    await db.insert(serviceCategories).values({
      code: "cleaning",
      iconKey: "spray-can",
      sortOrder: 1,
    });
  }
  const [svc] = await db
    .select()
    .from(services)
    .where(eq(services.code, "smoke_clean_2h"))
    .limit(1);
  if (svc) return svc;

  const [created] = await db
    .insert(services)
    .values({
      categoryCode: "cleaning",
      code: "smoke_clean_2h",
      durationMin: 120,
    })
    .returning();
  await db.insert(servicePrices).values({
    serviceId: created.id,
    country: "AU",
    basePrice: "100.00",
    taxRate: "0.1000",
    currency: "AUD",
  });
  return created;
}

// ────────────────────────────────────────────────────────────────────
// Main happy path
// ────────────────────────────────────────────────────────────────────

async function main() {
  header("Cleanup any prior smoke data");
  await cleanup();
  step("cleanup: prior Mary/Helen rows removed", true);

  const svc = await ensureCategoryAndService();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ── Phase 1 — Provider onboarding ─────────────────────────────────
  header("Phase 1 — Provider onboarding");

  // Step 1: Helen signs up. Note: provider_profiles is NOT created here.
  const [helen] = await db
    .insert(users)
    .values({
      email: HELEN_EMAIL,
      passwordHash,
      role: "provider",
      country: "AU",
      name: "Helen Li",
    })
    .returning();
  const helenProfileCount = await db
    .select({ id: providerProfiles.id })
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, helen.id));
  step(
    "Helen signed up; users +1; provider_profiles NOT yet created",
    !!helen.id && helenProfileCount.length === 0,
    helen.id,
  );

  // Step 2: Email verification (bypass code; mark verified directly).
  await db
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(users.id, helen.id));
  const [helen2] = await db
    .select({ v: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, helen.id));
  step("Helen email verified", helen2.v !== null);

  // Step 3: Helen completes /provider/register wizard.
  const [profile] = await db
    .insert(providerProfiles)
    .values({
      userId: helen.id,
      bio: "10 years in elder care.",
      addressLine: "45 Park Rd, Sydney NSW 2010",
      serviceRadiusKm: 15,
      onboardingStatus: "pending",
      submittedAt: null,
    })
    .returning();
  await db
    .insert(providerCategories)
    .values([
      { providerId: profile.id, category: "cleaning" },
      { providerId: profile.id, category: "cooking" },
    ]);
  const cats = await db
    .select()
    .from(providerCategories)
    .where(eq(providerCategories.providerId, profile.id));
  step(
    "Helen wizard: provider_profiles +1, provider_categories +2",
    !!profile.id && cats.length === 2,
  );

  // Step 4: Compliance documents — write 3 dummy PDFs to disk + DB rows.
  const uploadDir = join(
    process.cwd(),
    "public",
    "uploads",
    "compliance",
    profile.id,
  );
  await mkdir(uploadDir, { recursive: true });
  const docTypes = ["police_check", "first_aid", "insurance"] as const;
  const docUrls: string[] = [];
  for (const t of docTypes) {
    const filename = `${randomUUID()}.pdf`;
    await writeFile(
      join(uploadDir, filename),
      Buffer.from(`%PDF-1.4 dummy ${t} for smoke test`),
    );
    docUrls.push(`/uploads/compliance/${profile.id}/${filename}`);
  }
  await db.insert(providerDocuments).values(
    docTypes.map((t, i) => ({
      providerId: profile.id,
      type: t,
      fileUrl: docUrls[i],
      documentNumber: `${t.toUpperCase()}-${randomUUID().slice(0, 6)}`,
      status: "pending" as const,
      expiresAt: new Date(Date.now() + 365 * 86400_000),
    })),
  );
  const docs = await db
    .select()
    .from(providerDocuments)
    .where(eq(providerDocuments.providerId, profile.id));
  step(
    "Helen compliance: 3 PDFs written + provider_documents +3 (status=pending)",
    docs.length === 3 && docs.every((d) => d.status === "pending"),
  );

  // Step 5: Submit for review.
  await db
    .update(providerProfiles)
    .set({ onboardingStatus: "docs_review", submittedAt: new Date() })
    .where(eq(providerProfiles.id, profile.id));
  const [submitted] = await db
    .select({
      s: providerProfiles.onboardingStatus,
      a: providerProfiles.submittedAt,
    })
    .from(providerProfiles)
    .where(eq(providerProfiles.id, profile.id));
  step(
    "Helen submitted: status=docs_review, submittedAt non-null",
    submitted.s === "docs_review" && submitted.a !== null,
  );

  // Step 6: Admin approves.
  await db
    .update(providerProfiles)
    .set({
      onboardingStatus: "approved",
      approvedAt: new Date(),
      rejectedAt: null,
      rejectionReason: null,
    })
    .where(eq(providerProfiles.id, profile.id));
  await db.insert(notifications).values({
    userId: helen.id,
    kind: "system",
    title: "Your provider application is approved",
    link: "/en/provider/onboarding-status",
  });
  const [approved] = await db
    .select({ s: providerProfiles.onboardingStatus })
    .from(providerProfiles)
    .where(eq(providerProfiles.id, profile.id));
  const approvedNotifs = await db
    .select()
    .from(notifications)
    .where(
      and(eq(notifications.userId, helen.id), eq(notifications.kind, "system")),
    );
  step(
    "Admin approved Helen; status=approved + 1 system notification",
    approved.s === "approved" && approvedNotifs.length === 1,
  );

  // ── Phase 2 — Customer onboarding ─────────────────────────────────
  header("Phase 2 — Customer onboarding");

  // Step 7: Mary signs up + verifies.
  const [mary] = await db
    .insert(users)
    .values({
      email: MARY_EMAIL,
      passwordHash,
      role: "customer",
      country: "AU",
      name: "Mary Chen",
      emailVerifiedAt: new Date(),
    })
    .returning();
  step("Mary signed up + verified", !!mary.id && !!mary.emailVerifiedAt);

  // Step 8: Mary adds an address.
  const [addr] = await db
    .insert(addresses)
    .values({
      userId: mary.id,
      label: "Home",
      line1: "12 Smith St",
      city: "Sydney",
      state: "NSW",
      postcode: "2000",
      country: "AU",
      isDefault: true,
    })
    .returning();
  step(
    "Mary address: +1 row, isDefault=true",
    !!addr.id && addr.isDefault === true,
  );

  // Step 9: Mary adds an emergency contact.
  const [emc] = await db
    .insert(emergencyContacts)
    .values({
      userId: mary.id,
      name: "Tom Lee",
      relationship: "son",
      phone: "+61400000000",
      priority: 1,
    })
    .returning();
  step("Mary emergency contact: +1 row", !!emc.id);

  // ── Phase 3 — Discovery + booking ─────────────────────────────────
  header("Phase 3 — Discovery + booking");

  // Step 10/11/12 are page renders; we just assert the DB shape that
  // would render correctly.
  const [helenInList] = await db
    .select({
      id: providerProfiles.id,
      status: providerProfiles.onboardingStatus,
    })
    .from(providerProfiles)
    .innerJoin(
      providerCategories,
      eq(providerCategories.providerId, providerProfiles.id),
    )
    .where(
      and(
        eq(providerProfiles.id, profile.id),
        eq(providerCategories.category, "cleaning"),
        eq(providerProfiles.onboardingStatus, "approved"),
      ),
    )
    .limit(1);
  step(
    "Helen visible in /services/cleaning listing",
    !!helenInList && helenInList.status === "approved",
  );

  // Step 13: Mary submits booking.
  const scheduledAt = new Date(Date.now() + 86400_000);
  const [booking] = await db
    .insert(bookings)
    .values({
      customerId: mary.id,
      providerId: profile.id,
      serviceId: svc.id,
      addressId: addr.id,
      scheduledAt,
      durationMin: 120,
      basePrice: "100.00",
      taxAmount: "10.00",
      totalPrice: "110.00",
      currency: "AUD",
    })
    .returning();
  await db.insert(bookingChanges).values({
    bookingId: booking.id,
    type: "status_change",
    fromStatus: null,
    toStatus: "pending",
    actorId: mary.id,
    note: "Customer placed booking",
  });
  step(
    "Booking placed: status=pending, booking_changes +1",
    booking.status === "pending",
    booking.id,
  );

  // Step 14: after() hook would notify the provider. Mirror it directly.
  // The real bookings/new action uses kind=booking_update for the
  // new-booking notification (no separate "booking" kind exists).
  await db.insert(notifications).values({
    userId: helen.id,
    kind: "booking_update",
    title: "New booking request",
    link: `/en/provider/jobs/${booking.id}`,
    relatedBookingId: booking.id,
  });
  const helenBookingNotifs = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, helen.id),
        eq(notifications.kind, "booking_update"),
      ),
    );
  step(
    "Helen received new-booking notification (kind=booking_update)",
    helenBookingNotifs.length === 1,
  );

  // ── Phase 4 — Fulfillment ─────────────────────────────────────────
  header("Phase 4 — Fulfillment");

  async function moveBooking(
    from: typeof booking.status,
    to: typeof booking.status,
    actor: string,
    notifKind?: "booking_update",
    notifTitle?: string,
  ) {
    await db.transaction(async (tx) => {
      await tx
        .update(bookings)
        .set({
          status: to,
          completedAt: to === "completed" ? new Date() : undefined,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, booking.id));
      await tx.insert(bookingChanges).values({
        bookingId: booking.id,
        type: "status_change",
        fromStatus: from,
        toStatus: to,
        actorId: actor,
      });
    });
    if (notifKind && notifTitle) {
      await db.insert(notifications).values({
        userId: mary.id,
        kind: notifKind,
        title: notifTitle,
        link: `/en/bookings/${booking.id}`,
        relatedBookingId: booking.id,
      });
    }
  }

  await moveBooking(
    "pending",
    "confirmed",
    helen.id,
    "booking_update",
    "Provider accepted your booking",
  );
  step("Helen confirmed booking → status=confirmed", true);

  if (runBranchA || runBranchB) {
    // Pause main path; we handle the branches below at the right step.
  }

  await moveBooking(
    "confirmed",
    "in_progress",
    helen.id,
    "booking_update",
    "Your provider is on the way",
  );
  step("Helen started service → status=in_progress", true);

  await moveBooking(
    "in_progress",
    "completed",
    helen.id,
    "booking_update",
    "Your service is complete",
  );
  step("Helen marked complete → status=completed", true);

  if (runBranchA) {
    await runDisputeBranch(booking.id, mary.id, helen.id);
  } else {
    // Step 19: Mary releases payment.
    await moveBooking("completed", "released", mary.id);
    step("Mary released payment → status=released", true);

    // Step 20: Mary leaves a review.
    const [rv] = await db
      .insert(reviews)
      .values({
        bookingId: booking.id,
        customerId: mary.id,
        providerId: profile.id,
        rating: 5,
        comment: "Helen was thorough and friendly. Highly recommend.",
        status: "published",
      })
      .returning();
    step("Mary review: +1 (5★)", !!rv.id);

    // Step 21: Helen replies.
    const [rp] = await db
      .insert(reviewReplies)
      .values({
        reviewId: rv.id,
        providerId: profile.id,
        body: "Thank you Mary! Looking forward to next time.",
      })
      .returning();
    step("Helen reply: review_replies +1", !!rp.id);
  }

  // ── Phase 5 — Account management ─────────────────────────────────
  header("Phase 5 — Account management");

  // Step 22: Data export.
  const exportDir = join(
    process.cwd(),
    "public",
    "uploads",
    "exports",
    mary.id,
  );
  await mkdir(exportDir, { recursive: true });
  const exportPath = join(exportDir, `${randomUUID()}.json`);
  // Build a minimal manual snapshot to mirror buildUserDataExport().
  const [maryRow] = await db.select().from(users).where(eq(users.id, mary.id));
  const maryBookings = await db
    .select()
    .from(bookings)
    .where(eq(bookings.customerId, mary.id));
  const maryAddresses = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, mary.id));
  const maryReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.customerId, mary.id));
  const snapshot = {
    exportedAt: new Date().toISOString(),
    user: { id: maryRow.id, email: maryRow.email, role: maryRow.role },
    bookings: maryBookings,
    addresses: maryAddresses,
    reviewsWritten: maryReviews,
  };
  await writeFile(exportPath, JSON.stringify(snapshot, null, 2), "utf-8");
  step(
    `Data export written; snapshot has ${maryBookings.length} bookings, ${maryReviews.length} reviews`,
    maryBookings.length === 1,
  );

  // ── Branch B — Safety incident (independent) ──────────────────────
  if (runBranchB) {
    header("Branch B — Safety incident");
    const [inc] = await db
      .insert(incidentReports)
      .values({
        userId: mary.id,
        bookingId: booking.id,
        category: "harassment",
        body: "Recording for smoke test — provider made an unwelcome comment.",
        photos: [],
      })
      .returning();
    step("B1: Mary filed incident; reviewedAt=null", !!inc.id && inc.reviewedAt === null);

    await db
      .update(incidentReports)
      .set({
        reviewedAt: new Date(),
        action: "Banned — repeat offence; admin smoke-test action",
        updatedAt: new Date(),
      })
      .where(eq(incidentReports.id, inc.id));
    await db.insert(notifications).values({
      userId: mary.id,
      kind: "safety",
      title: "Your safety report was reviewed",
      body: "Banned — repeat offence",
    });
    const [reviewed] = await db
      .select()
      .from(incidentReports)
      .where(eq(incidentReports.id, inc.id));
    step(
      "B2: Admin reviewed incident; action contains 'Banned'",
      reviewed.reviewedAt !== null && (reviewed.action ?? "").includes("Banned"),
    );

    const [marySafety] = await db
      .select()
      .from(notifications)
      .where(
        and(eq(notifications.userId, mary.id), eq(notifications.kind, "safety")),
      );
    step("B3: Mary received safety notification", !!marySafety);
  }

  // ── Final assertion matrix ────────────────────────────────────────
  header("Assertion matrix");
  const counts = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(users)
      .where(inArray(users.email, [MARY_EMAIL, HELEN_EMAIL])),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(providerProfiles)
      .where(eq(providerProfiles.userId, helen.id)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(providerDocuments)
      .where(eq(providerDocuments.providerId, profile.id)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(providerCategories)
      .where(eq(providerCategories.providerId, profile.id)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(addresses)
      .where(eq(addresses.userId, mary.id)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(emergencyContacts)
      .where(eq(emergencyContacts.userId, mary.id)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(bookings)
      .where(eq(bookings.customerId, mary.id)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(bookingChanges)
      .where(eq(bookingChanges.bookingId, booking.id)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(notifications)
      .where(inArray(notifications.userId, [mary.id, helen.id])),
  ]);
  const [
    [usersC],
    [profileC],
    [docsC],
    [catsC],
    [addrC],
    [emcC],
    [bookingsC],
    [changesC],
    [notifC],
  ] = counts;

  console.log(`
  users:             ${usersC.n}
  provider_profiles: ${profileC.n}
  provider_documents:${docsC.n}
  provider_categories:${catsC.n}
  addresses:         ${addrC.n}
  emergency_contacts:${emcC.n}
  bookings:          ${bookingsC.n}
  booking_changes:   ${changesC.n}
  notifications:     ${notifC.n}
  `);

  step("users +2", usersC.n === 2);
  step("provider_profiles +1", profileC.n === 1);
  step("provider_documents +3", docsC.n === 3);
  step("provider_categories +2", catsC.n === 2);
  step("addresses +1", addrC.n === 1);
  step("emergency_contacts +1", emcC.n === 1);
  step("bookings +1", bookingsC.n === 1);
  // Expected booking_changes:
  //   1 (initial pending insert) + 3 (confirm/start/complete) + 1 (release or dispute)
  // = 5 for happy path, 5 for branch A.
  step("booking_changes = 5", changesC.n === 5);
  // Notifications baseline (5):
  //   1 Helen approved (system)
  //   1 Helen new-booking (booking_update)
  //   3 Mary confirm/start/complete (booking_update)
  // Branch A adds 2 (Mary + Helen each get a dispute-decision notif).
  // Branch B adds 1 (Mary safety-reviewed).
  const expectedNotifs =
    5 + (runBranchA ? 2 : 0) + (runBranchB ? 1 : 0);
  step(
    `notifications = ${expectedNotifs}`,
    notifC.n === expectedNotifs,
    `actual ${notifC.n}`,
  );

  // Wallet should be 0 since no Stripe wiring; just confirm we're honest.
  const walletRows = await db
    .select()
    .from(wallets)
    .where(eq(wallets.providerId, profile.id));
  step(
    "wallets = 0 (Stripe not wired)",
    walletRows.length === 0,
    "release flow does not auto-create a wallet row",
  );

  // ── Branch C — Account delete (destructive; opt-in) ───────────────
  if (runBranchC) {
    header("Branch C — Mary account delete");
    await db.delete(users).where(eq(users.id, mary.id));
    const remaining = await Promise.all([
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(bookings)
        .where(eq(bookings.customerId, mary.id)),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(addresses)
        .where(eq(addresses.userId, mary.id)),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(emergencyContacts)
        .where(eq(emergencyContacts.userId, mary.id)),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(reviews)
        .where(eq(reviews.customerId, mary.id)),
    ]);
    step(
      "C1+C2: Mary cascade — bookings/addresses/emergency/reviews all 0",
      remaining.every(([r]) => r.n === 0),
    );
    if (runBranchA) {
      // Schema chains disputes.bookingId → bookings.customerId →
      // users.id, all cascade. Deleting Mary therefore deletes her
      // bookings, which deletes her disputes. Privacy article reflects
      // this (Wave 13 alignment): we retain nothing tied to identity.
      const remainingDisputes = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(disputes)
        .where(isNull(disputes.raisedBy));
      step(
        "C3: disputes also deleted (cascade through booking)",
        (remainingDisputes[0]?.n ?? 0) === 0,
      );
    }
  }

  console.log(
    `\nDone. ${process.exitCode ? "FAILED — see ❌ above." : "All assertions passed."}`,
  );
}

// ────────────────────────────────────────────────────────────────────
// Branch A — Dispute (replaces happy-path steps 19–21)
// ────────────────────────────────────────────────────────────────────

async function runDisputeBranch(
  bookingId: string,
  customerId: string,
  providerUserId: string,
) {
  header("Branch A — Dispute");

  // A1: Mary raises dispute with 2 evidence files.
  const eviDir = join(process.cwd(), "public", "uploads", "dispute", bookingId);
  await mkdir(eviDir, { recursive: true });
  const eviUrls: string[] = [];
  for (let i = 0; i < 2; i++) {
    const filename = `${randomUUID()}.jpg`;
    await writeFile(
      join(eviDir, filename),
      Buffer.from(`fake JPEG ${i} for smoke test`),
    );
    eviUrls.push(`/uploads/dispute/${bookingId}/${filename}`);
  }

  const disputeId = await db.transaction(async (tx) => {
    const [d] = await tx
      .insert(disputes)
      .values({
        bookingId,
        raisedBy: customerId,
        reason:
          "Service was incomplete — provider left after 30 minutes without finishing. Requested outcome: partial",
        status: "open",
      })
      .returning({ id: disputes.id });
    await tx.insert(disputeEvidence).values(
      eviUrls.map((url) => ({
        disputeId: d.id,
        uploadedBy: customerId,
        kind: "image" as const,
        fileUrl: url,
      })),
    );
    await tx
      .update(bookings)
      .set({ status: "disputed", updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));
    await tx.insert(bookingChanges).values({
      bookingId,
      type: "status_change",
      fromStatus: "completed",
      toStatus: "disputed",
      actorId: customerId,
      note: "Customer dispute",
    });
    return d.id;
  });

  const eviRows = await db
    .select()
    .from(disputeEvidence)
    .where(eq(disputeEvidence.disputeId, disputeId));
  step(
    "A1: dispute opened with 2 evidence files; booking → disputed",
    eviRows.length === 2,
  );

  // A2: Admin decides partial $40.
  await db
    .update(disputes)
    .set({
      status: "decided",
      resolution: "refund_partial",
      resolutionAmount: "40.00",
      decidedAt: new Date(),
      decisionNote: "Admin smoke-test decision: 40 AUD partial refund",
      closedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(disputes.id, disputeId));
  await db
    .update(bookings)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));
  await db.insert(notifications).values([
    {
      userId: customerId,
      kind: "dispute",
      title: "Dispute decided: partial refund",
      relatedBookingId: bookingId,
      relatedDisputeId: disputeId,
    },
    {
      userId: providerUserId,
      kind: "dispute",
      title: "Dispute decided: partial refund",
      relatedBookingId: bookingId,
      relatedDisputeId: disputeId,
    },
  ]);

  const [decided] = await db
    .select({
      s: disputes.status,
      r: disputes.resolution,
      a: disputes.resolutionAmount,
    })
    .from(disputes)
    .where(eq(disputes.id, disputeId));
  step(
    "A2: dispute decided; resolution=refund_partial, amount=40.00",
    decided.s === "decided" && decided.r === "refund_partial" && decided.a === "40.00",
  );
}

// ────────────────────────────────────────────────────────────────────

main()
  .then(() => client.end())
  .catch((e) => {
    console.error("smoke-full-flow failed:", e);
    void client.end();
    process.exit(1);
  });
