"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";

interface Entry { userId: string; name: string; rank: number; score: number; level: string; badge: string; visits: number; reports: number; fiveStars: number; seniorsServed: number; isCurrentUser: boolean; }

function LeaderboardContent() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isZh = locale.startsWith("zh");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [period, setPeriod] = useState<"week"|"month"|"all">("all");
  const [myRank, setMyRank] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/provider/leaderboard?period=" + period).then(r => r.json()).then(d => {
      if (d.success) { setEntries(d.leaderboard || []); setMyRank(d.myRank); setMyScore(d.myScore); }
    }).finally(() => setLoading(false));
  }, [period]);

  const RANK_ICONS = ["\ud83e\udd47", "\ud83e\udd48", "\ud83e\udd49"];

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="text-center mb-6">
        <p className="text-4xl mb-2">\ud83c\udfc6</p>
        <h1 className="text-3xl font-bold text-gray-900">{isZh ? "\u5fd7\u613f\u8005\u6392\u884c\u699c" : "Leaderboard"}</h1>
        <p className="text-lg text-gray-500">{isZh ? "\u7adf\u4e89\u6fc0\u52b1\u4e92\u52a9\u670d\u52a1" : "Gamified ministry impact"}</p>
      </div>

      {/* My position highlight */}
      {myRank > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-4 text-center mb-6">
          <p className="text-sm text-purple-600 font-medium">{isZh ? "\u6211\u7684\u6392\u540d" : "Your Rank"}</p>
          <p className="text-4xl font-bold text-purple-700">#{myRank}</p>
          <p className="text-lg text-gray-600">{myScore} {isZh ? "\u5206" : "pts"}</p>
        </div>
      )}

      {/* Period toggle */}
      <div className="flex gap-2 mb-6 justify-center">
        {([["week","\u672c\u5468","Week"],["month","\u672c\u6708","Month"],["all","\u603b\u8ba1","All Time"]] as const).map(([key,zh,en]) => (
          <button key={key} onClick={() => setPeriod(key as "week"|"month"|"all")}
            className={"px-4 py-2 rounded-full text-base font-medium " + (period === key ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600")}>
            {isZh ? zh : en}
          </button>
        ))}
      </div>

      {loading ? <p className="text-center text-gray-400 py-4">{isZh ? "\u52a0\u8f7d\u4e2d..." : "Loading..."}</p> : (
        <div className="space-y-2">
          {entries.map((e, i) => (
            <div key={e.userId} className={"rounded-2xl p-4 flex items-center gap-3 " + (e.isCurrentUser ? "bg-purple-50 border-2 border-purple-300" : "bg-white border border-gray-200")}>
              {/* Rank */}
              <div className="w-10 text-center">
                {i < 3 ? <span className="text-2xl">{RANK_ICONS[i]}</span> : <span className="text-lg font-bold text-gray-400">#{e.rank}</span>}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{e.badge}</span>
                  <p className={"text-lg font-semibold truncate " + (e.isCurrentUser ? "text-purple-700" : "text-gray-800")}>
                    {e.name}{e.isCurrentUser ? (isZh ? " (\u6211)" : " (You)") : ""}
                  </p>
                </div>
                <p className="text-sm text-gray-400">{e.level} \u2022 {e.visits}v {e.reports}r {e.fiveStars}\u2b50 {e.seniorsServed}\ud83d\udc75</p>
              </div>

              {/* Score */}
              <div className="text-right">
                <p className="text-xl font-bold text-purple-600">{e.score}</p>
                <p className="text-xs text-gray-400">{isZh ? "\u5206" : "pts"}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scoring guide */}
      <div className="mt-8 bg-gray-50 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-600 mb-2">{isZh ? "\u8ba1\u5206\u89c4\u5219" : "Scoring"}</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
          <span>\ud83d\udccd {isZh ? "\u63a2\u8bbf" : "Visit"}: 10 pts</span>
          <span>\ud83d\udcdd {isZh ? "\u62a5\u544a" : "Report"}: 15 pts</span>
          <span>\u2b50 5-star: 5 pts</span>
          <span>\ud83d\udc75 {isZh ? "\u957f\u8005" : "Senior"}: 8 pts</span>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-500">
          <p>\ud83c\udf31 Beginner &rarr; \ud83e\udd1d Helper (50+) &rarr; \u2728 Shepherd (150+) &rarr; \ud83d\udee1\ufe0f Guardian (300+) &rarr; \ud83d\udc51 Champion (500+)</p>
        </div>
      </div>

      <div className="text-center mt-6">
        <p className="text-base text-gray-400 italic">{isZh ? "\u201c\u5404\u4eba\u8981\u7167\u6240\u5f97\u7684\u6069\u8d50\u5f7c\u6b64\u670d\u4e8b\u201d" : "\u201cEach of you should use whatever gift you have received to serve others\u201d"}</p>
        <p className="text-sm text-gray-300">{isZh ? "\u2014 \u5f7c\u5f97\u524d\u4e66 4:10" : "\u2014 1 Peter 4:10"}</p>
      </div>
    </main>
  );
}

export default function LeaderboardPage() { return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><LeaderboardContent /></Suspense>; }
