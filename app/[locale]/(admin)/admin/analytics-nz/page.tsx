"use client";
import { useState, useEffect } from "react";

interface CountryStats { total: number; approved: number; pending: number; rejected: number; }
interface BookingStats { total: number; completed: number; revenue: number; avgPrice: number; avgDuration: number; taxCollected: number; }
interface RatingStats { total: number; sum: number; avg: number; five_star: number; }
interface MemberStats { total: number; active: number; mrr: number; }

export default function AnalyticsNZPage() {
  const [data, setData] = useState<{
    summary: { totalProviders: number; totalBookings: number; totalRevenue: number; nzShare: number };
    providers: { AU: CountryStats; NZ: CountryStats };
    bookings: { AU: BookingStats; NZ: BookingStats };
    ratings: { AU: RatingStats; NZ: RatingStats };
    memberships: { AU: MemberStats; NZ: MemberStats };
    taxComparison: { AU: { rate: string; collected: number }; NZ: { rate: string; collected: number } };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics-nz").then(r => r.json()).then(d => { if (d.success) setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading analytics...</p></div>;
  if (!data) return <div className="p-6"><p className="text-red-500">Failed to load analytics</p></div>;

  const { summary, providers, bookings, ratings, memberships, taxComparison } = data;

  const StatCard = ({ label, auVal, nzVal, prefix = "", suffix = "" }: { label: string; auVal: string | number; nzVal: string | number; prefix?: string; suffix?: string }) => (
    <div className="bg-white rounded-xl border p-4">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs text-gray-400">\ud83c\udde6\ud83c\uddfa AU</p>
          <p className="text-lg font-bold text-gray-900">{prefix}{auVal}{suffix}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">\ud83c\uddf3\ud83c\uddff NZ</p>
          <p className="text-lg font-bold text-emerald-600">{prefix}{nzVal}{suffix}</p>
        </div>
      </div>
    </div>
  );

  const BarCompare = ({ label, auVal, nzVal, maxVal }: { label: string; auVal: number; nzVal: number; maxVal: number }) => (
    <div className="mb-3">
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <div className="flex gap-2 items-center">
        <span className="text-xs w-6">AU</span>
        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
          <div className="bg-blue-500 h-4 rounded-full transition-all" style={{ width: maxVal > 0 ? (auVal / maxVal * 100) + "%" : "0%" }}></div>
        </div>
        <span className="text-xs w-10 text-right font-medium">{auVal}</span>
      </div>
      <div className="flex gap-2 items-center mt-1">
        <span className="text-xs w-6">NZ</span>
        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
          <div className="bg-emerald-500 h-4 rounded-full transition-all" style={{ width: maxVal > 0 ? (nzVal / maxVal * 100) + "%" : "0%" }}></div>
        </div>
        <span className="text-xs w-10 text-right font-medium">{nzVal}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
        <h1 className="text-2xl font-bold text-gray-900">NZ vs AU Analytics</h1>
        <p className="text-sm text-gray-500">Country performance comparison dashboard</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-blue-100 text-xs">Total Providers</p>
          <p className="text-2xl font-bold">{summary.totalProviders}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <p className="text-emerald-100 text-xs">Total Bookings</p>
          <p className="text-2xl font-bold">{summary.totalBookings}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <p className="text-purple-100 text-xs">Total Revenue</p>
          <p className="text-2xl font-bold">${summary.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
          <p className="text-amber-100 text-xs">NZ Market Share</p>
          <p className="text-2xl font-bold">{summary.nzShare}%</p>
        </div>
      </div>

      {/* Provider Stats */}
      <div className="bg-white rounded-xl border p-5 mb-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">\ud83d\udc64 Providers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total" auVal={providers.AU.total} nzVal={providers.NZ.total} />
          <StatCard label="Approved" auVal={providers.AU.approved} nzVal={providers.NZ.approved} />
          <StatCard label="Pending" auVal={providers.AU.pending} nzVal={providers.NZ.pending} />
          <StatCard label="Rejected" auVal={providers.AU.rejected} nzVal={providers.NZ.rejected} />
        </div>
      </div>

      {/* Bookings Stats */}
      <div className="bg-white rounded-xl border p-5 mb-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">\ud83d\udcca Bookings</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <StatCard label="Total Bookings" auVal={bookings.AU.total} nzVal={bookings.NZ.total} />
          <StatCard label="Completed" auVal={bookings.AU.completed} nzVal={bookings.NZ.completed} />
          <StatCard label="Revenue" auVal={bookings.AU.revenue.toFixed(0)} nzVal={bookings.NZ.revenue.toFixed(0)} prefix="$" />
          <StatCard label="Avg Price" auVal={bookings.AU.avgPrice.toFixed(0)} nzVal={bookings.NZ.avgPrice.toFixed(0)} prefix="$" />
          <StatCard label="Avg Duration" auVal={bookings.AU.avgDuration} nzVal={bookings.NZ.avgDuration} suffix=" min" />
          <StatCard label="Completion Rate" auVal={bookings.AU.total > 0 ? Math.round(bookings.AU.completed / bookings.AU.total * 100) : 0} nzVal={bookings.NZ.total > 0 ? Math.round(bookings.NZ.completed / bookings.NZ.total * 100) : 0} suffix="%" />
        </div>
        <BarCompare label="Bookings" auVal={bookings.AU.total} nzVal={bookings.NZ.total} maxVal={Math.max(bookings.AU.total, bookings.NZ.total)} />
        <BarCompare label="Revenue" auVal={Math.round(bookings.AU.revenue)} nzVal={Math.round(bookings.NZ.revenue)} maxVal={Math.max(bookings.AU.revenue, bookings.NZ.revenue)} />
      </div>

      {/* Tax Comparison */}
      <div className="bg-white rounded-xl border p-5 mb-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">\ud83d\udcb0 Tax & Revenue</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-blue-600 font-medium">\ud83c\udde6\ud83c\uddfa Australia</p>
            <p className="text-xl font-bold text-gray-900 mt-1">GST {taxComparison.AU.rate}</p>
            <p className="text-sm text-gray-600">Collected: <span className="font-semibold">A${taxComparison.AU.collected.toFixed(2)}</span></p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4">
            <p className="text-xs text-emerald-600 font-medium">\ud83c\uddf3\ud83c\uddff New Zealand</p>
            <p className="text-xl font-bold text-gray-900 mt-1">GST {taxComparison.NZ.rate}</p>
            <p className="text-sm text-gray-600">Collected: <span className="font-semibold">NZ${taxComparison.NZ.collected.toFixed(2)}</span></p>
          </div>
        </div>
      </div>

      {/* Ratings */}
      <div className="bg-white rounded-xl border p-5 mb-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">\u2b50 Ratings</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Avg Rating" auVal={ratings.AU.avg || "-"} nzVal={ratings.NZ.avg || "-"} suffix="/5" />
          <StatCard label="Total Reviews" auVal={ratings.AU.total} nzVal={ratings.NZ.total} />
          <StatCard label="5-Star Reviews" auVal={ratings.AU.five_star} nzVal={ratings.NZ.five_star} />
        </div>
      </div>

      {/* Memberships */}
      <div className="bg-white rounded-xl border p-5 mb-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">\ud83d\udc8e Memberships</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Active Members" auVal={memberships.AU.active} nzVal={memberships.NZ.active} />
          <StatCard label="MRR" auVal={memberships.AU.mrr.toFixed(0)} nzVal={memberships.NZ.mrr.toFixed(0)} prefix="$" />
          <StatCard label="Total Signups" auVal={memberships.AU.total} nzVal={memberships.NZ.total} />
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400">Data refreshed on page load. All revenue figures in local currency.</p>
    </div>
  );
}
