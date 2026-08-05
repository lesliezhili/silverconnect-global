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
 * The provider-side half of the dual feedback system — mirrors the
 * customer's star-rating form (app/[locale]/(customer)/bookings/[id]/feedback/page.tsx)
 * but as a client widget embedded on the job detail page, posting to the
 * same POST /api/bookings/[id]/feedback route (now fixed to actually
 * accept provider submissions — see route.ts's isProvider resolution).
 */
export function RateCustomerWidget({
  bookingId,
  strings,
}: {
  bookingId: string;
  strings: Strings;
}) {
  const [loading, setLoading] = React.useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
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
        body: JSON.stringify({ rating, comment: comment || undefined }),
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
      <div className="mt-3 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-3 text-[16px] font-semibold text-success">
        <CheckCircle2 size={18} aria-hidden /> {strings.submitted}
      </div>
    );
  }

  return (
    <section className="mt-3 rounded-lg border border-border bg-bg-base p-4">
      <p className="text-[16px] font-bold text-text-primary">{strings.title}</p>
      <div className="mt-3 flex gap-2" role="radiogroup" aria-label={strings.title}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
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
