"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";

interface Goals { visits: number; prayerReports: number; seniors: number; personalGoal: string | null; }
interface Progress { visits: number; prayerReports: number; seniors: number; }

function GoalRing({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const pct = Math.min(100, goal > 0 ? (current / goal) * 100 : 0);
  const radius = 40; const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="text-center">
      <svg width="100" height="100" className="mx-auto">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 50 50)" className="transition-all duration-700" />
        <text x="50" y="46" textAnchor="middle" className="text-xl font-bold" fill="#1f2937" fontSize="18">{current}</text>
        <text x="50" y="64" textAnchor="middle" fill="#6b7280" fontSize="12">/{goal}</text>
      </svg>
      <p className="text-sm font-medium text-gray-600 mt-1">{label}</p>
    </div>
  );
}

function GoalsContent() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isZh = locale.startsWith("zh");

  const [goals, setGoals] = useState<Goals>({ visits: 3, prayerReports: 3, seniors: 2, personalGoal: null });
  const [progress, setProgress] = useState<Progress>({ visits: 0, prayerReports: 0, seniors: 0 });
  const [streak, setStreak] = useState(0);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/provider/goals").then(r => r.json()).then(data => {
      if (data.success) { setGoals(data.goals); setProgress(data.progress); setStreak(data.streak); }
    }).finally(() => setLoading(false));
  }, []);

  const saveGoals = async () => {
    await fetch("/api/provider/goals", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(goals),
    });
    setEditing(false);
  };

  if (loading) return <div className="p-6 text-center text-xl">{isZh ? "加载中..." : "Loading..."}</div>;

  const allMet = progress.visits >= goals.visits && progress.prayerReports >= goals.prayerReports && progress.seniors >= goals.seniors;

  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{isZh ? "每周目标" : "Weekly Goals"}</h1>
      <p className="text-lg text-gray-500 mb-6">{isZh ? "追踪您的事工进展" : "Track your ministry progress"}</p>

      {/* Streak */}
      {streak > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center mb-6">
          <p className="text-3xl">\ud83d\udd25</p>
          <p className="text-xl font-bold text-amber-700">{streak} {isZh ? "周连续达标" : "week streak!"}</p>
        </div>
      )}

      {/* All goals met celebration */}
      {allMet && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center mb-6">
          <p className="text-4xl mb-2">\ud83c\udf89</p>
          <p className="text-xl font-bold text-emerald-700">{isZh ? "本周目标全部完成！" : "All goals met this week!"}</p>
          <p className="text-base text-emerald-600 mt-1">{isZh ? "做得好，上帝看到了你的忠心。" : "Well done! God sees your faithfulness."}</p>
        </div>
      )}

      {/* Progress Rings */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <GoalRing label={isZh ? "探访" : "Visits"} current={progress.visits} goal={goals.visits} color="#7c3aed" />
        <GoalRing label={isZh ? "报告" : "Reports"} current={progress.prayerReports} goal={goals.prayerReports} color="#2563eb" />
        <GoalRing label={isZh ? "长者" : "Seniors"} current={progress.seniors} goal={goals.seniors} color="#059669" />
      </div>

      {/* Personal goal */}
      {goals.personalGoal && !editing && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-purple-600">{isZh ? "本周个人目标" : "Personal Goal"}</p>
          <p className="text-lg text-purple-800">{goals.personalGoal}</p>
        </div>
      )}

      {/* Edit Goals */}
      {editing ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 mb-6">
          <h3 className="text-xl font-semibold">{isZh ? "设定目标" : "Set Goals"}</h3>
          {[
            { key: "visits" as const, label: isZh ? "每周探访次数" : "Visits per week" },
            { key: "prayerReports" as const, label: isZh ? "祷告报告数" : "Prayer reports" },
            { key: "seniors" as const, label: isZh ? "服务长者数" : "Seniors served" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-lg text-gray-700">{label}</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setGoals({ ...goals, [key]: Math.max(1, goals[key] - 1) })}
                  className="w-10 h-10 bg-gray-100 rounded-full text-xl font-bold">-</button>
                <span className="text-2xl font-bold w-8 text-center">{goals[key]}</span>
                <button onClick={() => setGoals({ ...goals, [key]: goals[key] + 1 })}
                  className="w-10 h-10 bg-gray-100 rounded-full text-xl font-bold">+</button>
              </div>
            </div>
          ))}
          <div>
            <label className="text-base text-gray-600">{isZh ? "个人目标（可选）" : "Personal goal (optional)"}</label>
            <input value={goals.personalGoal || ""} onChange={e => setGoals({ ...goals, personalGoal: e.target.value || null })}
              placeholder={isZh ? "例如：多读一章圣经" : "e.g., Read one more Bible chapter"}
              className="w-full p-3 border border-gray-300 rounded-xl text-lg mt-1" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditing(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-lg font-medium">{isZh ? "取消" : "Cancel"}</button>
            <button onClick={saveGoals} className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-lg font-bold">{isZh ? "保存" : "Save"}</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="w-full py-4 bg-white border border-gray-200 rounded-xl text-lg text-gray-600 font-medium mb-6">
          {isZh ? "\u270f\ufe0f 修改目标" : "\u270f\ufe0f Edit Goals"}
        </button>
      )}

      {/* Encouragement */}
      <div className="text-center mt-4">
        <p className="text-base text-gray-400 italic">
          {isZh ? "\u201c你的劳苦在主里面不是徒然的。\u201d" : "\u201cYour labour in the Lord is not in vain.\u201d"}
        </p>
        <p className="text-sm text-gray-300">{isZh ? "\u2014 哥林多前书 15:58" : "\u2014 1 Corinthians 15:58"}</p>
      </div>
    </main>
  );
}

export default function GoalsPage() {
  return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><GoalsContent /></Suspense>;
}
