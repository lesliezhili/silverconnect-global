"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    Stripe?: (key: string) => any;
  }
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;
  const locale = (params?.locale as string) || "en";
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState("aud");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const paymentElementRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);

  // Create payment intent
  useEffect(() => {
    async function createPayment() {
      try {
        const res = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        });
        const data = await res.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setAmount(data.amount);
          setCurrency(data.currency || "aud");
        } else if (data.simulated) {
          setError("Payment is in simulated mode (Stripe not configured).");
        } else {
          setError(data.error || "Failed to create payment");
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    createPayment();
  }, [bookingId]);

  // Mount Stripe Elements when both Stripe.js and clientSecret are ready
  useEffect(() => {
    if (!stripeReady || !clientSecret || !paymentElementRef.current) return;
    if (elementsRef.current) return; // already mounted

    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!pk || !window.Stripe) return;

    const stripe = window.Stripe(pk);
    stripeRef.current = stripe;

    const elements = stripe.elements({
      clientSecret,
      appearance: { theme: "stripe", variables: { fontSizeBase: "18px", borderRadius: "12px" } },
    });
    elementsRef.current = elements;

    const paymentElement = elements.create("payment", {
      layout: "tabs",
      defaultValues: { billingDetails: { address: { country: "AU" } } },
    });
    paymentElement.mount(paymentElementRef.current);
  }, [stripeReady, clientSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripeRef.current || !elementsRef.current) return;

    setProcessing(true);
    setError(null);

    const { error: stripeError } = await stripeRef.current.confirmPayment({
      elements: elementsRef.current,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/bookings/${bookingId}/confirmation`,
      },
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed.");
      setProcessing(false);
    } else {
      setSucceeded(true);
    }
  };

  if (succeeded) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h2>
        <p className="text-lg text-gray-600">Your booking is confirmed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <Script
        src="https://js.stripe.com/v3/"
        onReady={() => setStripeReady(true)}
      />

      <h1 className="text-3xl font-bold mb-6">Complete Payment</h1>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-xl text-gray-600">Preparing payment...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-red-700 text-base">{error}</p>
        </div>
      )}

      {!loading && clientSecret && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-teal-50 rounded-xl p-4">
            <p className="text-lg font-semibold text-teal-950">
              Total: ${(amount / 100).toFixed(2)} {currency.toUpperCase()}
            </p>
          </div>

          <div ref={paymentElementRef} className="min-h-[200px]" />

          <button
            type="submit"
            disabled={processing || !stripeReady}
            className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-400
                       text-white text-xl font-bold rounded-xl transition-colors min-h-[56px] shadow-lg"
          >
            {processing ? "Processing..." : `Pay $${(amount / 100).toFixed(2)}`}
          </button>

          <p className="text-center text-sm text-gray-500">
            Secured by Stripe. Card details never stored on our servers.
          </p>
        </form>
      )}
    </div>
  );
}
