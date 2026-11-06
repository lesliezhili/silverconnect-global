/**
 * Release 1 cancellation policy — fair to both sides, based on notice
 * before the booked start time.
 *
 * Customer cancels (refund tiers live in lib/bookings/cancellation.ts):
 *   AU: ≥48h 100% · 24–48h 50% (50% to provider) · <24h 0% (90% to provider) · no-show 0%
 *   CA: ≥72h 100% · 24–72h 75% · <24h 25% · no-show 0%
 *
 * Provider withdraws from a paid, accepted job: the customer never loses
 * out — the emergency cover team is assigned (same time, same price), or
 * the customer gets a full refund. The provider pays a penalty and gets a
 * strike unless they gave enough notice. Declining an unpaid request is free.
 */
export type ProviderNotice = "provider_48h+" | "provider_<48h" | "provider_<12h" | "provider_declined";

export const PROVIDER_PENALTY: Record<ProviderNotice, number> = {
  "provider_48h+": 0, // enough notice — no penalty, no strike
  "provider_<48h": 0.1, // 10% of the job value + strike
  "provider_<12h": 0.25, // 25% (also once the job has started) + strike
  provider_declined: 0, // never accepted / never paid
};

/** Notice tiers that count as a strike toward the trust pause (TRUST_RULES.maxCancels90d). */
export const PROVIDER_STRIKES: readonly ProviderNotice[] = ["provider_<48h", "provider_<12h"];

export function providerNotice(status: string, scheduledAt: Date, now = new Date()): ProviderNotice {
  if (status === "pending") return "provider_declined";
  if (status === "in_progress") return "provider_<12h";
  const hours = (scheduledAt.getTime() - now.getTime()) / 3_600_000;
  if (hours >= 48) return "provider_48h+";
  if (hours >= 12) return "provider_<48h";
  return "provider_<12h";
}

export function providerPenalty(notice: ProviderNotice, jobTotal: number): number {
  return +(jobTotal * PROVIDER_PENALTY[notice]).toFixed(2);
}
