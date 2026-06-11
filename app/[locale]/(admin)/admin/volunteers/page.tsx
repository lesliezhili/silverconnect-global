"use client";

import { useState, useEffect, Suspense } from "react";

interface Volunteer {
  profileId: string; name: string; email: string; phone: string;
  status: string; church: string; denomination: string;
  pastorReference: { name: string; phone: string; email?: string } | null;
  servicesOffered: string[]; ministryExperience: string;
  totalBookings: number; completedBookings: number; avgRating: number | null;
  documents: { type: string; status: string; expires: string | null }[];
  registeredAt: string; approvedAt: string | null;
}

interface Overview {
  volunteers: { pending: number; docs_review: number; approved: number; rejected: number; total: number };
  documents: { pending: number; approved: number; rejected: number };
  bookings: { total: number; confirmed: number; completed: number; thisWeek: number };
}

function VolunteerDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = (status?: string | null) => {
    setLoading(true);
    const url = "/api/admin/volunteers" + (status ? "?status=" + status : "");
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setOverview(data.overview);
          setVolunteers(data.volunteers || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (profileId: string, action: "approve" | "reject") => {
    setActionLoading(profileId);
    await fetch("/api/admin/approve-faith-volunteer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, action }),
    });
    setActionLoading(null);
    fetchData(filter);
  };

  const handleDocVerify = async (documentId: string, action: "verify" | "reject") => {
    await fetch("/api/admin/verify-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, action }),
    });
    fetchData(filter);
  };

  const applyFilter = (status: string | null) => {
    setFilter(status);
    fetchData(status);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "docs_review": return "bg-blue-100 text-blue-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && !overview) return <div className="p-6 text-center text-xl">Loading dashboard...</div>;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Volunteer Management</h1>

      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-yellow-700">{overview.volunteers.pending}</p>
            <p className="text-base text-yellow-600">Pending Review</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-green-700">{overview.volunteers.approved}</p>
            <p className="text-base text-green-600">Active Volunteers</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-700">{overview.bookings.thisWeek}</p>
            <p className="text-base text-blue-600">Bookings This Week</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-purple-700">{overview.bookings.completed}</p>
            <p className="text-base text-purple-600">Services Completed</p>
          </div>
        </div>
      )}

      {/* Document Alert */}
      {overview && overview.documents.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-lg text-amber-800 font-medium">\u26a0\ufe0f {overview.documents.pending} document(s) pending verification</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {[null, "pending", "docs_review", "approved", "rejected"].map(s => (
          <button key={s || "all"} onClick={() => applyFilter(s)}
            className={"px-4 py-2 rounded-full text-base font-medium " +
              (filter === s ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700")}>
            {s === null ? "All" : s === "docs_review" ? "Docs Review" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Volunteer List */}
      <div className="space-y-4">
        {volunteers.length === 0 && <p className="text-lg text-gray-500 text-center py-8">No volunteers found.</p>}
        {volunteers.map(v => (
          <div key={v.profileId} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 cursor-pointer" onClick={() => setExpandedId(expandedId === v.profileId ? null : v.profileId)}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{v.name || v.email}</h3>
                  <p className="text-base text-gray-500">{v.church} {v.denomination ? "(" + v.denomination + ")" : ""}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={"px-3 py-1 rounded-full text-sm font-medium " + statusColor(v.status)}>{v.status}</span>
                  {v.avgRating && <span className="text-lg">\u2b50 {v.avgRating}</span>}
                </div>
              </div>
              <div className="flex gap-4 mt-2 text-sm text-gray-400">
                <span>{v.totalBookings} bookings</span>
                <span>{v.completedBookings} completed</span>
                <span>{v.servicesOffered.length} services</span>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedId === v.profileId && (
              <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-base">{v.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-base">{v.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pastor Reference</p>
                    <p className="text-base">{v.pastorReference?.name || "—"} ({v.pastorReference?.phone || "—"})</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Registered</p>
                    <p className="text-base">{v.registeredAt ? new Date(v.registeredAt).toLocaleDateString() : "—"}</p>
                  </div>
                </div>

                {v.ministryExperience && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ministry Experience</p>
                    <p className="text-base text-gray-700">{v.ministryExperience}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Services Offered</p>
                  <div className="flex flex-wrap gap-1">
                    {v.servicesOffered.map((s: string) => (
                      <span key={s} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-sm">{s.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                </div>

                {v.documents.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Documents</p>
                    <div className="space-y-1">
                      {v.documents.map((d, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-base">{d.type} — <span className={statusColor(d.status) + " px-2 py-0.5 rounded text-xs"}>{d.status}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {(v.status === "pending" || v.status === "docs_review") && (
                  <div className="flex gap-3 pt-3 border-t border-gray-200">
                    <button onClick={() => handleAction(v.profileId, "approve")} disabled={actionLoading === v.profileId}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-xl">
                      {actionLoading === v.profileId ? "..." : "\u2713 Approve"}
                    </button>
                    <button onClick={() => handleAction(v.profileId, "reject")} disabled={actionLoading === v.profileId}
                      className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-700 text-lg font-semibold rounded-xl border border-red-200">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

export default function AdminVolunteersPage() {
  return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><VolunteerDashboard /></Suspense>;
}
