"use client";
import { useState, useEffect } from "react";

interface Plan { id: string; code: string; name: string; description: string; price_monthly: string; price_yearly: string; discount_percent: number; priority_booking: boolean; free_cancellations: number; gps_tracking: boolean; photo_reports: boolean; dedicated_provider: boolean; max_bookings_month: number | null; features: string[] | string; }
interface Membership { id: string; plan_code: string; plan_name: string; status: string; billing_cycle: string; start_date: string; next_billing_date: string; discount_percent: number; features: string[] | string; }

export default function MembershipPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [usage, setUsage] = useState<{ bookings_used: number; cancellations_used: number; discount_savings: number }>({ bookings_used: 0, cancellations_used: 0, discount_savings: 0 });
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const userId = "37ed768b-5770-46e6-851d-b605eae5f884";

  const refresh = () => {
    fetch("/api/membership?plans=true").then(r => r.json()).then(d => { if (d.plans) setPlans(d.plans); });
    fetch("/api/membership?userId=" + userId).then(r => r.json()).then(d => { if (d.membership) setMembership(d.membership); if (d.usage) setUsage(d.usage); });
  };
  useEffect(() => { refresh(); }, []);

  const subscribe = async (planCode: string) => {
    setLoading(true); setSuccess("");
    const res = await fetch("/api/membership", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, planCode, billingCycle: billing }) });
    const data = await res.json();
    if (data.success) { setSuccess("Welcome to " + (planCode.charAt(0).toUpperCase() + planCode.slice(1)) + "!"); refresh(); }
    setLoading(false);
  };

  const cancel = async () => {
    if (!confirm("Are you sure you want to cancel your membership?")) return;
    setLoading(true);
    await fetch("/api/membership", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    setMembership(null); setSuccess("Membership cancelled.");
    setLoading(false);
  };

  const parseFeatures = (f: string[] | string): string[] => {
    if (Array.isArray(f)) return f;
    try { return JSON.parse(f); } catch { return []; }
  };

  const tierColors: Record<string, string> = { free: "border-gray-200 bg-white", silver: "border-gray-300 bg-gradient-to-br from-gray-50 to-white", gold: "border-yellow-300 bg-gradient-to-br from-yellow-50 to-white", platinum: "border-purple-300 bg-gradient-to-br from-purple-50 to-white" };
  const tierBadge: Record<string, string> = { free: "bg-gray-100 text-gray-600", silver: "bg-gray-200 text-gray-700", gold: "bg-yellow-100 text-yellow-800", platinum: "bg-purple-100 text-purple-800" };
  const tierEmoji: Record<string, string> = { free: "\u2615", silver: "\u26aa", gold: "\u2b50", platinum: "\ud83d\udc8e" };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
        <p className="text-sm text-gray-500 mt-1">Save more on every service. Cancel anytime.</p>
      </div>

      {/* Success Toast */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-center gap-2">
          <span>\u2705</span>
          <p className="text-sm text-emerald-700 font-medium">{success}</p>
          <button onClick={() => setSuccess("")} className="ml-auto text-emerald-500 text-xs">\u2716</button>
        </div>
      )}

      {/* Current Membership Card */}
      {membership && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 mb-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Your Plan</p>
              <p className="text-2xl font-bold mt-1">{tierEmoji[membership.plan_code]} {membership.plan_name}</p>
              <p className="text-emerald-100 text-sm mt-1">{membership.billing_cycle} &middot; {membership.discount_percent}% off all services</p>
            </div>
            <button onClick={cancel} disabled={loading} className="text-xs text-white/70 hover:text-white border border-white/30 rounded-lg px-3 py-1.5 hover:bg-white/10 transition">
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <p className="text-2xl font-bold">{usage.bookings_used}</p>
              <p className="text-emerald-100 text-xs">Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{usage.cancellations_used}</p>
              <p className="text-emerald-100 text-xs">Free Cancels</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">${Number(usage.discount_savings).toFixed(0)}</p>
              <p className="text-emerald-100 text-xs">Saved</p>
            </div>
          </div>
          {membership.next_billing_date && (
            <p className="text-emerald-200 text-xs mt-3">Next billing: {membership.next_billing_date}</p>
          )}
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-full p-1 shadow-sm border inline-flex">
          <button onClick={() => setBilling("monthly")} className={"px-5 py-2 rounded-full text-sm font-medium transition " + (billing === "monthly" ? "bg-emerald-600 text-white shadow" : "text-gray-500 hover:text-gray-700")}>
            Monthly
          </button>
          <button onClick={() => setBilling("yearly")} className={"px-5 py-2 rounded-full text-sm font-medium transition " + (billing === "yearly" ? "bg-emerald-600 text-white shadow" : "text-gray-500 hover:text-gray-700")}>
            Yearly <span className="text-xs opacity-75 ml-1">save 17%</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const isCurrent = membership?.plan_code === plan.code;
          const price = billing === "yearly" ? plan.price_yearly : plan.price_monthly;
          const features = parseFeatures(plan.features);
          return (
            <div key={plan.id} className={"rounded-2xl border-2 p-5 transition-all hover:shadow-md " + (isCurrent ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200" : (tierColors[plan.code] || "bg-white border-gray-200")) + (plan.code === "gold" && !isCurrent ? " ring-1 ring-yellow-200" : "")}>
              {/* Plan Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{tierEmoji[plan.code]}</span>
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                </div>
                {plan.code === "gold" && !isCurrent && (
                  <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-semibold">Most Popular</span>
                )}
                {isCurrent && (
                  <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-semibold">Current</span>
                )}
              </div>

              <p className="text-xs text-gray-500 mb-4">{plan.description}</p>

              {/* Price */}
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-gray-900">${parseFloat(price).toFixed(plan.code === "free" ? 0 : 2)}</span>
                {plan.code !== "free" && <span className="text-sm text-gray-400 ml-1">/{billing === "yearly" ? "year" : "mo"}</span>}
                {plan.discount_percent > 0 && (
                  <span className={"ml-2 text-xs px-2 py-0.5 rounded-full font-medium " + tierBadge[plan.code]}>
                    {plan.discount_percent}% off
                  </span>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-5">
                {features.map((f: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">\u2713</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => subscribe(plan.code)}
                disabled={loading || isCurrent}
                className={"w-full py-3 rounded-xl text-sm font-semibold transition-all " + (
                  isCurrent ? "bg-emerald-100 text-emerald-600 cursor-default" :
                  plan.code === "gold" ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md hover:shadow-lg" :
                  plan.code === "platinum" ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md hover:shadow-lg" :
                  "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                ) + " disabled:opacity-50"}
              >
                {isCurrent ? "\u2713 Current Plan" : loading ? "Processing..." : plan.code === "free" ? "Switch to Free" : "Get " + plan.name}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-xs text-gray-400">No lock-in contracts. Cancel or change anytime.</p>
        <p className="text-xs text-gray-400">All payments processed by PHLedger — zero transaction fees.</p>
        <p className="text-xs text-gray-300 mt-4">Powered by PHLedger</p>
      </div>
    </div>
  );
}
