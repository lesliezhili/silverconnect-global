"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";

interface Devotional { type: string; title: string; scripture: string; reference: string; prayer: string; reflection: string; hymn?: string; }

const LABELS: Record<string, Record<string, string>> = {
  en: { today:"Today", morning:"Morning", noon:"Noon", afternoon:"Afternoon", evening:"Evening", meal:"Meal Prayer", sunday:"Sunday", title:"Daily Bible & Prayer", subtitle:"Morning, Noon, Afternoon & Evening", scripture:"Scripture", prayer:"Prayer", reflection:"Reflection" },
  zh: { today:"\u4eca\u5929", morning:"\u6668\u7977", noon:"\u5348\u7977", afternoon:"\u5348\u5f8c", evening:"\u665a\u7977", meal:"\u996d\u524d\u7977\u544a", sunday:"\u4e3b\u65e5", title:"\u6bcf\u65e5\u7075\u7cae", subtitle:"\u6668\u5348\u665a\u4e09\u65f6\u7977\u544a", scripture:"\u7ecf\u6587", prayer:"\u7977\u544a", reflection:"\u7075\u4fee\u9ed8\u60f3" },
  zh_tw: { today:"\u4eca\u5929", morning:"\u6668\u79b1", noon:"\u5348\u79b1", afternoon:"\u5348\u5f8c", evening:"\u665a\u79b1", meal:"\u98ef\u524d\u79b1\u544a", sunday:"\u4e3b\u65e5", title:"\u6bcf\u65e5\u9748\u7ce7", subtitle:"\u6668\u5348\u665a\u4e09\u6642\u79b1\u544a", scripture:"\u7d93\u6587", prayer:"\u79b1\u544a", reflection:"\u9748\u4fee\u9ed8\u60f3" },
  th: { today:"\u0e27\u0e31\u0e19\u0e19\u0e35\u0e49", morning:"\u0e40\u0e0a\u0e49\u0e32", noon:"\u0e40\u0e17\u0e35\u0e48\u0e22\u0e07", afternoon:"\u0e1a\u0e48\u0e32\u0e22", evening:"\u0e40\u0e22\u0e47\u0e19", meal:"\u0e2d\u0e18\u0e34\u0e29\u0e10\u0e32\u0e19\u0e01\u0e48\u0e2d\u0e19\u0e2d\u0e32\u0e2b\u0e32\u0e23", sunday:"\u0e27\u0e31\u0e19\u0e2d\u0e32\u0e17\u0e34\u0e15\u0e22\u0e4c", title:"\u0e1e\u0e23\u0e30\u0e04\u0e31\u0e21\u0e20\u0e35\u0e23\u0e4c\u0e1b\u0e23\u0e30\u0e08\u0e33\u0e27\u0e31\u0e19", subtitle:"\u0e40\u0e0a\u0e49\u0e32 \u0e01\u0e25\u0e32\u0e07\u0e27\u0e31\u0e19 \u0e40\u0e22\u0e47\u0e19", scripture:"\u0e1e\u0e23\u0e30\u0e04\u0e31\u0e21\u0e20\u0e35\u0e23\u0e4c", prayer:"\u0e2d\u0e18\u0e34\u0e29\u0e10\u0e32\u0e19", reflection:"\u0e02\u0e49\u0e2d\u0e04\u0e34\u0e14" },
  ko: { today:"\uc624\ub298", morning:"\uc544\uce68", noon:"\uc815\uc624", afternoon:"\uc624\ud6c4", evening:"\uc800\ub155", meal:"\uc2dd\uc0ac \uae30\ub3c4", sunday:"\uc8fc\uc77c", title:"\ub9e4\uc77c \uc131\uacbd \ub9d0\uc500", subtitle:"\uc544\uce68, \uc815\uc624, \uc800\ub155 \uae30\ub3c4", scripture:"\uc131\uacbd", prayer:"\uae30\ub3c4", reflection:"\ubbc5\uc0c1" },
  ja: { today:"\u4eca\u65e5", morning:"\u671d", noon:"\u663c", afternoon:"\u5348\u5f8c", evening:"\u5915", meal:"\u98df\u524d\u306e\u7948\u308a", sunday:"\u65e5\u66dc", title:"\u65e5\u3005\u306e\u307f\u3053\u3068\u3070", subtitle:"\u671d\u30fb\u663c\u30fb\u5915\u306e\u7948\u308a", scripture:"\u8056\u53e5", prayer:"\u7948\u308a", reflection:"\u9ed9\u60f3" },
  vi: { today:"Hôm nay", morning:"Sáng", noon:"Trưa", afternoon:"Chiều", evening:"Tối", meal:"Cầu nguyện trước bữa ăn", sunday:"Chủ nhật", title:"Kinh Thánh & Cầu nguyện hàng ngày", subtitle:"Sáng, Trưa, Chiều & Tối", scripture:"Kinh Thánh", prayer:"Cầu nguyện", reflection:"Suy ngẫm" },
};

function DevotionalContent() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const lk = locale.startsWith("zh") ? (locale === "zh_tw" ? "zh_tw" : "zh") : locale;
  const L = LABELS[lk] || LABELS.en;
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("auto");
  const [season, setSeason] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");

  const fetchDevotional = async (type?: string) => {
    setLoading(true);
    const lang = locale.startsWith("zh") ? "zh" : locale;
    const url = "/api/devotional?lang=" + lang + (type && type !== "auto" ? "&type=" + type : "");
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) { setDevotional(data.devotional); setSeason(data.season || ""); setDayOfWeek(data.dayOfWeek || ""); }
    setLoading(false);
  };
  useEffect(() => { fetchDevotional(); }, []);

  const tabs = [
    { key: "auto", label: L.today, icon: "\ud83d\udcc5" },
    { key: "morning", label: L.morning, icon: "\ud83c\udf05" },
    { key: "noon", label: L.noon, icon: "\u2600\ufe0f" },
    { key: "afternoon", label: L.afternoon || "Afternoon", icon: "🌤️" },
    { key: "evening", label: L.evening, icon: "\ud83c\udf19" },
    { key: "meal", label: L.meal, icon: "\ud83c\udf5e" },
    { key: "sunday", label: L.sunday, icon: "\u26ea" },
  ];
  const onTab = (key: string) => { setActiveTab(key); fetchDevotional(key === "auto" ? undefined : key); };
  const typeIcon = (t: string) => ({ morning:"\ud83c\udf05", noon:"\u2600\ufe0f", evening:"\ud83c\udf19", meal:"\ud83c\udf5e", sunday:"\u26ea" }[t] || "\ud83d\udcc5");

  if (loading) return <main className="max-w-lg mx-auto p-6 text-center"><div className="text-5xl mb-4">\u271d</div><p className="text-xl text-gray-500">{L.today}...</p></main>;

  return (
    <main className="max-w-lg mx-auto p-4 pb-24">
      <div className="text-center mb-5">
        <div className="text-4xl mb-2">\u271d</div>
        <h1 className="text-3xl font-bold text-gray-900">{L.title}</h1>
        <p className="text-lg text-gray-500 mt-1">{L.subtitle}</p>
        <p className="text-base text-gray-400">{dayOfWeek} {season && "\u2022 " + season}</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => onTab(t.key)} className={"flex flex-col items-center px-4 py-3 rounded-2xl text-base font-medium min-w-[64px] " + (activeTab === t.key ? "bg-indigo-600 text-white shadow-lg" : "bg-gray-100 text-gray-700")}>
            <span className="text-xl mb-0.5">{t.icon}</span>
            <span className="text-sm">{t.label}</span>
          </button>
        ))}
      </div>

      {devotional && (
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-indigo-900">{devotional.title}</h2>
              <span className="text-2xl">{typeIcon(devotional.type)}</span>
            </div>
          </div>
          <div className="bg-white border-2 border-amber-200 rounded-2xl p-6">
            <p className="text-sm font-bold text-amber-700 uppercase mb-2">\ud83d\udcd6 {L.scripture}</p>
            <p className="text-xl leading-relaxed text-gray-800 italic">&ldquo;{devotional.scripture}&rdquo;</p>
            <p className="text-right text-base text-amber-700 font-semibold mt-3">\u2014 {devotional.reference}</p>
          </div>
          <div className="bg-white border-2 border-emerald-200 rounded-2xl p-6">
            <p className="text-sm font-bold text-emerald-700 uppercase mb-2">\ud83d\ude4f {L.prayer}</p>
            <p className="text-lg leading-relaxed text-gray-700">{devotional.prayer}</p>
          </div>
          <div className="bg-white border-2 border-blue-200 rounded-2xl p-6">
            <p className="text-sm font-bold text-blue-700 uppercase mb-2">\ud83d\udcad {L.reflection}</p>
            <p className="text-lg leading-relaxed text-gray-700">{devotional.reflection}</p>
          </div>
          {devotional.hymn && (
            <div className="bg-white border-2 border-purple-200 rounded-2xl p-6">
              <p className="text-sm font-bold text-purple-700 uppercase mb-2">\ud83c\udfb5 Hymn</p>
              <p className="text-lg text-gray-700">{devotional.hymn}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
export default function DevotionalPage() { return <Suspense fallback={<div className="p-6 text-center text-xl">\u271d</div>}><DevotionalContent /></Suspense>; }
