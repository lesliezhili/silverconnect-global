"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";

const MOOD_EMOJI: Record<string, string> = { joyful: "\ud83d\ude0a", peaceful: "\u262e\ufe0f", struggling: "\ud83d\ude1f", grieving: "\ud83d\ude22" };

function SeniorProfileContent() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const customerId = params?.customerId as string;
  const isZh = locale.startsWith("zh");

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"visits" | "reports" | "feedback">("visits");

  useEffect(() => {
    fetch("/api/provider/seniors/" + customerId)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return <div className="p-6 text-center text-xl">{isZh ? "加载中..." : "Loading..."}</div>;
  if (!data) return <div className="p-6 text-center text-xl text-red-500">{isZh ? "找不到长者信息" : "Senior not found"}</div>;

  const senior = data.senior as { name: string; phone: string; memberSince: string };
  const stats = data.stats as { totalVisits: number; completed: number; firstVisit: string; lastVisit: string };
  const visits = data.visits as { id: string; status: string; scheduledAt: string; completedAt: string; service: string; notes: string }[];
  const reports = data.prayerReports as { id: string; summary: string; topics: string[]; scripture: string; mood: string; date: string }[];
  const feedback = data.feedback as { rating: number; emotional: string; helped: string; date: string }[];
  const donations = data.donations as { amount: number; message: string; date: string }[];

  return (
    <main className="max-w-lg mx-auto p-6">
      {/* Senior header */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl font-bold text-purple-600">{(senior.name || "?")[0]?.toUpperCase()}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{senior.name || (isZh ? "长者" : "Senior")}</h1>
        {senior.phone && <p className="text-lg text-gray-500 mt-1">{senior.phone}</p>}
        <p className="text-sm text-gray-400">{isZh ? "会员自" : "Member since"} {new Date(senior.memberSince).toLocaleDateString()}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-purple-700">{stats.completed}</p>
          <p className="text-xs text-purple-600">{isZh ? "探访" : "Visits"}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{reports.length}</p>
          <p className="text-xs text-blue-600">{isZh ? "报告" : "Reports"}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-700">{feedback.length > 0 ? (feedback.reduce((a, f) => a + f.rating, 0) / feedback.length).toFixed(1) : "\u2014"}</p>
          <p className="text-xs text-emerald-600">{isZh ? "评分" : "Rating"}</p>
        </div>
      </div>

      {/* Donations */}
      {donations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-amber-700 mb-1">{isZh ? "\u2764\ufe0f 感恩捐赠" : "\u2764\ufe0f Gifts of Gratitude"}</p>
          {donations.slice(0, 3).map((d, i) => (
            <div key={i} className="flex justify-between items-center mt-2">
              <p className="text-base text-amber-800 italic">{d.message || (isZh ? "感恩" : "Thank you")}</p>
              <p className="text-base font-bold text-amber-700">${d.amount}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {[
          { key: "visits" as const, label: isZh ? "探访记录" : "Visits" },
          { key: "reports" as const, label: isZh ? "祷告报告" : "Reports" },
          { key: "feedback" as const, label: isZh ? "反馈" : "Feedback" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={"flex-1 py-3 text-base font-medium border-b-2 " + (tab === t.key ? "border-purple-600 text-purple-600" : "border-transparent text-gray-400")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "visits" && (
        <div className="space-y-2">
          {visits.length === 0 ? <p className="text-center text-gray-400 py-4">{isZh ? "暂无探访" : "No visits yet"}</p> : visits.map(v => (
            <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="text-base font-medium text-gray-800">{v.service?.replace(/_/g, " ") || "Service"}</p>
                <p className="text-sm text-gray-400">{new Date(v.scheduledAt).toLocaleDateString()}</p>
              </div>
              <span className={"px-2 py-1 rounded-full text-xs font-medium " + (
                v.status === "completed" ? "bg-green-100 text-green-700" : v.status === "confirmed" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
              )}>{v.status}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-3">
          {reports.length === 0 ? <p className="text-center text-gray-400 py-4">{isZh ? "暂无报告" : "No reports"}</p> : reports.map(r => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                {r.mood && <span className="text-xl">{MOOD_EMOJI[r.mood]}</span>}
                <p className="text-sm text-gray-400">{new Date(r.date).toLocaleDateString()}</p>
              </div>
              <p className="text-base text-gray-800">{r.summary}</p>
              {r.scripture && <p className="text-sm text-blue-600 mt-1 italic">{r.scripture}</p>}
              {r.topics && r.topics.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {r.topics.map((t: string, i: number) => <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">{t}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "feedback" && (
        <div className="space-y-3">
          {feedback.length === 0 ? <p className="text-center text-gray-400 py-4">{isZh ? "暂无反馈" : "No feedback"}</p> : feedback.map((f, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{"\u2b50".repeat(f.rating)}</span>
                <span className="text-sm text-gray-400">{new Date(f.date).toLocaleDateString()}</span>
              </div>
              {f.helped && <p className="text-base text-gray-700 italic">&ldquo;{f.helped}&rdquo;</p>}
              {f.emotional && <p className="text-sm text-gray-400 mt-1">{isZh ? "心情" : "Feeling"}: {f.emotional.replace(/_/g, " ")}</p>}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function SeniorProfilePage() {
  return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><SeniorProfileContent /></Suspense>;
}
