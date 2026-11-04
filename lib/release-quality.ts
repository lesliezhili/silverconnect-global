/**
 * Release 1 quality control and trust rules.
 *
 * Proven evidence: every job needs a before AND an after photo (or short
 * video) of each required area for its category, plus the provider ticks
 * the job checklist before completing. Enforced server-side in the
 * provider job actions; the customer sees before/after side by side and
 * confirms (or disputes) before the payout is released.
 *
 * Trust: providers and customers who fall below these thresholds are
 * paused (not banned) — matching skips them and an admin reviews. A pair
 * where either side rated the other ≤ 2★ is never matched again.
 */
import type { ReleaseCategory } from "./release";
import type { EffortTier } from "./release-pricing";

export interface QcArea {
  key: string;
  en: string;
  zh: string;
}

/** Areas that need before + after evidence, per category. */
export const QC_AREAS: Record<ReleaseCategory, readonly QcArea[]> = {
  cleaning: [
    { key: "kitchen", en: "Kitchen", zh: "厨房" },
    { key: "bathroom", en: "Bathroom", zh: "浴室" },
    { key: "living", en: "Living area & floors", zh: "客厅及地面" },
  ],
  garden: [
    { key: "front", en: "Front garden / lawn", zh: "前院 / 草坪" },
    { key: "back", en: "Back garden", zh: "后院" },
  ],
  repair: [{ key: "job", en: "The job area", zh: "施工位置" }],
};

/** Checklist the provider must tick before completing, per category × tier. */
export const QC_CHECKLIST: Record<ReleaseCategory, Record<EffortTier, readonly QcArea[]>> = {
  cleaning: {
    regular: [
      { key: "benches", en: "Kitchen benches & sink wiped", zh: "厨房台面和水槽已擦净" },
      { key: "bathroom", en: "Toilet, basin & shower cleaned", zh: "马桶、洗手盆和淋浴已清洁" },
      { key: "floors", en: "Floors vacuumed & mopped", zh: "地面已吸尘拖地" },
      { key: "bins", en: "Bins emptied", zh: "垃圾已清倒" },
    ],
    medium: [
      { key: "benches", en: "Kitchen benches, sink & microwave inside", zh: "厨房台面、水槽和微波炉内部" },
      { key: "bathroom", en: "Bathroom incl. tiles & grout spots", zh: "浴室含瓷砖和缝隙污渍" },
      { key: "floors", en: "Floors, skirting & window sills", zh: "地面、踢脚线和窗台" },
      { key: "bins", en: "Bins emptied", zh: "垃圾已清倒" },
    ],
    high: [
      { key: "oven", en: "Oven & stovetop degreased", zh: "烤箱和炉灶已除油" },
      { key: "cupboards", en: "Inside cupboards wiped", zh: "橱柜内部已擦拭" },
      { key: "bathroom", en: "Bathroom descaled", zh: "浴室已除水垢" },
      { key: "floors", en: "All floors, skirting & sills", zh: "所有地面、踢脚线和窗台" },
    ],
  },
  garden: {
    regular: [
      { key: "mow", en: "Lawn mowed & edged", zh: "草坪已修剪并修边" },
      { key: "paths", en: "Paths swept", zh: "小路已清扫" },
    ],
    medium: [
      { key: "trim", en: "Hedges & shrubs trimmed (ground level)", zh: "绿篱灌木已修剪（地面高度）" },
      { key: "weed", en: "Garden beds weeded", zh: "花圃已除草" },
      { key: "waste", en: "Green waste bagged / in green bin", zh: "园艺垃圾已装袋或入绿色垃圾桶" },
    ],
    high: [
      { key: "tidy", en: "Overgrown areas cleared", zh: "杂乱区域已清理" },
      { key: "prune", en: "Heavy pruning done (ground level only)", zh: "重度修剪完成（仅地面高度）" },
      { key: "waste", en: "Green waste removed or bagged", zh: "园艺垃圾已清运或装袋" },
    ],
  },
  repair: {
    regular: [
      { key: "done", en: "Job done as described", zh: "已按描述完成" },
      { key: "tested", en: "Tested working (doors close, items secure)", zh: "已测试可用（门可关闭、物品牢固）" },
      { key: "clean", en: "Work area cleaned up", zh: "施工区域已清理" },
    ],
    medium: [
      { key: "done", en: "All listed jobs done", zh: "所列项目已全部完成" },
      { key: "tested", en: "Tested working / stable", zh: "已测试可用 / 稳固" },
      { key: "clean", en: "Packaging & debris removed", zh: "包装和碎屑已清理" },
    ],
    high: [
      { key: "done", en: "All listed jobs done", zh: "所列项目已全部完成" },
      { key: "tested", en: "Tested working / anchored where needed", zh: "已测试可用 / 需要处已固定" },
      { key: "clean", en: "Packaging & debris removed", zh: "包装和碎屑已清理" },
    ],
  },
};

/**
 * A visit shorter than this share of the booked time is flagged
 * "short_visit": payout is held for admin review instead of releasing
 * on customer confirmation.
 */
export const MIN_ON_SITE_SHARE = 0.6;

export function qcFlagFor(bookedMin: number, startedAt: Date | null, completedAt: Date): string | null {
  if (!startedAt) return "no_start_time";
  const actualMin = (completedAt.getTime() - startedAt.getTime()) / 60000;
  return actualMin < bookedMin * MIN_ON_SITE_SHARE ? "short_visit" : null;
}

/** Which required areas are still missing evidence for a phase. */
export function missingAreas(
  category: ReleaseCategory,
  evidence: readonly { phase: string; description: string | null }[],
  phase: "before" | "after",
): QcArea[] {
  const have = new Set(evidence.filter((e) => e.phase === phase).map((e) => e.description));
  return QC_AREAS[category].filter((a) => !have.has(a.key));
}

/** Pause thresholds (rolling windows), applied in matching and booking. */
export const TRUST_RULES = {
  /** Provider: average of last N customer ratings below this (with ≥ minReviews). */
  providerMinAvg: 3.5,
  /** Customer: average of last N provider ratings below this (with ≥ minReviews). */
  customerMinAvg: 3.0,
  minReviews: 3,
  lastN: 10,
  /** Rating at or below this blocks the pair from being matched again. */
  pairBlockAt: 2,
  /** Self-initiated cancellations (provider) or late cancels / no-shows (customer) in 90 days. */
  maxCancels90d: 3,
  /** Jobs flagged by QC (short visit, upheld dispute) in 90 days before a provider is paused. */
  maxQcFlags90d: 2,
} as const;
