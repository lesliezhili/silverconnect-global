"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";

const MOOD_OPTIONS = [
  { code: "joyful", emoji: "\ud83d\ude0a", en: "Joyful", zh: "喜乐" },
  { code: "peaceful", emoji: "\u262e\ufe0f", en: "Peaceful", zh: "平安" },
  { code: "struggling", emoji: "\ud83d\ude1f", en: "Struggling", zh: "挣扎" },
  { code: "grieving", emoji: "\ud83d\ude22", en: "Grieving", zh: "悲伤" },
];

const TOPIC_SUGGESTIONS = [
  { en: "Health", zh: "健康" },
  { en: "Family", zh: "家庭" },
  { en: "Loneliness", zh: "孤独" },
  { en: "Grief", zh: "悲伤" },
  { en: "Gratitude", zh: "感恩" },
  { en: "Guidance", zh: "引导" },
  { en: "Peace", zh: "平安" },
  { en: "Healing", zh: "医治" },
  { en: "Provision", zh: "供应" },
  { en: "Relationships", zh: "人际关系" },
];

function PrayerReportContent() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;
  const locale = (params?.locale as string) || "en";
  const isZh = locale.startsWith("zh");

  const [step, setStep] = useState(1);
  const [summary, setSummary] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [scripture, setScripture] = useState("");
  const [attendees, setAttendees] = useState(1);
  const [mood, setMood] = useState("");
  const [followUp, setFollowUp] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const toggleTopic = (topic: string) => {
    setTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
  };

  const addCustomTopic = () => {
    if (customTopic.trim() && !topics.includes(customTopic.trim())) {
      setTopics([...topics, customTopic.trim()]);
      setCustomTopic("");
    }
  };

  const submit = async () => {
    if (!summary.trim()) { setError(isZh ? "请填写探访摘要" : "Please write a visit summary"); return; }
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/bookings/" + bookingId + "/complete-faith", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: summary.trim(),
        prayerTopics: topics.length > 0 ? topics : undefined,
        scriptureShared: scripture || undefined,
        attendees,
        mood: mood || undefined,
        followUpNeeded: followUp,
        followUpNotes: followUp ? followUpNotes : undefined,
        privatePrayerNote: privateNote || undefined,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setDone(true);
    } else {
      setError(data.error || "Something went wrong");
    }
    setSubmitting(false);
  };

  if (done) {
    return (
      <main className="max-w-lg mx-auto p-6 text-center">
        <div className="text-6xl mb-4">\u2705</div>
        <h1 className="text-3xl font-bold text-emerald-800 mb-4">
          {isZh ? "祷告报告已提交" : "Prayer Report Submitted"}
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          {isZh ? "感谢您的服事！愿上帝祝福您的事工。" : "Thank you for serving! God bless your ministry."}
        </p>
        <p className="text-lg text-gray-400 italic mb-8">
          {isZh ? '"你们为我这弟兄中最小的一个所做的，就是为我做了。" — 马太福音 25:40' : '"Whatever you did for one of the least of these, you did for me." — Matthew 25:40'}
        </p>
        <button onClick={() => router.push("/" + locale + "/provider/earnings")}
          className="w-full py-5 bg-emerald-600 text-white text-xl font-bold rounded-xl min-h-[64px]">
          {isZh ? "返回" : "Done"}
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isZh ? "祷告报告" : "Prayer Report"}
        </h1>
        <p className="text-lg text-gray-500 mt-2">
          {isZh ? `第${step}步，共4步` : `Step ${step} of 4`}
        </p>
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-lg">{error}</div>}

      {/* Step 1: Summary + Scripture */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-xl font-medium text-gray-800 mb-2">
              {isZh ? "探访摘要 *" : "Visit Summary *"}
            </label>
            <p className="text-base text-gray-400 mb-2">{isZh ? "简述这次探访的情况（对长者可见）" : "Brief description of the visit (visible to senior)"}</p>
            <textarea value={summary} onChange={e => setSummary(e.target.value)}
              placeholder={isZh ? "例如：和张奶奶一起读了诗篇23篇，为她的健康祷告…" : "e.g., Read Psalm 23 together, prayed for healing..."}
              rows={4} className="w-full p-4 border border-gray-300 rounded-xl text-lg resize-none focus:ring-2 focus:ring-purple-400" />
          </div>

          <div>
            <label className="block text-xl font-medium text-gray-800 mb-2">
              {isZh ? "分享的经文" : "Scripture Shared"}
            </label>
            <input value={scripture} onChange={e => setScripture(e.target.value)}
              placeholder={isZh ? "例如：诗篇 23:1-6" : "e.g., Psalm 23:1-6"}
              className="w-full p-4 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-purple-400" />
          </div>

          <button onClick={() => setStep(2)} disabled={!summary.trim()}
            className="w-full py-5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-xl font-bold rounded-xl min-h-[64px]">
            {isZh ? "下一步" : "Next"}
          </button>
        </div>
      )}

      {/* Step 2: Prayer Topics */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-xl font-medium text-gray-800 mb-3">
              {isZh ? "祷告主题" : "Prayer Topics"}
            </label>
            <div className="flex flex-wrap gap-2">
              {TOPIC_SUGGESTIONS.map(t => {
                const label = isZh ? t.zh : t.en;
                const selected = topics.includes(t.en);
                return (
                  <button key={t.en} onClick={() => toggleTopic(t.en)}
                    className={"px-4 py-3 rounded-full text-base font-medium border-2 min-h-[48px] " + (selected ? "bg-purple-100 border-purple-400 text-purple-700" : "bg-white border-gray-200 text-gray-600")}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom topic */}
          <div className="flex gap-2">
            <input value={customTopic} onChange={e => setCustomTopic(e.target.value)}
              placeholder={isZh ? "其他主题…" : "Other topic..."}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomTopic(); } }}
              className="flex-1 p-3 border border-gray-300 rounded-xl text-lg" />
            <button onClick={addCustomTopic} className="px-5 py-3 bg-purple-100 text-purple-700 rounded-xl text-lg font-medium min-h-[48px]">+</button>
          </div>

          {topics.length > 0 && (
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-sm text-purple-600 font-medium mb-1">{isZh ? "已选主题：" : "Selected:"}</p>
              <p className="text-base text-purple-800">{topics.join(", ")}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-4 bg-gray-100 text-gray-700 text-lg font-semibold rounded-xl">{isZh ? "返回" : "Back"}</button>
            <button onClick={() => setStep(3)} className="flex-1 py-4 bg-purple-600 text-white text-lg font-bold rounded-xl">{isZh ? "下一步" : "Next"}</button>
          </div>
        </div>
      )}

      {/* Step 3: Mood + Attendees */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <label className="block text-xl font-medium text-gray-800 mb-3">
              {isZh ? "长者探访后的情绪" : "Senior\u2019s Mood After Visit"}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {MOOD_OPTIONS.map(m => (
                <button key={m.code} onClick={() => setMood(m.code)}
                  className={"p-4 rounded-2xl text-center border-2 min-h-[72px] " + (mood === m.code ? "bg-purple-50 border-purple-400" : "bg-white border-gray-200")}>
                  <div className="text-3xl">{m.emoji}</div>
                  <div className="text-base mt-1">{isZh ? m.zh : m.en}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xl font-medium text-gray-800 mb-2">
              {isZh ? "参加人数" : "Attendees"}
            </label>
            <div className="flex items-center gap-4">
              <button onClick={() => setAttendees(Math.max(1, attendees - 1))}
                className="w-14 h-14 bg-gray-100 rounded-full text-2xl font-bold">-</button>
              <span className="text-3xl font-bold text-gray-800 w-12 text-center">{attendees}</span>
              <button onClick={() => setAttendees(attendees + 1)}
                className="w-14 h-14 bg-gray-100 rounded-full text-2xl font-bold">+</button>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-4 bg-gray-100 text-gray-700 text-lg font-semibold rounded-xl">{isZh ? "返回" : "Back"}</button>
            <button onClick={() => setStep(4)} className="flex-1 py-4 bg-purple-600 text-white text-lg font-bold rounded-xl">{isZh ? "下一步" : "Next"}</button>
          </div>
        </div>
      )}

      {/* Step 4: Follow-up + Private Note + Submit */}
      {step === 4 && (
        <div className="space-y-5">
          {/* Follow-up toggle */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-lg font-medium text-gray-800">
                {isZh ? "需要后续跟进？" : "Follow-up Needed?"}
              </label>
              <button onClick={() => setFollowUp(!followUp)}
                className={"w-16 h-9 rounded-full transition-all " + (followUp ? "bg-amber-500" : "bg-gray-300")}>
                <div className={"w-7 h-7 bg-white rounded-full shadow transition-transform " + (followUp ? "translate-x-8" : "translate-x-1")} />
              </button>
            </div>
            {followUp && (
              <textarea value={followUpNotes} onChange={e => setFollowUpNotes(e.target.value)}
                placeholder={isZh ? "跟进备注（例如：下周再次探访）" : "Follow-up notes (e.g., visit again next week)"}
                rows={2} className="w-full p-3 border border-amber-300 rounded-xl text-base resize-none mt-2" />
            )}
          </div>

          {/* Private prayer note */}
          <div>
            <label className="block text-lg font-medium text-gray-800 mb-2">
              {isZh ? "私人祷告笔记" : "Private Prayer Note"}
            </label>
            <p className="text-sm text-gray-400 mb-2">{isZh ? "仅您可见，不会分享给长者" : "Only visible to you, not shared with the senior"}</p>
            <textarea value={privateNote} onChange={e => setPrivateNote(e.target.value)}
              placeholder={isZh ? "您的个人代祷事项…" : "Your personal intercession notes..."}
              rows={3} className="w-full p-4 border border-gray-300 rounded-xl text-lg resize-none" />
          </div>

          {/* Review summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-500 mb-2">{isZh ? "报告摘要" : "Report Summary"}</p>
            <p className="text-base text-gray-700">{summary.substring(0, 100)}{summary.length > 100 ? "..." : ""}</p>
            {topics.length > 0 && <p className="text-sm text-purple-600 mt-1">{isZh ? "主题" : "Topics"}: {topics.join(", ")}</p>}
            {scripture && <p className="text-sm text-blue-600 mt-1">{isZh ? "经文" : "Scripture"}: {scripture}</p>}
            {mood && <p className="text-sm text-gray-500 mt-1">{isZh ? "情绪" : "Mood"}: {MOOD_OPTIONS.find(m => m.code === mood)?.emoji} {mood}</p>}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="flex-1 py-4 bg-gray-100 text-gray-700 text-lg font-semibold rounded-xl">{isZh ? "返回" : "Back"}</button>
            <button onClick={submit} disabled={submitting}
              className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xl font-bold rounded-xl min-h-[64px]">
              {submitting ? "..." : (isZh ? "提交报告" : "Submit Report")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function PrayerReportPage() {
  return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><PrayerReportContent /></Suspense>;
}
