"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";

interface Achievement { id: string; name: string; nameZh: string; icon: string; desc: string; descZh: string; threshold: number; metric: string; unlocked: boolean; unlockedAt: string | null; progress: number; }

function AchievementsContent() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isZh = locale.startsWith("zh");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [total, setTotal] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  const [newOnes, setNewOnes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/provider/achievements").then(r => r.json()).then(d => {
      if (d.success) { setAchievements(d.achievements); setTotal(d.totalAchievements); setUnlocked(d.totalUnlocked); setNewOnes(d.newlyUnlocked || []); }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-xl">{isZh ? "\u52a0\u8f7d\u4e2d..." : "Loading..."}</div>;

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="text-center mb-6">
        <p className="text-4xl mb-2">\ud83c\udfc5</p>
        <h1 className="text-3xl font-bold text-gray-900">{isZh ? "\u6210\u5c31\u5fbd\u7ae0" : "Achievements"}</h1>
        <p className="text-lg text-gray-500">{unlocked}/{total} {isZh ? "\u5df2\u89e3\u9501" : "unlocked"}</p>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-200 rounded-full h-3 mb-6">
        <div className="bg-gradient-to-r from-purple-500 to-amber-400 h-3 rounded-full transition-all" style={{ width: `${(unlocked/total)*100}%` }}></div>
      </div>

      {/* New unlocks celebration */}
      {newOnes.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 text-center mb-6 animate-bounce">
          <p className="text-3xl mb-2">\ud83c\udf89</p>
          <p className="text-xl font-bold text-amber-700">{isZh ? "\u65b0\u89e3\u9501!" : "New unlock!"}</p>
          <div className="flex justify-center gap-2 mt-2">
            {achievements.filter(a => newOnes.includes(a.id)).map(a => (
              <span key={a.id} className="text-3xl">{a.icon}</span>
            ))}
          </div>
        </div>
      )}

      {/* Achievement grid */}
      <div className="space-y-3">
        {achievements.map(a => (
          <div key={a.id} className={"rounded-2xl p-4 flex items-center gap-4 " + (a.unlocked ? "bg-white border-2 border-purple-200" : "bg-gray-50 border border-gray-200 opacity-60")}>
            <div className={"w-14 h-14 rounded-full flex items-center justify-center text-2xl " + (a.unlocked ? "bg-purple-100" : "bg-gray-200")}>
              {a.unlocked ? a.icon : "\ud83d\udd12"}
            </div>
            <div className="flex-1 min-w-0">
              <p className={"text-lg font-semibold " + (a.unlocked ? "text-gray-800" : "text-gray-400")}>{isZh ? a.nameZh : a.name}</p>
              <p className="text-sm text-gray-400">{isZh ? a.descZh : a.desc}</p>
              {!a.unlocked && (
                <div className="mt-1">
                  <div className="bg-gray-200 rounded-full h-2 w-32">
                    <div className="bg-purple-400 h-2 rounded-full" style={{ width: `${(a.progress/a.threshold)*100}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{a.progress}/{a.threshold}</p>
                </div>
              )}
            </div>
            {a.unlocked && <span className="text-green-500 text-xl">\u2713</span>}
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <p className="text-base text-gray-400 italic">{isZh ? "\u201c\u5f97\u80dc\u7684\uff0c\u6211\u5fc5\u5c06\u90a3\u751f\u547d\u7684\u51a0\u5180\u8d50\u7ed9\u4ed6\u201d" : "\u201cBe faithful unto death, and I will give you the crown of life\u201d"}</p>
        <p className="text-sm text-gray-300">{isZh ? "\u2014 \u542f\u793a\u5f55 2:10" : "\u2014 Revelation 2:10"}</p>
      </div>
    </main>
  );
}

export default function AchievementsPage() { return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><AchievementsContent /></Suspense>; }
