import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { serviceQuotes } from "@/lib/db/schema/bookings";
import { submitQuote } from "@/lib/quotes/actions";
import { quoteEligibility } from "@/lib/quotes/eligibility";
import { isReleaseCategory } from "@/lib/release";
import { EFFORT_TIERS, TIER, TIER_SCOPE, recommendQuote, type EffortTier } from "@/lib/release-pricing";

const TIER_LABEL: Record<EffortTier, { en: string; zh: string }> = {
  regular: { en: "Regular", zh: "常规" },
  medium: { en: "Medium effort", zh: "中度" },
  high: { en: "High effort", zh: "高强度" },
};

/**
 * After a completed first job: shows the existing quote, or lets the
 * provider send one for later visits (tier + hours only — the price comes
 * from the standard model). Recommendation = real time on site.
 */
export async function QuotePanel({
  locale,
  job,
}: {
  locale: string;
  job: {
    id: string;
    status: string;
    effortTier: string | null;
    durationMin: number;
    startedAt: Date | null;
    completedAt: Date | null;
    serviceCategory: string | null;
  };
}) {
  const zh = locale === "zh" || locale === "zh_tw";
  const [existing] = await db
    .select({ status: serviceQuotes.status, tier: serviceQuotes.tier, hours: serviceQuotes.hours, base: serviceQuotes.basePrice, currency: serviceQuotes.currency })
    .from(serviceQuotes)
    .where(eq(serviceQuotes.bookingId, job.id))
    .limit(1);

  if (existing) {
    const statusLabel: Record<string, [string, string]> = {
      pending: ["Waiting for the customer", "等待客户确认"],
      approved: ["Approved by the customer", "客户已确认"],
      declined: ["Declined by the customer", "客户已拒绝"],
      expired: ["Expired", "已过期"],
    };
    const tierName = TIER_LABEL[existing.tier as EffortTier] ?? TIER_LABEL.regular;
    return (
      <section className="mt-4 rounded-lg border border-border bg-bg-base p-4">
        <p className="text-[17px] font-bold">{zh ? "后续服务报价" : "Quote for later visits"}</p>
        <p className="mt-1 text-[16px] text-text-secondary">
          {zh ? tierName.zh : tierName.en} · {Number(existing.hours)}h · {existing.currency} {Number(existing.base).toFixed(2)}
          {zh ? "（不含税）" : " ex tax"}
        </p>
        <p className="mt-1 text-[16px] font-semibold">{(statusLabel[existing.status] ?? [existing.status, existing.status])[zh ? 1 : 0]}</p>
      </section>
    );
  }

  const elig = await quoteEligibility({
    id: job.id,
    status: job.status,
    tier: job.effortTier,
    durationMin: job.durationMin,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    category: job.serviceCategory,
  });
  if (!elig.ok || !isReleaseCategory(job.serviceCategory)) return null;

  const rec = recommendQuote({ tier: elig.fromTier, bookedMin: job.durationMin, actualMin: elig.actualMin });
  const cat = job.serviceCategory;

  return (
    <section className="mt-4 rounded-lg border-2 border-brand bg-bg-base p-4">
      <p className="text-[17px] font-bold">{zh ? "为后续服务报价（可选）" : "Quote for later visits (optional)"}</p>
      <p className="mt-1 text-[15px] text-text-secondary">
        {zh
          ? `预约 ${job.durationMin} 分钟，实际 ${elig.actualMin ?? "—"} 分钟。价格按标准价目自动计算，客户确认后才生效。`
          : `Booked ${job.durationMin} min, actual ${elig.actualMin ?? "—"} min. Price is set by the standard rates and only applies once the customer approves.`}
      </p>
      <form action={submitQuote} className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="bookingId" value={job.id} />
        <label className="block text-[16px] font-semibold">
          {zh ? "强度" : "Effort tier"}
          <select name="tier" defaultValue={rec.tier} className="mt-1 block h-12 w-full rounded-md border-[1.5px] border-border bg-bg-base px-3">
            {EFFORT_TIERS.map((t) => (
              <option key={t} value={t}>
                {zh ? TIER_LABEL[t].zh : TIER_LABEL[t].en} — {zh ? TIER_SCOPE[cat][t].zh : TIER_SCOPE[cat][t].en}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[16px] font-semibold">
          {zh ? "每次时长（小时，常规为固定套餐）" : "Hours per visit (regular is a fixed package)"}
          <input
            name="hours"
            type="number"
            min={TIER.regular.minHours}
            max={8}
            step={0.5}
            defaultValue={rec.hours}
            className="mt-1 block h-12 w-full rounded-md border-[1.5px] border-border bg-bg-base px-3"
          />
        </label>
        <label className="block text-[16px] font-semibold">
          {zh ? "原因（客户可见，至少 10 个字）" : "Reason (shown to the customer, 10+ characters)"}
          <textarea
            name="reason"
            required
            minLength={10}
            rows={3}
            placeholder={zh ? "例如：厨房油污较重，实际用时 3.5 小时" : "e.g. heavy kitchen grease — took 3.5 hours"}
            className="mt-1 block w-full rounded-md border-[1.5px] border-border bg-bg-base p-3"
          />
        </label>
        <button type="submit" className="h-12 rounded-md bg-brand text-[17px] font-bold text-white">
          {zh ? "发送报价给客户" : "Send quote to customer"}
        </button>
      </form>
    </section>
  );
}
