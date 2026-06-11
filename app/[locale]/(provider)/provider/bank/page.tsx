"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function BankContent() {
  const searchParams = useSearchParams();
  const success = searchParams?.get("success");
  const refresh = searchParams?.get("refresh");
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startOnboarding = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/connect-onboard", { method: "POST" });
      const data = await res.json();
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      } else if (data.simulated) {
        setError("Stripe not configured — onboarding simulated.");
        setAccountId(data.accountId);
      } else {
        setError(data.error || "Failed to start onboarding");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="max-w-lg mx-auto p-6">
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-800 mb-3">Bank Account Connected!</h1>
          <p className="text-lg text-green-700">
            You&apos;re set to receive payments. Earnings transfer after each completed job.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Set Up Payouts</h1>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">How it works</h2>
        <ul className="space-y-3 text-lg text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-2xl">1️⃣</span>
            <span>Connect your bank account via Stripe (secure)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-2xl">2️⃣</span>
            <span>Complete jobs — you keep 85% of each payment</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-2xl">3️⃣</span>
            <span>Automatic payouts to your bank (2-3 business days)</span>
          </li>
        </ul>
      </div>
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
          <p className="text-yellow-800">{error}</p>
          {accountId && <p className="text-sm text-yellow-600 mt-1">Account: {accountId}</p>}
        </div>
      )}
      {refresh && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-blue-800">Session expired. Click below to continue.</p>
        </div>
      )}
      <button
        onClick={startOnboarding}
        disabled={loading}
        className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
                   text-white text-xl font-bold rounded-xl transition-colors min-h-[56px] shadow-lg"
      >
        {loading ? "Setting up..." : "Connect Bank Account"}
      </button>
      <p className="text-center text-sm text-gray-500 mt-4">
        Powered by Stripe Connect. Banking details never stored on our servers.
      </p>
    </main>
  );
}

export default function ProviderBankPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}>
      <BankContent />
    </Suspense>
  );
}
