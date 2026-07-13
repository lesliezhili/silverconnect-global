"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

const AMOUNT_PRESETS = [25, 50, 100, 250];

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function PaymentStep({ onDone }: { onDone: () => void }) {
  const t = useTranslations("donate");
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError("");
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    if (confirmError) {
      setError(confirmError.message || t("paymentFailed"));
      setSubmitting(false);
      return;
    }
    onDone();
  };

  return (
    <div className="mt-6 flex flex-col gap-4">
      <PaymentElement />
      {error && (
        <p className="rounded-md border border-danger bg-danger/10 px-4 py-3 text-body text-danger">
          {error}
        </p>
      )}
      <Button type="button" size="lg" block onClick={confirm} disabled={!stripe || submitting}>
        {submitting ? t("processing") : t("confirmButton")}
      </Button>
    </div>
  );
}

export default function DonatePage() {
  const t = useTranslations("donate");

  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [simulated, setSimulated] = useState(false);
  const [done, setDone] = useState(false);

  const effectiveAmount = customAmount ? Number(customAmount) : amount;

  const startPayment = async () => {
    if (!effectiveAmount || effectiveAmount <= 0) {
      setError(t("errorAmount"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/donations/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: effectiveAmount,
          currency: "AUD",
          donorName,
          donorEmail,
          message,
          anonymous,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errorGeneric"));
      setClientSecret(data.clientSecret);
      setSimulated(Boolean(data.simulated));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const options = useMemo(
    () => (clientSecret ? { clientSecret } : undefined),
    [clientSecret],
  );

  return (
    <>
      <Header back />
      <main className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12">
        <h1 className="text-elder-heading font-extrabold">{t("title")}</h1>
        <p className="mt-2 text-body text-text-secondary">{t("subtitle")}</p>

        {done ? (
          <div className="mt-8 rounded-xl border border-border bg-bg-base p-6 text-center">
            <p className="text-h3 font-bold text-brand">{t("thankYouTitle")}</p>
            <p className="mt-2 text-body text-text-secondary">{t("thankYouBody")}</p>
          </div>
        ) : clientSecret && stripePromise ? (
          <>
            {simulated && (
              <p className="mt-4 rounded-md border border-warning bg-warning-soft px-4 py-3 text-body text-warning">
                {t("testMode")}
              </p>
            )}
            <Elements stripe={stripePromise} options={options}>
              <PaymentStep onDone={() => setDone(true)} />
            </Elements>
          </>
        ) : (
          <div className="mt-6 flex flex-col gap-5">
            <div>
              <Label>{t("amountLabel")}</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {AMOUNT_PRESETS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setAmount(a);
                      setCustomAmount("");
                    }}
                    className={
                      "min-h-touch-btn rounded-md border-[1.5px] px-5 text-body font-bold " +
                      (amount === a && !customAmount
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-border bg-bg-base text-text-primary")
                    }
                  >
                    ${a}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min={1}
                placeholder={t("customAmountPlaceholder")}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="donorName">{t("fieldName")}</Label>
              <Input id="donorName" value={donorName} onChange={(e) => setDonorName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="donorEmail">{t("fieldEmail")}</Label>
              <Input id="donorEmail" type="email" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="message">{t("fieldMessage")}</Label>
              <textarea
                id="message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="block w-full rounded-md bg-bg-base px-4 py-3 text-body text-text-primary border-[1.5px] border-border focus:border-brand focus:outline-none"
              />
            </div>
            <label className="flex items-start gap-3 text-body text-text-secondary">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="mt-1"
              />
              {t("fieldAnonymous")}
            </label>

            {error && (
              <p className="rounded-md border border-danger bg-danger/10 px-4 py-3 text-body text-danger">
                {error}
              </p>
            )}

            <Button type="button" size="lg" block onClick={startPayment} disabled={loading}>
              {loading ? t("loading") : t("donateButton", { amount: effectiveAmount || 0 })}
            </Button>
          </div>
        )}
      </main>
    </>
  );
}
