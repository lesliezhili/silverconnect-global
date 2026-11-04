import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { serviceQuotes } from "@/lib/db/schema/bookings";
import { isReleaseCategory } from "@/lib/release";
import { TIER, isEffortTier, type EffortTier } from "@/lib/release-pricing";

/**
 * A quote can follow a completed first job when it was medium/high effort,
 * or a regular job that overran by more than 30 min (a tier upgrade).
 * One quote per booking.
 */
export async function quoteEligibility(job: {
  id: string;
  status: string;
  tier: string | null;
  durationMin: number;
  startedAt: Date | null;
  completedAt: Date | null;
  category: string | null;
}): Promise<
  | { ok: true; fromTier: EffortTier; actualMin: number | null; varianceMin: number }
  | { ok: false; reason: string }
> {
  if (job.status !== "completed" && job.status !== "released") return { ok: false, reason: "not_completed" };
  if (!isReleaseCategory(job.category)) return { ok: false, reason: "category" };
  const fromTier: EffortTier = isEffortTier(job.tier) ? job.tier : "regular";
  const actualMin =
    job.startedAt && job.completedAt
      ? Math.round((job.completedAt.getTime() - job.startedAt.getTime()) / 60000)
      : null;
  const varianceMin = (actualMin ?? job.durationMin) - job.durationMin;
  if (TIER[fromTier].fixed && varianceMin <= 30) return { ok: false, reason: "regular_on_time" };
  const [existing] = await db
    .select({ id: serviceQuotes.id })
    .from(serviceQuotes)
    .where(eq(serviceQuotes.bookingId, job.id))
    .limit(1);
  if (existing) return { ok: false, reason: "exists" };
  return { ok: true, fromTier, actualMin, varianceMin };
}
