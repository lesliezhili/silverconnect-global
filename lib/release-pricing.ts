/**
 * Release 1 standard price model — every job is one of three effort tiers.
 *
 *   price (ex tax) = hourly rate(country, category) × tier multiplier × hours
 *
 * - Regular: routine upkeep. A fixed package (fixed hours, fixed price) —
 *   never re-quoted on time.
 * - Medium / High: more effort per hour (heavier soiling, overgrown
 *   garden, multi-step handyman jobs). Booked at the tier's minimum hours;
 *   after the first visit the provider may send a quote for later visits
 *   (tier + hours, from the time actually taken). Prices are always
 *   computed from this table — providers never type a rate.
 *
 * Rates are placeholders until confirmed by the business (docs/RELEASE_1.md).
 */
import type { ReleaseCategory, ReleaseCountry } from "./release";

export const EFFORT_TIERS = ["regular", "medium", "high"] as const;
export type EffortTier = (typeof EFFORT_TIERS)[number];

/** Base hourly rate (ex GST), local currency. */
export const HOURLY_RATE: Record<ReleaseCountry, Record<ReleaseCategory, number>> = {
  AU: { cleaning: 55, garden: 60, repair: 65 },
  CA: { cleaning: 60, garden: 65, repair: 70 },
};

export const TIER: Record<EffortTier, { multiplier: number; minHours: number; fixed: boolean }> = {
  regular: { multiplier: 1.0, minHours: 2, fixed: true },
  medium: { multiplier: 1.2, minHours: 3, fixed: false },
  high: { multiplier: 1.4, minHours: 4, fixed: false },
};

/** Longest single visit; bigger jobs are split into several visits. */
export const MAX_VISIT_HOURS = 8;

/** What each tier means, shown to customers when they choose. */
export const TIER_SCOPE: Record<ReleaseCategory, Record<EffortTier, { en: string; zh: string }>> = {
  cleaning: {
    regular: { en: "Routine clean: kitchen benches, bathroom, vacuum & mop, bins", zh: "日常清洁：厨房台面、浴室、吸尘拖地、倒垃圾" },
    medium: { en: "Thorough clean: plus inside microwave, skirting, window sills, heavier soiling", zh: "彻底清洁：另含微波炉内部、踢脚线、窗台、较重污渍" },
    high: { en: "Deep / move-out clean: oven, inside cupboards, built-up grime, long-unattended homes", zh: "深度/退房清洁：烤箱、橱柜内部、积垢、长期未清洁的房屋" },
  },
  garden: {
    regular: { en: "Lawn mowing, edging, light weeding, sweep paths", zh: "割草、修边、少量除草、清扫小路" },
    medium: { en: "Hedge & shrub trimming, garden-bed weeding, green waste bagged", zh: "修剪绿篱灌木、花圃除草、园艺垃圾装袋" },
    high: { en: "Overgrown garden tidy-up, heavy pruning (ground level), large green-waste removal", zh: "杂乱花园整理、地面高度重度修剪、大量园艺垃圾清运" },
  },
  repair: {
    regular: { en: "One small job: hang a picture, fix a handle or hinge, replace a curtain rod", zh: "单项小活：挂画、修门把或合页、更换窗帘杆" },
    medium: { en: "A few jobs or flat-pack assembly (1–2 items)", zh: "几项小活或组装家具（1–2 件）" },
    high: { en: "Several jobs or larger assembly (wardrobe, bed frame, shelving units)", zh: "多项小活或大型组装（衣柜、床架、置物架）" },
  },
};

/**
 * Catalogue row (services.code, scripts/seed-catalog.ts) used as the
 * booking's service_id for each category × tier. Price comes from this
 * file, not the catalogue's service_prices.
 */
export const TIER_SERVICE_CODE: Record<ReleaseCategory, Record<EffortTier, string>> = {
  cleaning: { regular: "cleaning_basic_2h", medium: "cleaning_deep_3h", high: "cleaning_seasonal_4h" },
  garden: { regular: "garden_lawn_1h", medium: "garden_full_3h", high: "garden_full_3h" },
  repair: { regular: "repair_handyman_1h", medium: "repair_handyman_3h", high: "repair_handyman_3h" },
};

export function isEffortTier(t: unknown): t is EffortTier {
  return typeof t === "string" && (EFFORT_TIERS as readonly string[]).includes(t);
}

export function tierHourly(country: ReleaseCountry, category: ReleaseCategory, tier: EffortTier): number {
  return +(HOURLY_RATE[country][category] * TIER[tier].multiplier).toFixed(2);
}

/** Clamp requested hours to the tier rules (regular is always its fixed package). */
export function tierHours(tier: EffortTier, requested?: number): number {
  const t = TIER[tier];
  if (t.fixed || !requested || !Number.isFinite(requested)) return t.minHours;
  const half = Math.ceil(requested * 2) / 2;
  return Math.min(MAX_VISIT_HOURS, Math.max(t.minHours, half));
}

export function priceFor(input: {
  country: ReleaseCountry;
  category: ReleaseCategory;
  tier: EffortTier;
  hours?: number;
  taxRate: number;
}): { hours: number; hourly: number; base: number; tax: number; total: number } {
  const hours = tierHours(input.tier, input.hours);
  const hourly = tierHourly(input.country, input.category, input.tier);
  const base = +(hourly * hours).toFixed(2);
  const tax = +(base * input.taxRate).toFixed(2);
  return { hours, hourly, base, tax, total: +(base + tax).toFixed(2) };
}

/**
 * Quote recommendation after a first visit: keep the tier, set hours to the
 * real time on site (rounded up to 30 min), or step up one tier when the
 * job ran over the tier's maximum.
 */
export function recommendQuote(input: {
  tier: EffortTier;
  bookedMin: number;
  actualMin: number | null;
}): { tier: EffortTier; hours: number; varianceMin: number } {
  const actual = input.actualMin && input.actualMin > 0 ? input.actualMin : input.bookedMin;
  const varianceMin = actual - input.bookedMin;
  let tier = input.tier;
  if (TIER[tier].fixed && varianceMin > 30) tier = "medium";
  if (actual / 60 > MAX_VISIT_HOURS && tier === "medium") tier = "high";
  return { tier, hours: tierHours(tier, actual / 60), varianceMin };
}
