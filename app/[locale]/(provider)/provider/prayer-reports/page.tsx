"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";

interface Report {
  id: string; bookingId: string; summary: string; prayerTopics: string[] | null;
  scriptureShared: string | null; attendees: number; mood: string | null;
  followUpNeeded: boolean; followUpNotes: string | null; privateNote: string | null;
  customerName: string | null; serviceCode: string | null; scheduledAt: string | null; createdAt: string;
}
interface Stats { totalReports: number; totalAttendees: number; followUps: number; seniorsServed: number; }

const MOOD_EMOJI: Record<string, string> = { joyful: "\ud83d\ude0a", peaceful: "\u262e\ufe0f", struggling: "\ud83d\ude1f", grieving: "\ud83d\ude22" };

function PrayerReportsContent() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isZh = locale.startsWith("zh");

  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/provider/prayer-reports")
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setReports(data.reports || []);
          setStats(data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-xl">{isZh ? "加载中..." : "Loading..."}</div>;

  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{isZh ? "祷告报告记录" : "Prayer Reports"}</h1>
      <p className="text-lg text-gray-500 mb-6">{isZh ? "您的事工探访历史" : "Your ministry visit history"}</p>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-purple-700">{stats.totalReports}</p>
            <p className="text-xs text-purple-600">{isZh ? "报告" : "Reports"}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.totalAttendees}</p>
            <p className="text-xs text-blue-600">{isZh ? "参加" : "Attended"}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-700">{stats.seniorsServed}</p>
            <p className="text-xs text-emerald-600">{isZh ? "长者" : "Seniors"}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.followUps}</p>
            <p className="text-xs text-amber-600">{isZh ? "跟进" : "Follow-up"}</p>
          </div>
        </div>
      )}

      {/* Reports list */}
      {reports.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">\ud83d\udcdd</div>
          <p className="text-xl text-gray-500">{isZh ? "暂无祷告报告" : "No prayer reports yet"}</p>
          <p className="text-base text-gray-400 mt-2">{isZh ? "完成探访后，您的报告将显示在这里。" : "After completing a visit, your reports will appear here."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => {
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {/* Header — tap to expand */}
                <button onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="w-full p-4 text-left flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {r.mood && <span className="text-xl">{MOOD_EMOJI[r.mood] || ""}</span>}
                      <p className="text-lg font-semibold text-gray-800">{r.customerName || (isZh ? "长者" : "Senior")}</p>
                    </div>
                    <p className="text-base text-gray-500">
                      {r.serviceCode?.replace(/_/g, " ") || (isZh ? "信仰服务" : "Faith service")}
                      {" \u2022 "}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-gray-400 text-xl">{isOpen ? "\u25b2" : "\u25bc"}</div>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                    {/* Summary */}
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">{isZh ? "摘要" : "Summary"}</p>
                      <p className="text-base text-gray-800">{r.summary}</p>
                    </div>

                    {/* Scripture */}
                    {r.scriptureShared && (
                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-sm font-medium text-blue-600 mb-1">{isZh ? "经文" : "Scripture"}</p>
                        <p className="text-base text-blue-800 italic">{r.scriptureShared}</p>
                      </div>
                    )}

                    {/* Topics */}
                    {r.prayerTopics && r.prayerTopics.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">{isZh ? "祷告主题" : "Topics"}</p>
                        <div className="flex flex-wrap gap-1">
                          {r.prayerTopics.map((t, i) => (
                            <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{r.attendees} {isZh ? "人参加" : "attended"}</span>
                      {r.followUpNeeded && (
                        <span className="text-amber-600 font-medium">\u26a0\ufe0f {isZh ? "需跟进" : "Follow-up needed"}</span>
                      )}
                    </div>

                    {/* Follow-up notes */}
                    {r.followUpNeeded && r.followUpNotes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-sm font-medium text-amber-700">{isZh ? "跟进备注" : "Follow-up"}</p>
                        <p className="text-base text-amber-800">{r.followUpNotes}</p>
                      </div>
                    )}

                    {/* Private note (only visible to volunteer) */}
                    {r.privateNote && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                        <p className="text-sm font-medium text-gray-500">\ud83d\udd12 {isZh ? "私人代祷" : "Private Note"}</p>
                        <p className="text-base text-gray-700 italic">{r.privateNote}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer verse */}
      <div className="mt-8 text-center">
        <p className="text-base text-gray-400 italic">
          {isZh
            ? "\u201c你们为我这弟兄中最小的一个所做的，就是为我做了。\u201d"
            : "\u201cWhatever you did for one of the least of these, you did for me.\u201d"}
        </p>
        <p className="text-sm text-gray-300 mt-1">{isZh ? "\u2014 马太福音 25:40" : "\u2014 Matthew 25:40"}</p>
      </div>
    </main>
  );
}

export default function PrayerReportsPage() {
  return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><PrayerReportsContent /></Suspense>;
}
