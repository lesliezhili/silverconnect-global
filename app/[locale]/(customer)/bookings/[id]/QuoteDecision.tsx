import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { serviceQuotes } from "@/lib/db/schema/bookings";
import { decideQuote } from "@/lib/quotes/actions";
import { findLiveArea } from "@/lib/release";
import { type EffortTier } from "@/lib/release-pricing";

const TIER_LABEL: Record<EffortTier, [string, string]> = {
  regular: ["Regular", "常规"],
  medium: ["Medium effort", "中度"],
  high: ["High effort", "高强度"],
};

/** Customer side of a provider's quote: what changes, why, and approve / decline. */
export async function QuoteDecision({
  locale,
  bookingId,
  address,
}: {
  locale: string;
  bookingId: string;
  address: { country: string | null; postcode: string | null };
}) {
  const [q] = await db.select().from(serviceQuotes).where(eq(serviceQuotes.bookingId, bookingId)).limit(1);
  if (!q) return null;
  const zh = locale === "zh" || locale === "zh_tw";
  const i = zh ? 1 : 0;
  const area = findLiveArea(address.country ?? "", address.postcode);
  const base = Number(q.basePrice);
  const total = area ? +(base * (1 + area.tax.rate)).toFixed(2) : base;
  const expired = q.expiresAt < new Date();
  const from = TIER_LABEL[q.fromTier as EffortTier] ?? TIER_LABEL.regular;
  const to = TIER_LABEL[q.tier as EffortTier] ?? TIER_LABEL.regular;

  return (
    <section className="mt-4 rounded-lg border-2 border-brand bg-bg-base p-4">
      <p className="text-[18px] font-bold">{zh ? "服务者对后续服务的报价" : "Your provider's quote for next visits"}</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[16px]">
        <dt className="text-text-secondary">{zh ? "本次" : "This visit"}</dt>
        <dd>{from[i]} · {zh ? `预约 ${q.bookedMin} 分钟，实际 ${q.actualMin ?? "—"} 分钟` : `booked ${q.bookedMin} min, actual ${q.actualMin ?? "—"} min`}</dd>
        <dt className="text-text-secondary">{zh ? "后续" : "Next visits"}</dt>
        <dd className="font-semibold">{to[i]} · {Number(q.hours)}h · {q.currency} {total.toFixed(2)}{zh ? "（含税）" : " incl. tax"}</dd>
        <dt className="text-text-secondary">{zh ? "原因" : "Why"}</dt>
        <dd>{q.reason}</dd>
      </dl>
      {q.status === "pending" && !expired ? (
        <form action={decideQuote} className="mt-4 flex gap-3">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="quoteId" value={q.id} />
          <button name="decision" value="decline" className="h-14 flex-1 rounded-md border-2 border-border-strong text-[17px] font-semibold">
            {zh ? "不接受，保持原价" : "Decline — keep standard price"}
          </button>
          <button name="decision" value="approve" className="h-14 flex-1 rounded-md bg-brand text-[17px] font-bold text-white">
            {zh ? "接受报价" : "Approve quote"}
          </button>
        </form>
      ) : (
        <p className="mt-3 text-[16px] font-semibold">
          {q.status === "approved"
            ? zh ? "✅ 已接受，下次向此服务者预约时自动按此报价。" : "✅ Approved — your next booking with this provider uses it."
            : q.status === "declined"
              ? zh ? "已拒绝，后续保持标准价格。" : "Declined — next visits stay at the standard price."
              : zh ? "报价已过期。" : "This quote has expired."}
        </p>
      )}
    </section>
  );
}
