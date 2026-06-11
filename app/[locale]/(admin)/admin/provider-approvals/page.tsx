"use client";
import { useState, useEffect } from "react";

interface Provider {
  id: string; user_id: string; name: string; email: string; onboarding_status: string;
  bio: string; address_line: string; notes: string; country: string; region: string;
  submitted_at: string; approved_at: string; rejected_at: string; rejection_reason: string;
  documentsCount: number; avgRating: number | null; reviewCount: number; completedBookings: number;
  service_radius_km: number; bsb: string; account_number: string;
}

export default function ProviderApprovalsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    if (countryFilter) params.set("country", countryFilter);
    fetch("/api/admin/providers?" + params.toString())
      .then(r => r.json())
      .then(d => { setProviders(d.providers || []); setStats(d.stats || {}); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { refresh(); }, [filter, countryFilter]);

  const doAction = async (providerId: string, action: string, reason?: string) => {
    setActionLoading(providerId);
    await fetch("/api/admin/providers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ providerId, action, reason }) });
    setShowRejectModal(null); setRejectReason("");
    refresh();
    setActionLoading("");
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", docs_review: "bg-blue-100 text-blue-800", approved: "bg-emerald-100 text-emerald-800", rejected: "bg-red-100 text-red-800", suspended: "bg-gray-100 text-gray-800" };
    return <span className={"px-2.5 py-0.5 rounded-full text-xs font-semibold " + (colors[s] || "bg-gray-100 text-gray-600")}>{s.replace("_", " ")}</span>;
  };

  const countryFlag = (c: string) => c === "NZ" ? "\ud83c\uddf3\ud83c\uddff" : "\ud83c\udde6\ud83c\uddfa";

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Provider Approvals</h1>
        <p className="text-sm text-gray-500">Review and manage provider applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {[{k:"pending",l:"Pending",c:"text-yellow-600 bg-yellow-50"},{k:"docs_review",l:"In Review",c:"text-blue-600 bg-blue-50"},{k:"approved",l:"Approved",c:"text-emerald-600 bg-emerald-50"},{k:"rejected",l:"Rejected",c:"text-red-600 bg-red-50"},{k:"suspended",l:"Suspended",c:"text-gray-600 bg-gray-50"}].map(s => (
          <button key={s.k} onClick={() => setFilter(filter === s.k ? "" : s.k)} className={"rounded-xl p-3 text-center border-2 transition " + (filter === s.k ? "border-gray-900 " : "border-transparent ") + s.c}>
            <p className="text-2xl font-bold">{stats[s.k] || 0}</p>
            <p className="text-xs">{s.l}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Countries</option>
          <option value="AU">\ud83c\udde6\ud83c\uddfa Australia</option>
          <option value="NZ">\ud83c\uddf3\ud83c\uddff New Zealand</option>
        </select>
        <button onClick={() => { setFilter(""); setCountryFilter(""); }} className="text-sm text-gray-500 hover:text-gray-700 px-3">Clear filters</button>
        <span className="ml-auto text-sm text-gray-400">{providers.length} providers</span>
      </div>

      {/* Provider Cards */}
      {loading ? <p className="text-center text-gray-400 py-10">Loading...</p> : (
        <div className="space-y-3">
          {providers.map(p => (
            <div key={p.id} className="bg-white rounded-xl border p-4 hover:shadow-sm transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{countryFlag(p.country)}</span>
                    <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                    {statusBadge(p.onboarding_status)}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{p.email}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    <span>{p.country} &middot; {p.region || "No region"}</span>
                    <span>{p.documentsCount} docs</span>
                    {p.avgRating && <span>\u2b50 {p.avgRating} ({p.reviewCount})</span>}
                    {p.completedBookings > 0 && <span>{p.completedBookings} completed</span>}
                    {p.service_radius_km && <span>{p.service_radius_km}km radius</span>}
                  </div>
                  {p.bio && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{p.bio}</p>}
                  {p.notes && <p className="text-xs text-blue-600 mt-1">{p.notes}</p>}
                  {p.rejection_reason && <p className="text-xs text-red-600 mt-1">Reason: {p.rejection_reason}</p>}
                  {p.submitted_at && <p className="text-xs text-gray-400 mt-1">Submitted: {new Date(p.submitted_at).toLocaleDateString()}</p>}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {(p.onboarding_status === "pending" || p.onboarding_status === "docs_review") && (
                    <>
                      <button onClick={() => doAction(p.id, "approve")} disabled={actionLoading === p.id} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                        Approve
                      </button>
                      <button onClick={() => setShowRejectModal(p.id)} className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 border border-red-200">
                        Reject
                      </button>
                      {p.onboarding_status === "pending" && (
                        <button onClick={() => doAction(p.id, "docs_review")} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 border border-blue-200">
                          Review
                        </button>
                      )}
                    </>
                  )}
                  {p.onboarding_status === "approved" && (
                    <button onClick={() => doAction(p.id, "suspend")} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200">
                      Suspend
                    </button>
                  )}
                  {(p.onboarding_status === "rejected" || p.onboarding_status === "suspended") && (
                    <button onClick={() => doAction(p.id, "approve")} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100 border border-emerald-200">
                      Re-approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {providers.length === 0 && <p className="text-center text-gray-400 py-10">No providers match filters</p>}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Reject Provider</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={3} className="w-full border rounded-lg px-3 py-2 text-sm mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setShowRejectModal(null)} className="flex-1 py-2 rounded-lg border text-sm text-gray-600">Cancel</button>
              <button onClick={() => doAction(showRejectModal, "reject", rejectReason)} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
