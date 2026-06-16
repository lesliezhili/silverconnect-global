"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";

const MOOD_EMOJI: Record<string, string> = { joyful: "\ud83d\ude0a", peaceful: "\u262e\ufe0f", struggling: "\ud83d\ude1f", grieving: "\ud83d\ude22" };

interface Senior { id: string; name: string; phone: string | null; totalVisits: number; completedVisits: number; lastVisit: string | null; reportCount: number; lastMood: string | null; needsFollowUp: boolean; }

function SeniorsListContent() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isZh = locale.startsWith("zh");
  const [seniors, setSeniors] = useState<Senior[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "followup" | "recent">("all");

  useEffect(() => { fetch("/api/provider/seniors").then(r => r.json()).then(d => { if (d.success) setSeniors(d.seniors || []); }).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="p-6 text-center text-xl">{isZh ? "\u52a0\u8f7d\u4e2d..." : "Loading..."}</div>;

  const recentCount = useMemo(() => {
    const cutoff = new Date(Date.now() - 14 * 86400000);
    return seniors.filter(s => s.lastVisit && new Date(s.lastVisit) > cutoff).length;
  }, [seniors]);
  const filtered = useMemo(() => {
    const cutoff = new Date(Date.now() - 14 * 86400000);
    if (filter === "followup") return seniors.filter(s => s.needsFollowUp);
    if (filter === "recent") return seniors.filter(s => s.lastVisit && new Date(s.lastVisit) > cutoff);
    return seniors;
  }, [filter, seniors]);

  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{isZh ? "\u6211\u7684\u957f\u8005" : "My Seniors"}</h1>
      <p className="text-lg text-gray-500 mb-4">{seniors.length} {isZh ? "\u4f4d\u957f\u8005" : "seniors served"}</p>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {([["all","\u5168\u90e8","All"],["followup","\u9700\u8ddf\u8fdb","Follow-up"],["recent","\u8fd1\u671f","Recent"]] as const).map(([key,zh,en]) => (
          <button key={key} onClick={() => setFilter(key as "all"|"followup"|"recent")}
            className={"px-4 py-2 rounded-full text-base font-medium whitespace-nowrap " + (filter === key ? "bg-purple-100 text-purple-700 border-2 border-purple-300" : "bg-gray-100 text-gray-600 border-2 border-transparent")}>
            {isZh ? zh : en} ({key === "followup" ? seniors.filter(s=>s.needsFollowUp).length : key === "recent" ? recentCount : seniors.length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-8 text-center"><p className="text-5xl mb-4">\ud83d\udc75</p><p className="text-xl text-gray-500">{isZh ? "\u6682\u65e0\u957f\u8005" : "No seniors found"}</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <button key={s.id} onClick={() => router.push("/" + locale + "/provider/seniors/" + s.id)}
              className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-left flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-purple-600">{(s.name||"?")[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-gray-800 truncate">{s.name}</p>
                  {s.lastMood && <span className="text-lg">{MOOD_EMOJI[s.lastMood]||""}</span>}
                  {s.needsFollowUp && <span className="text-sm bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">\u26a0\ufe0f</span>}
                </div>
                <p className="text-sm text-gray-400">{s.completedVisits} {isZh ? "\u6b21\u63a2\u8bbf" : "visits"}{s.lastVisit && (" \u2022 " + new Date(s.lastVisit).toLocaleDateString())}</p>
              </div>
              <span className="text-gray-300 text-xl">\u203a</span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}

export default function SeniorsListPage() { return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><SeniorsListContent /></Suspense>; }
