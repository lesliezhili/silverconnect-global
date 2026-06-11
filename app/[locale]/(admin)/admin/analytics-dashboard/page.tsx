"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";

function AnalyticsDashboardContent() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isZh = locale.startsWith("zh");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/admin/analytics-dashboard").then(r => r.json()).then(d => { if (d.success) setData(d); }).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="p-6 text-center text-xl">{isZh ? "\u52a0\u8f7d\u4e2d..." : "Loading..."}</div>;
  if (!data) return <div className="p-6 text-center text-red-500">Failed to load</div>;

  const b = data.bookings as Record<string, number>;
  const v = data.volunteers as Record<string, number>;
  const s = data.seniors as Record<string, number>;
  const f = data.financial as Record<string, number>;
  const sat = data.satisfaction as Record<string, number>;
  const pr = data.prayerReports as { total: number; followUps: number; moods: Record<string, number> };
  const ach = data.achievements as { totalUnlocked: number; topAchievements: { id: string; count: number }[] };
  const tm = data.teamMessages as Record<string, number>;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{isZh ? "\u5206\u6790\u4eea\u8868\u677f" : "Analytics Dashboard"}</h1>

      {/* Top-level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-700">{b.completed}</p>
          <p className="text-sm text-purple-600">{isZh ? "\u5b8c\u6210\u670d\u52a1" : "Services Done"}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-700">{v.active}</p>
          <p className="text-sm text-emerald-600">{isZh ? "\u6d3b\u8dc3\u5fd7\u613f\u8005" : "Active Volunteers"}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">{s.total}</p>
          <p className="text-sm text-blue-600">{isZh ? "\u670d\u52a1\u957f\u8005" : "Seniors Served"}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-700">{sat.avgRating}/5</p>
          <p className="text-sm text-amber-600">{isZh ? "\u5e73\u5747\u8bc4\u5206" : "Avg Rating"}</p>
        </div>
      </div>

      {/* Booking stats */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">{isZh ? "\ud83d\udcc5 \u9884\u7ea6" : "\ud83d\udcc5 Bookings"}</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[["Total",b.total],["This Week",b.thisWeek],["This Month",b.thisMonth],["Upcoming",b.upcoming],["Completed",b.completed],["Cancelled",b.cancelled]].map(([l,n]) => (
            <div key={l as string} className="text-center"><p className="text-xl font-bold text-gray-700">{n as number}</p><p className="text-xs text-gray-400">{l}</p></div>
          ))}
        </div>
      </div>

      {/* Financial + Satisfaction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">{isZh ? "\ud83d\udcb0 \u8d22\u52a1" : "\ud83d\udcb0 Financial"}</h2>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Total Donations</span><span className="font-bold text-emerald-600">${f.totalDonations.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Donation Count</span><span className="font-bold">{f.donationCount}</span></div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">{isZh ? "\ud83d\ude0a \u6ee1\u610f\u5ea6" : "\ud83d\ude0a Satisfaction"}</h2>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Avg Rating</span><span className="font-bold">{sat.avgRating}/5 \u2b50</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Surveys</span><span className="font-bold">{sat.surveyCount}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Would Recommend</span><span className="font-bold text-green-600">{sat.wouldRecommendPct}%</span></div>
          </div>
        </div>
      </div>

      {/* Prayer & Ministry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">{isZh ? "\ud83d\ude4f \u7977\u544a" : "\ud83d\ude4f Prayer Reports"}</h2>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Total Reports</span><span className="font-bold">{pr.total}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Follow-ups Needed</span><span className="font-bold text-amber-600">{pr.followUps}</span></div>
            {Object.entries(pr.moods || {}).map(([mood, cnt]) => (
              <div key={mood} className="flex justify-between"><span className="text-gray-400 capitalize">{mood}</span><span>{cnt}</span></div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">{isZh ? "\ud83c\udfc5 \u6210\u5c31" : "\ud83c\udfc5 Achievements"}</h2>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Unlocked Total</span><span className="font-bold text-purple-600">{ach.totalUnlocked}</span></div>
            {ach.topAchievements?.map(a => (
              <div key={a.id} className="flex justify-between"><span className="text-gray-400">{a.id.replace(/_/g, " ")}</span><span>{a.count}x</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* Team & Volunteers */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">{isZh ? "\ud83d\udc65 \u56e2\u961f" : "\ud83d\udc65 Team Activity"}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center"><p className="text-xl font-bold text-gray-700">{v.total}</p><p className="text-xs text-gray-400">Volunteers</p></div>
          <div className="text-center"><p className="text-xl font-bold text-amber-600">{v.pending}</p><p className="text-xs text-gray-400">Pending</p></div>
          <div className="text-center"><p className="text-xl font-bold text-gray-700">{tm.total}</p><p className="text-xs text-gray-400">Messages</p></div>
          <div className="text-center"><p className="text-xl font-bold text-blue-600">{tm.thisWeek}</p><p className="text-xs text-gray-400">This Week</p></div>
        </div>
      </div>
    </main>
  );
}

export default function AnalyticsDashboardPage() { return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><AnalyticsDashboardContent /></Suspense>; }
