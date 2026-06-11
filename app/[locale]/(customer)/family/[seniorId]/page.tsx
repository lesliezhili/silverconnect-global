"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";

const MOOD_EMOJI: Record<string, string> = { joyful: "\ud83d\ude0a", peaceful: "\u262e\ufe0f", struggling: "\ud83d\ude1f", grieving: "\ud83d\ude22" };

function SeniorDetailContent() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const seniorId = params?.seniorId as string;
  const t = (en: string, zh: string, th?: string, ko?: string, ja?: string) => {
    if (locale.startsWith("zh")) return zh;
    if (locale === "th") return th || en;
    if (locale === "ko") return ko || en;
    if (locale === "ja") return ja || en;
    return en;
  };
  const isZh = locale.startsWith("zh");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming"|"history"|"wellbeing">("upcoming");

  useEffect(() => {
    fetch("/api/family/" + seniorId).then(r => r.json()).then(d => { if (d.success) setData(d); }).finally(() => setLoading(false));
  }, [seniorId]);

  if (loading) return <div className="p-6 text-center text-xl">{isZh ? "\u52a0\u8f7d\u4e2d..." : "Loading..."}</div>;
  if (!data) return <div className="p-6 text-center text-red-500">{isZh ? "\u65e0\u6743\u8bbf\u95ee" : "Access denied or not linked"}</div>;

  const senior = data.senior as { name: string; phone: string; memberSince: string };
  const upcoming = data.upcoming as { id: string; scheduledAt: string; service: string; volunteer: string }[];
  const visits = data.visits as { id: string; status: string; scheduledAt: string; completedAt: string; service: string; volunteer: string }[];
  const wellbeing = data.wellbeing as { mood: string; attendees: number; followUp: boolean; date: string }[];
  const surveys = data.surveys as { rating: number; emotional: string; safe: boolean; date: string }[];

  return (
    <main className="max-w-lg mx-auto p-6">
      {/* Senior header */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl font-bold text-purple-600">{(senior.name||"?")[0]?.toUpperCase()}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{senior.name || (isZh ? "\u4eb2\u4eba" : "Senior")}</h1>
        {senior.phone && <p className="text-lg text-gray-500">{senior.phone}</p>}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{upcoming.length}</p>
          <p className="text-xs text-blue-600">{isZh ? "\u5373\u5c06" : "Upcoming"}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-700">{visits.filter(v => v.status === "completed").length}</p>
          <p className="text-xs text-emerald-600">{isZh ? "\u5b8c\u6210" : "Completed"}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-purple-700">{wellbeing.length > 0 ? MOOD_EMOJI[wellbeing[0].mood] || "\u2014" : "\u2014"}</p>
          <p className="text-xs text-purple-600">{isZh ? "\u5fc3\u60c5" : "Mood"}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {([["upcoming","\u5373\u5c06","Upcoming"],["history","\u5386\u53f2","History"],["wellbeing","\u5065\u5eb7","Wellbeing"]] as const).map(([k,zh,en]) => (
          <button key={k} onClick={() => setTab(k)}
            className={"flex-1 py-3 text-base font-medium border-b-2 " + (tab === k ? "border-purple-600 text-purple-600" : "border-transparent text-gray-400")}>
            {isZh ? zh : en}
          </button>
        ))}
      </div>

      {/* Upcoming */}
      {tab === "upcoming" && (
        <div className="space-y-3">
          {upcoming.length === 0 ? <p className="text-center text-gray-400 py-8">{isZh ? "\u6682\u65e0\u5373\u5c06\u5230\u6765\u7684\u63a2\u8bbf" : "No upcoming visits"}</p> : upcoming.map(u => (
            <div key={u.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-medium text-gray-800">{u.service?.replace(/_/g, " ")}</p>
                  <p className="text-sm text-gray-400">{isZh ? "\u5fd7\u613f\u8005" : "Volunteer"}: {u.volunteer || "TBD"}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-medium text-purple-600">{new Date(u.scheduledAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-400">{new Date(u.scheduledAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="space-y-2">
          {visits.length === 0 ? <p className="text-center text-gray-400 py-8">{isZh ? "\u6682\u65e0\u8bb0\u5f55" : "No visit history"}</p> : visits.map(v => (
            <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="text-base text-gray-700">{v.service?.replace(/_/g, " ")}</p>
                <p className="text-xs text-gray-400">{v.volunteer} \u2022 {new Date(v.scheduledAt).toLocaleDateString()}</p>
              </div>
              <span className={"px-2 py-1 rounded-full text-xs font-medium " + (v.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>{v.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Wellbeing */}
      {tab === "wellbeing" && (
        <div className="space-y-3">
          {surveys.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-emerald-700 mb-1">{isZh ? "\u6700\u8fd1\u53cd\u9988" : "Latest Feedback"}</p>
              <p className="text-lg">{"\u2b50".repeat(surveys[0].rating)} {surveys[0].safe ? "\u2022 \u2705 Felt safe" : ""}</p>
              <p className="text-sm text-gray-500">{isZh ? "\u60c5\u7eea" : "Emotional"}: {(surveys[0].emotional || "").replace(/_/g, " ")}</p>
            </div>
          )}
          {wellbeing.length === 0 && surveys.length === 0 ? <p className="text-center text-gray-400 py-8">{isZh ? "\u6682\u65e0\u6570\u636e" : "No data yet"}</p> : wellbeing.map((w, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">{MOOD_EMOJI[w.mood] || "\u2014"}</span>
              <div className="flex-1">
                <p className="text-base text-gray-700 capitalize">{w.mood}</p>
                <p className="text-xs text-gray-400">{new Date(w.date).toLocaleDateString()} \u2022 {w.attendees} {isZh ? "\u4eba" : "attended"}</p>
              </div>
              {w.followUp && <span className="text-sm bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">\u26a0\ufe0f</span>}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function SeniorFamilyDetailPage() { return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><SeniorDetailContent /></Suspense>; }
