import "server-only";
import { after } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  providerBackgroundChecks,
  providerProfiles,
} from "@/lib/db/schema/providers";
import { users } from "@/lib/db/schema/users";
import { getBgCheckVendor } from "@/lib/compliance/background-check";

/**
 * Ensure the provider has a current, in-flight background check.
 *
 * - If a current check is already `pending` or `cleared`, this is a no-op
 *   (avoids re-charging the vendor).
 * - Otherwise: supersede any stale current row, insert a fresh `pending` row
 *   synchronously (so the UI shows "in progress" immediately), then fire the
 *   vendor call in the background — recording the vendor ref on success, or
 *   flipping the row to `failed` + `lastError` on failure.
 *
 * Safe to call from a server action (uses `after()` for the vendor call).
 * Concurrent calls collide on the partial unique index and are treated as
 * "already in flight".
 */
export async function startBackgroundCheck(providerId: string): Promise<void> {
  const vendor = getBgCheckVendor();
  let newCheckId: string | null = null;
  try {
    newCheckId = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({
          id: providerBackgroundChecks.id,
          status: providerBackgroundChecks.status,
        })
        .from(providerBackgroundChecks)
        .where(
          and(
            eq(providerBackgroundChecks.providerId, providerId),
            eq(providerBackgroundChecks.isCurrent, true),
          ),
        )
        .limit(1);
      if (current && (current.status === "pending" || current.status === "cleared")) {
        return null;
      }
      if (current) {
        await tx
          .update(providerBackgroundChecks)
          .set({ isCurrent: false, supersededAt: new Date(), updatedAt: new Date() })
          .where(eq(providerBackgroundChecks.id, current.id));
      }
      const [inserted] = await tx
        .insert(providerBackgroundChecks)
        .values({
          providerId,
          vendor: vendor.name,
          status: "pending",
          requestedAt: new Date(),
          isCurrent: true,
        })
        .returning({ id: providerBackgroundChecks.id });
      return inserted?.id ?? null;
    });
  } catch {
    return; // concurrent insert won the race — already in flight
  }
  if (!newCheckId) return;
  const checkId = newCheckId;

  after(async () => {
    const [profile] = await db
      .select({ userId: providerProfiles.userId })
      .from(providerProfiles)
      .where(eq(providerProfiles.id, providerId))
      .limit(1);
    let email = "";
    let name: string | null = null;
    if (profile?.userId) {
      const [u] = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, profile.userId))
        .limit(1);
      email = u?.email ?? "";
      name = u?.name ?? null;
    }
    const result = await vendor.triggerCheck({ providerId, email, name });
    if (result.ok) {
      await db
        .update(providerBackgroundChecks)
        .set({ externalRef: result.externalRef, updatedAt: new Date() })
        .where(eq(providerBackgroundChecks.id, checkId));
    } else {
      await db
        .update(providerBackgroundChecks)
        .set({ status: "failed", lastError: result.error, updatedAt: new Date() })
        .where(eq(providerBackgroundChecks.id, checkId));
    }
  });
}

/**
 * Retry a previously-failed check: clear the failed current row and start a
 * fresh one. If the current row isn't `failed`, falls through to
 * `startBackgroundCheck` (which no-ops if it's pending/cleared).
 */
export async function retryBackgroundCheck(providerId: string): Promise<void> {
  await db
    .update(providerBackgroundChecks)
    .set({ isCurrent: false, supersededAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(providerBackgroundChecks.providerId, providerId),
        eq(providerBackgroundChecks.isCurrent, true),
        eq(providerBackgroundChecks.status, "failed"),
      ),
    );
  await startBackgroundCheck(providerId);
}
