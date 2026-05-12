import { NextResponse, type NextRequest } from "next/server";
import { and, eq, lte, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  providerDocuments,
  providerBackgroundChecks,
  providerProfiles,
  complianceExpiryAlerts,
} from "@/lib/db/schema/providers";
import { users } from "@/lib/db/schema/users";
import { auditLog } from "@/lib/db/schema/admin";
import { verifyCronAuth } from "@/lib/cron/auth";
import { notify } from "@/lib/notifications/server";
import { notifyAdmins } from "@/lib/notifications/admins";
import { requiredDocTypes } from "@/lib/compliance/country";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Daily compliance-expiry sweep:
 *  - 30 days out: warn the provider (+ admins). Deduped via
 *    `complianceExpiryAlerts` so re-runs don't re-send.
 *  - past expiry: mark the document / background check `expired`, and if the
 *    provider is `approved` and an expired item is required for their
 *    country, move them back to `docs_review` (recorded in `audit_log`) so
 *    they're hidden from search/booking until renewed.
 *
 * Invoke from VPS cron with `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(req: NextRequest) {
  const fail = verifyCronAuth(req);
  if (fail) return fail;

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * DAY_MS);

  let alertsSent = 0;
  let expiredMarked = 0;
  let downgraded = 0;

  async function alertOnce(
    subjectType: "provider_document" | "background_check",
    subjectId: string,
    expiresAt: Date,
    providerId: string,
    providerUserId: string | null,
    label: string,
    isExpired: boolean,
  ): Promise<void> {
    const inserted = await db
      .insert(complianceExpiryAlerts)
      .values({ subjectType, subjectId, expiresAt })
      .onConflictDoNothing({
        target: [
          complianceExpiryAlerts.subjectType,
          complianceExpiryAlerts.subjectId,
          complianceExpiryAlerts.expiresAt,
        ],
      })
      .returning({ id: complianceExpiryAlerts.id });
    if (inserted.length === 0) return; // already alerted for this date
    alertsSent++;
    const on = expiresAt.toISOString().slice(0, 10);
    const title = isExpired ? `Your ${label} has expired` : `Your ${label} expires soon`;
    const body = isExpired
      ? `Your ${label} expired on ${on}. Renew it to stay active on SilverConnect.`
      : `Your ${label} expires on ${on}. Please renew it within 30 days to avoid interruption.`;
    if (providerUserId) {
      await notify({
        userId: providerUserId,
        kind: "system",
        title,
        body,
        link: "/provider/compliance",
      });
    }
    await notifyAdmins({
      title: `Provider ${label} ${isExpired ? "expired" : "expiring"}`,
      body: `${label} for provider ${providerId} ${isExpired ? "expired" : "expires"} ${on}.`,
      link: `/admin/providers/${providerId}`,
    });
  }

  async function downgradeIfApproved(
    providerId: string,
    providerUserId: string | null,
    label: string,
  ): Promise<void> {
    const res = await db
      .update(providerProfiles)
      .set({ onboardingStatus: "docs_review", updatedAt: new Date() })
      .where(
        and(
          eq(providerProfiles.id, providerId),
          eq(providerProfiles.onboardingStatus, "approved"),
        ),
      )
      .returning({ id: providerProfiles.id });
    if (res.length === 0) return;
    downgraded++;
    await db.insert(auditLog).values({
      action: "provider.compliance_expired",
      targetType: "provider_profile",
      targetId: providerId,
      metadata: { reason: label },
    });
    if (providerUserId) {
      await notify({
        userId: providerUserId,
        kind: "system",
        title: "Your provider account is paused — compliance expired",
        body: `Your ${label} expired. Renew it from your compliance page and we'll re-review your account.`,
        link: "/provider/onboarding-status",
      });
    }
    await notifyAdmins({
      title: `Provider paused — ${label} expired`,
      body: `Provider ${providerId} was moved back to docs_review.`,
      link: `/admin/providers/${providerId}`,
    });
  }

  // 1. Documents nearing or past expiry.
  const docs = await db
    .select({
      id: providerDocuments.id,
      type: providerDocuments.type,
      expiresAt: providerDocuments.expiresAt,
      status: providerDocuments.status,
      providerId: providerDocuments.providerId,
      providerUserId: providerProfiles.userId,
      providerStatus: providerProfiles.onboardingStatus,
      providerCountry: users.country,
    })
    .from(providerDocuments)
    .innerJoin(providerProfiles, eq(providerProfiles.id, providerDocuments.providerId))
    .leftJoin(users, eq(users.id, providerProfiles.userId))
    .where(
      and(isNotNull(providerDocuments.expiresAt), lte(providerDocuments.expiresAt, in30)),
    );
  for (const d of docs) {
    if (!d.expiresAt) continue;
    const label = "compliance document";
    if (d.expiresAt.getTime() <= now.getTime()) {
      if (d.status !== "expired") {
        await db
          .update(providerDocuments)
          .set({ status: "expired", updatedAt: new Date() })
          .where(eq(providerDocuments.id, d.id));
        expiredMarked++;
      }
      await alertOnce("provider_document", d.id, d.expiresAt, d.providerId, d.providerUserId, label, true);
      const required = requiredDocTypes(d.providerCountry) as readonly string[];
      if (required.includes(d.type) && d.providerStatus === "approved") {
        await downgradeIfApproved(d.providerId, d.providerUserId, label);
      }
    } else {
      await alertOnce("provider_document", d.id, d.expiresAt, d.providerId, d.providerUserId, label, false);
    }
  }

  // 2. Current background checks nearing or past expiry.
  const bgs = await db
    .select({
      id: providerBackgroundChecks.id,
      expiresAt: providerBackgroundChecks.expiresAt,
      status: providerBackgroundChecks.status,
      providerId: providerBackgroundChecks.providerId,
      providerUserId: providerProfiles.userId,
      providerStatus: providerProfiles.onboardingStatus,
    })
    .from(providerBackgroundChecks)
    .innerJoin(providerProfiles, eq(providerProfiles.id, providerBackgroundChecks.providerId))
    .where(
      and(
        eq(providerBackgroundChecks.isCurrent, true),
        isNotNull(providerBackgroundChecks.expiresAt),
        lte(providerBackgroundChecks.expiresAt, in30),
      ),
    );
  for (const b of bgs) {
    if (!b.expiresAt) continue;
    const label = "background check";
    if (b.expiresAt.getTime() <= now.getTime()) {
      if (b.status !== "expired") {
        await db
          .update(providerBackgroundChecks)
          .set({ status: "expired", updatedAt: new Date() })
          .where(eq(providerBackgroundChecks.id, b.id));
        expiredMarked++;
      }
      await alertOnce("background_check", b.id, b.expiresAt, b.providerId, b.providerUserId, label, true);
      if (b.providerStatus === "approved") {
        await downgradeIfApproved(b.providerId, b.providerUserId, label);
      }
    } else {
      await alertOnce("background_check", b.id, b.expiresAt, b.providerId, b.providerUserId, label, false);
    }
  }

  return NextResponse.json({ ok: true, alertsSent, expiredMarked, downgraded });
}
