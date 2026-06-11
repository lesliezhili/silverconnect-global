"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";

interface Stats {
  totalBookings: number; completed: number; upcoming: number; active: number;
  totalEarnings: number; donationTotal: number; donationCount: number; totalIncome: number;
  avgRating: number; reviewCount: number; prayerReports: number; attendees: number;
  seniorsServed: number; followUps: number;
}
interface Booking { id: string; status?: string; scheduledAt: string; completedAt?: string; service: string; customer: string; }

function DashboardContent() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isZh = locale.startsWith("zh");

  const [stats, setStats] = useState<Stats | null>(null);
  const [volunteer, setVolunteer] = useState<{ name: string; isFaith: boolean } | null>(null);
  const [recent, setRecent] = useState<Booking[]>([]);
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/provider/dashboard")
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats);
          setVolunteer(data.volunteer);
          setRecent(data.recentBookings || []);
          setUpcoming(data.upcomingBookings || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-xl">{isZh ? "加载中..." : "Loading..."}</div>;

  const nav = (path: string) => router.push("/" + locale + path);

  return (
    <main className="max-w-lg mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{isZh ? "\u6211\u7684\u4eea\u8868\u677f" : "My Dashboard"}</h1>
          <button onClick={() => nav("/provider/notifications")} className="relative p-3 bg-white border border-gray-200 rounded-full">
            <span className="text-2xl">\ud83d\udd14</span>
            <NotificationBadge type="total" />
          </button>
        </div>
        {volunteer && (
          <p className="text-lg text-gray-500 mt-1">
            {volunteer.name} {volunteer.isFaith && (isZh ? "\u2022 信仰志愿者" : "\u2022 Faith Volunteer")}
          </p>
        )}
      </div>

      {stats && (
        <>
          {/* Primary KPIs */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button onClick={() => nav("/provider/earnings")} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">${stats.totalIncome.toFixed(0)}</p>
              <p className="text-xs text-emerald-600">{isZh ? "总收入" : "Income"}</p>
            </button>
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">{stats.completed}</p>
              <p className="text-xs text-purple-600">{isZh ? "已完成" : "Completed"}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-700">{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "\u2014"}</p>
              <p className="text-xs text-yellow-600">{isZh ? "评分" : "Rating"} ({stats.reviewCount})</p>
            </div>
          </div>
            <button onClick={() => nav("/provider/smart-pricing")} className="w-full bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center justify-between active:scale-[0.97]">
              <div className="flex items-center gap-3">
                <span className="text-3xl">✨</span>
                <div className="text-left">
                  <p className="text-lg font-bold text-gray-900">{isZh ? "智能定价设置" : "Smart Price Settings"}</p>
                  <p className="text-sm text-gray-500">{isZh ? "设置服务价格 • 默认市场推荐" : "Set your rates • Market defaults"}</p>
                </div>
              </div>
              <span className="text-2xl text-gray-400">{'\u2192'}</span>
            </button>

            <button onClick={() => nav("/provider/licenses")} className="w-full bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center justify-between active:scale-[0.97]">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📋</span>
                <div className="text-left">
                  <p className="text-lg font-bold text-gray-900">{isZh ? "执照与保险" : "License & Insurance"}</p>
                  <p className="text-sm text-gray-500">{isZh ? "持牌服务验证 • 电工/水管/砍树" : "Trade verification • Electrical/Plumbing/Tree"}</p>
                </div>
              </div>
              <span className="text-2xl text-gray-400">{'\u2192'}</span>
            </button>


          {/* Ministry Stats (faith volunteers) */}
          {volunteer?.isFaith && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">{isZh ? "\u271d 事工统计" : "\u271d Ministry"}</h2>
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => nav("/provider/prayer-reports")} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-purple-600">{stats.prayerReports}</p>
                  <p className="text-xs text-gray-500">{isZh ? "报告" : "Reports"}</p>
                </button>
                <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-blue-600">{stats.attendees}</p>
                  <p className="text-xs text-gray-500">{isZh ? "参加" : "Attended"}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-emerald-600">{stats.seniorsServed}</p>
                  <p className="text-xs text-gray-500">{isZh ? "长者" : "Seniors"}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-amber-600">{stats.donationCount}</p>
                  <p className="text-xs text-gray-500">{isZh ? "捐赠" : "Gifts"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Bookings */}
          {upcoming.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">{isZh ? "\ud83d\udcc5 即将到来" : "\ud83d\udcc5 Upcoming"}</h2>
              <div className="space-y-2">
                {upcoming.map(b => (
                  <button key={b.id} onClick={() => nav("/provider/prayer-report/" + b.id)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left flex items-center justify-between">
                    <div>
                      <p className="text-lg font-medium text-gray-800">{b.customer || (isZh ? "长者" : "Senior")}</p>
                      <p className="text-sm text-gray-400">{b.service?.replace(/_/g, " ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-medium text-purple-600">{new Date(b.scheduledAt).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-400">{new Date(b.scheduledAt).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">{isZh ? "\ud83d\udcdd 最近活动" : "\ud83d\udcdd Recent"}</h2>
            {recent.length === 0 ? (
              <p className="text-base text-gray-400 text-center py-4">{isZh ? "暂无活动" : "No recent activity"}</p>
            ) : (
              <div className="space-y-2">
                {recent.map(b => (
                  <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-base text-gray-700">{b.customer || (isZh ? "长者" : "Senior")}</p>
                      <p className="text-xs text-gray-400">{b.service?.replace(/_/g, " ")}</p>
                    </div>
                    <span className={"px-3 py-1 rounded-full text-xs font-medium " + (
                      b.status === "completed" || b.status === "released" ? "bg-green-100 text-green-700" :
                      b.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    )}>{b.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">{isZh ? "快捷操作" : "Quick Actions"}</h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => nav("/provider/prayer-reports")} className="py-4 bg-purple-50 border border-purple-200 rounded-xl text-center">
                <div className="text-2xl mb-1">\ud83d\udcdd</div>
                <p className="text-sm font-medium text-purple-700">{isZh ? "祷告报告" : "Reports"}</p>
              </button>
              <button onClick={() => nav("/provider/earnings")} className="py-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <div className="text-2xl mb-1">\ud83d\udcb0</div>
                <p className="text-sm font-medium text-emerald-700">{isZh ? "收入" : "Earnings"}</p>
              </button>
              <button onClick={() => nav("/provider/faith-schedule")} className="py-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                <div className="text-2xl mb-1">\ud83d\udcc5</div>
                <p className="text-sm font-medium text-blue-700">{isZh ? "日程" : "Schedule"}</p>
              </button>
              <button onClick={() => window.open("/api/provider/prayer-reports/export", "_blank")} className="py-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <div className="text-2xl mb-1">\ud83d\udda8\ufe0f</div>
                <p className="text-sm font-medium text-gray-700">{isZh ? "导出PDF" : "Export PDF"}</p>
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default function ProviderDashboardPage() {
  return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><DashboardContent /></Suspense>;
}
