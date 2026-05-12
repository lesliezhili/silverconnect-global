import "server-only";
import { after } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  providerProfiles,
  providerDocuments,
  providerBackgroundChecks,
  providerBadges,
} from "@/lib/db/schema/providers";
import { users } from "@/lib/db/schema/users";
import { requiredDocTypes, requiresAbn } from "@/lib/compliance/country";
import { isConnectPayoutsEnabled } from "@/lib/stripe/connect";
import { notifyAndEmail } from "@/lib/notifications/server";
import { buildProviderApprovalEmail } from "@/components/domain/email";

/**
 * Idempotently re-evaluate a provider's onboarding: if a `docs_review`
 * provider now satisfies every gate for their country (current background
 * check cleared & unexpired, all required docs approved & unexpired, ABN
 * active when required, Stripe Connect payouts enabled), promote them to
 * `approved`, award the `verified` badge, and email them.
 *
 * Safe to call from any "something changed" entry point (background-check
 * webhook, admin document review, Stripe Connect webhook). A no-op unless
 * all conditions hold and the provider is still in `docs_review`.
 */
export async function tryAutoApproveProvider(providerId: string): Promise<void> {
  const [p] = await db
    .select({
      id: providerProfiles.id,
      userId: providerProfiles.userId,
      onboardingStatus: providerProfiles.onboardingStatus,
      stripeAccountId: providerProfiles.stripeAccountId,
      abnActive: providerProfiles.abnActive,
      country: users.country,
    })
    .from(providerProfiles)
    .leftJoin(users, eq(users.id, providerProfiles.userId))
    .where(eq(providerProfiles.id, providerId))
    .limit(1);
  if (!p || p.onboardingStatus !== "docs_review") return;

  const now = Date.now();

  // 1. Current background check must be cleared and not expired.
  const [bg] = await db
    .select({
      status: providerBackgroundChecks.status,
      expiresAt: providerBackgroundChecks.expiresAt,
    })
    .from(providerBackgroundChecks)
    .where(
      and(
        eq(providerBackgroundChecks.providerId, providerId),
        eq(providerBackgroundChecks.isCurrent, true),
      ),
    )
    .limit(1);
  if (!bg || bg.status !== "cleared") return;
  if (bg.expiresAt && bg.expiresAt.getTime() <= now) return;

  // 2. Every required document approved and not expired.
  const need = requiredDocTypes(p.country);
  if (need.length > 0) {
    const docs = await db
      .select({
        type: providerDocuments.type,
        status: providerDocuments.status,
        expiresAt: providerDocuments.expiresAt,
      })
      .from(providerDocuments)
      .where(
        and(
          eq(providerDocuments.providerId, providerId),
          inArray(providerDocuments.type, need),
        ),
      );
    const byType = new Map(docs.map((d) => [d.type, d]));
    for (const t of need) {
      const d = byType.get(t);
      if (!d || d.status !== "approved") return;
      if (d.expiresAt && d.expiresAt.getTime() <= now) return;
    }
  }

  // 3. ABN active when the country requires one.
  if (requiresAbn(p.country) && !p.abnActive) return;

  // 4. Stripe Connect payouts enabled.
  if (!p.stripeAccountId) return;
  const payoutsOk = await isConnectPayoutsEnabled(p.stripeAccountId).catch(() => false);
  if (!payoutsOk) return;

  // Promote — guarded on the status so concurrent callers don't double-fire.
  const promoted = await db
    .update(providerProfiles)
    .set({
      onboardingStatus: "approved",
      approvedAt: new Date(),
      rejectionReason: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(providerProfiles.id, providerId),
        eq(providerProfiles.onboardingStatus, "docs_review"),
      ),
    )
    .returning({ id: providerProfiles.id });
  if (promoted.length === 0) return;

  await db
    .insert(providerBadges)
    .values({ providerId, kind: "verified" })
    .onConflictDoNothing({ target: [providerBadges.providerId, providerBadges.kind] });

  if (p.userId) {
    const userId = p.userId;
    after(async () => {
      const [u] = await db
        .select({ locale: users.locale })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      const userLocale = u?.locale ?? "en";
      await notifyAndEmail({
        userId,
        kind: "system",
        title: "Your provider application is approved",
        link: `/${userLocale}/provider/onboarding-status`,
        email: buildProviderApprovalEmail(
          process.env.NEXT_PUBLIC_APP_URL ?? "",
          userLocale,
          true,
          undefined,
        ),
      });
    });
  }
}
