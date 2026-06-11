"use client";

import { useState, useEffect, Suspense } from "react";

interface Donation { id: string; amount: number; currency: string; donorName: string; message: string | null; service: string; date: string; }
interface Summary { paidEarnings: number; donationsReceived: number; totalIncome: number; currency: string; completedServices: number; totalDonationCount: number; }

function EarningsContent() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [thankYous, setThankYous] = useState<{ message: string; donor: string; date: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/provider/earnings")
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setSummary(data.summary);
          setDonations(data.donations || []);
          setThankYous(data.recentThankYous || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-xl">Loading...</div>;

  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Earnings</h1>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-emerald-700">${summary.totalIncome.toFixed(2)}</p>
            <p className="text-base text-emerald-600">Total Received</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-purple-700">{summary.completedServices}</p>
            <p className="text-base text-purple-600">Services Given</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-blue-700">${summary.donationsReceived.toFixed(2)}</p>
            <p className="text-base text-blue-600">Donations</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-amber-700">${summary.paidEarnings.toFixed(2)}</p>
            <p className="text-base text-amber-600">Paid Earnings</p>
          </div>
        </div>
      )}

      {/* Thank-you Messages */}
      {thankYous.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">\u2764\ufe0f Thank You Messages</h2>
          <div className="space-y-3">
            {thankYous.map((t, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-lg text-gray-800 italic">&ldquo;{t.message}&rdquo;</p>
                <p className="text-sm text-gray-400 mt-2">&mdash; {t.donor} &bull; {new Date(t.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Donation History */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Donation History</h2>
        {donations.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-lg text-gray-400">No donations yet.</p>
            <p className="text-base text-gray-400 mt-2">Keep serving — blessings will come!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {donations.map(d => (
              <div key={d.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
                <div>
                  <p className="text-lg font-medium text-gray-800">{d.donorName}</p>
                  <p className="text-sm text-gray-400">{d.service?.replace(/_/g, " ") || "Faith service"} &bull; {new Date(d.date).toLocaleDateString()}</p>
                </div>
                <p className="text-xl font-bold text-emerald-600">${d.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
        <p className="text-base text-gray-500">Faith services are free. Donations are gifts of gratitude from those you serve. God sees your faithfulness.</p>
      </div>
    </main>
  );
}

export default function EarningsPage() {
  return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><EarningsContent /></Suspense>;
}
