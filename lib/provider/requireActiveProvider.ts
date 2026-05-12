import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  providerProfiles,
  providerBackgroundChecks,
} from "@/lib/db/schema/providers";

export interface ProviderActiveState {
  providerId: string;
  onboardingStatus: string;
  /** Status of the provider's current background check, if any. */
  bgCheckStatus: string | null;
  /** True iff the provider is approved AND their current check is cleared. */
  active: boolean;
}

/**
 * Look up whether `userId`'s provider profile is "active" — i.e. allowed to
 * receive and accept new jobs. Returns null if the user has no provider
 * profile. This intentionally does NOT redirect: callers decide how to
 * degrade the UI (banner + read-only existing jobs vs. blocking a new
 * `accept` action) so a downgraded provider can still finish work in flight.
 */
export async function getProviderActiveState(
  userId: string,
): Promise<ProviderActiveState | null> {
  const [p] = await db
    .select({
      id: providerProfiles.id,
      onboardingStatus: providerProfiles.onboardingStatus,
    })
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, userId))
    .limit(1);
  if (!p) return null;

  const [bg] = await db
    .select({ status: providerBackgroundChecks.status })
    .from(providerBackgroundChecks)
    .where(
      and(
        eq(providerBackgroundChecks.providerId, p.id),
        eq(providerBackgroundChecks.isCurrent, true),
      ),
    )
    .limit(1);
  const bgCheckStatus = bg?.status ?? null;

  // `approved` is the single source of truth for "live & can take jobs":
  // tryAutoApproveProvider only sets it once the background check is cleared,
  // and the expiry cron flips it back to docs_review when something lapses —
  // so we don't double-check the bg status here (that would also block a
  // legitimately Force-approved provider). bgCheckStatus is returned for UI.
  return {
    providerId: p.id,
    onboardingStatus: p.onboardingStatus,
    bgCheckStatus,
    active: p.onboardingStatus === "approved",
  };
}
