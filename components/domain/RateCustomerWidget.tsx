"use client";

import * as React from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Strings = {
  title: string;
  submit: string;
  submitting: string;
  submitted: string;
  failed: string;
  commentPh: string;
};

/**
 * Provider-side aspects and next-visit tier — stored on the review and
 * used as booking preferences (the customer's next booking preselects the
 * suggested tier; ≤2★ blocks the pair). Labels per locale, one language per page.
 */
const ASPECTS = [
  { key: "access", en: "Easy access to the home", zh: "进门方便" },
  { key: "accurate_description", en: "Job matched the booking", zh: "实际工作与预约相符" },
  { key: "respect", en: "Respectful and safe", zh: "尊重并安全" },
] as const;
const TIERS = [
  { value: "regular", en: "Regular", zh: "常规" },
  { value: "medium", en: "Medium effort", zh: "中度" },
  { value: "high", en: "High effort", zh: "高强度" },
] as const;

/**
 * The provider-side half of the dual feedback system — mirrors the
 * customer's star-rating form (app/[locale]/(customer)/bookings/[id]/feedback/page.tsx)
 * but as a client widget embedded on the job detail page, posting to the
 * same POST /api/bookings/[id]/feedback route (now fixed to actually
 * accept provider submissions — see route.ts's isProvider resolution).
 */
export function RateCustomerWidget({
  bookingId,
  strings,
  zh = false,
}: {
  bookingId: string;
  strings: Strings;
  zh?: boolean;
}) {
  const [loading, setLoading] = React.useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [aspects, setAspects] = React.useState<Record<string, number>>({});
  const [suggestedTier, setSuggestedTier] = React.useState("");
  const [state, setState] = React.useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    fetch(`/api/bookings/${bookingId}/feedback`)
      .then((r) => r.json())
      .then((data) => setAlreadySubmitted(!!data.providerFeedback))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingId]);

  async function submit() {
    if (rating < 1) return;
    setState("submitting");
    setError("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment || undefined, aspects, suggestedTier: suggestedTier || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || strings.failed);
        setState("idle");
        return;
      }
      setAlreadySubmitted(true);
    } catch {
      setError(strings.failed);
      setState("idle");
    }
  }

  if (loading) return null;

  if (alreadySubmitted) {
    return (
      <div data-testid="rate-customer" className="mt-3 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-3 text-[16px] font-semibold text-success">
        <CheckCircle2 size={18} aria-hidden /> {strings.submitted}
      </div>
    );
  }

  return (
    <section data-testid="rate-customer" className="mt-3 rounded-lg border border-border bg-bg-base p-4">
      <p className="text-[16px] font-bold text-text-primary">{strings.title}</p>
      <div className="mt-3 flex gap-2" role="radiogroup" aria-label={strings.title}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
            className={
              "flex h-12 w-12 items-center justify-center rounded-md border-[1.5px] " +
              (rating >= n
                ? "border-brand bg-brand-soft"
                : "border-border-strong bg-bg-base hover:border-brand")
            }
          >
            <Star
              size={24}
              className={rating >= n ? "fill-[var(--brand-accent)] text-[var(--brand-accent)]" : "text-text-tertiary"}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
            />
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {ASPECTS.map((a) => (
          <label key={a.key} className="flex items-center justify-between gap-3 text-[16px]">
            <span>{zh ? a.zh : a.en}</span>
            <select
              aria-label={zh ? a.zh : a.en}
              value={aspects[a.key] ?? ""}
              onChange={(e) =>
                setAspects((prev) => {
                  const next = { ...prev };
                  if (e.target.value) next[a.key] = Number(e.target.value);
                  else delete next[a.key];
                  return next;
                })
              }
              className="h-12 w-28 rounded-md border-[1.5px] border-border-strong bg-bg-base px-3"
            >
              <option value="">—</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{"★".repeat(n)}</option>
              ))}
            </select>
          </label>
        ))}
        <label className="flex items-center justify-between gap-3 text-[16px]">
          <span>{zh ? "下次需要的强度" : "Next visit should be"}</span>
          <select
            aria-label={zh ? "下次需要的强度" : "Next visit should be"}
            value={suggestedTier}
            onChange={(e) => setSuggestedTier(e.target.value)}
            className="h-12 w-40 rounded-md border-[1.5px] border-border-strong bg-bg-base px-3"
          >
            <option value="">{zh ? "不变" : "Same"}</option>
            {TIERS.map((t) => (
              <option key={t.value} value={t.value}>{zh ? t.zh : t.en}</option>
            ))}
          </select>
        </label>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={strings.commentPh}
        rows={2}
        maxLength={2000}
        className="mt-3 block w-full rounded-md border-[1.5px] border-border-strong bg-bg-base p-3 text-[16px] text-text-primary placeholder:text-text-placeholder focus:border-brand focus:outline-none"
      />
      {error && <p className="mt-2 text-[15px] text-danger">{error}</p>}
      <Button
        type="button"
        variant="primary"
        block
        size="md"
        disabled={rating < 1 || state === "submitting"}
        onClick={submit}
        className="mt-3"
      >
        {state === "submitting" ? strings.submitting : strings.submit}
      </Button>
    </section>
  );
}
