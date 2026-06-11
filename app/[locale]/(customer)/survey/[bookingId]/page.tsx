"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";

const EMOTIONS = [
  { code: "much_better", emoji: "\ud83d\ude0a", label: "Much Better", label_zh: "好很多" },
  { code: "better", emoji: "\ud83d\ude42", label: "A Bit Better", label_zh: "好一点" },
  { code: "same", emoji: "\ud83d\ude10", label: "About the Same", label_zh: "差不多" },
  { code: "worse", emoji: "\ud83d\ude1e", label: "Not Great", label_zh: "不太好" },
];

function SurveyContent() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;
  const locale = (params?.locale as string) || "en";
  const isZh = locale === "zh";

  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [feltSafe, setFeltSafe] = useState<boolean | null>(null);
  const [feltListened, setFeltListened] = useState<boolean | null>(null);
  const [visitLength, setVisitLength] = useState("");
  const [emotional, setEmotional] = useState("");
  const [whatHelped, setWhatHelped] = useState("");
  const [improvements, setImprovements] = useState("");
  const [bookAgain, setBookAgain] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const res = await fetch("/api/bookings/" + bookingId + "/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overallRating: rating, wouldRecommend: recommend, feltSafe, feltListenedTo: feltListened,
        visitLength, emotionalState: emotional, whatHelped: whatHelped || undefined,
        improvements: improvements || undefined, wouldBookAgain: bookAgain,
      }),
    });
    const data = await res.json();
    if (data.success) setDone(true);
    setSubmitting(false);
  };

  if (done) {
    return (
      <main className="max-w-lg mx-auto p-6 text-center">
        <div className="text-6xl mb-4">\ud83d\ude4f</div>
        <h1 className="text-3xl font-bold text-emerald-800 mb-4">{isZh ? "感谢您的反馈！" : "Thank You!"}</h1>
        <p className="text-xl text-gray-600 mb-8">{isZh ? "您的意见帮助我们更好地为您服务。" : "Your feedback helps us serve you better."}</p>
        <button onClick={() => router.push("/" + locale)}
          className="w-full py-5 bg-emerald-600 text-white text-xl font-bold rounded-xl min-h-[64px]">
          {isZh ? "返回首页" : "Back to Home"}
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{isZh ? "您的体验如何？" : "How Was Your Visit?"}</h1>
        <p className="text-lg text-gray-500 mt-2">{isZh ? "第" + step + "步，共3步" : "Step " + step + " of 3"}</p>
      </div>

      {/* Step 1: Rating + Safety */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <p className="text-xl font-medium text-gray-700 mb-3">{isZh ? "总体评分" : "Overall Rating"}</p>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setRating(n)}
                  className={"w-16 h-16 rounded-full text-3xl border-2 " + (rating >= n ? "bg-yellow-100 border-yellow-400" : "bg-gray-50 border-gray-200")}>
                  {rating >= n ? "\u2b50" : "\u2606"}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-lg">{isZh ? "我感到安全" : "I felt safe"}</p>
              <div className="flex gap-2">
                <button onClick={() => setFeltSafe(true)} className={"px-5 py-2 rounded-full text-lg border-2 " + (feltSafe === true ? "bg-green-100 border-green-400" : "bg-white border-gray-200")}>
                  {isZh ? "是" : "Yes"}
                </button>
                <button onClick={() => setFeltSafe(false)} className={"px-5 py-2 rounded-full text-lg border-2 " + (feltSafe === false ? "bg-red-100 border-red-400" : "bg-white border-gray-200")}>
                  {isZh ? "否" : "No"}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-lg">{isZh ? "我被认真倾听" : "I felt listened to"}</p>
              <div className="flex gap-2">
                <button onClick={() => setFeltListened(true)} className={"px-5 py-2 rounded-full text-lg border-2 " + (feltListened === true ? "bg-green-100 border-green-400" : "bg-white border-gray-200")}>
                  {isZh ? "是" : "Yes"}
                </button>
                <button onClick={() => setFeltListened(false)} className={"px-5 py-2 rounded-full text-lg border-2 " + (feltListened === false ? "bg-red-100 border-red-400" : "bg-white border-gray-200")}>
                  {isZh ? "否" : "No"}
                </button>
              </div>
            </div>
          </div>

          <button onClick={() => setStep(2)} disabled={rating === 0}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xl font-bold rounded-xl min-h-[64px]">
            {isZh ? "下一步" : "Next"}
          </button>
        </div>
      )}

      {/* Step 2: Emotional + Visit Length */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <p className="text-xl font-medium text-gray-700 mb-3">{isZh ? "探访后您的心情如何？" : "How do you feel after the visit?"}</p>
            <div className="grid grid-cols-2 gap-3">
              {EMOTIONS.map(e => (
                <button key={e.code} onClick={() => setEmotional(e.code)}
                  className={"p-4 rounded-2xl text-center border-2 min-h-[72px] " + (emotional === e.code ? "bg-blue-50 border-blue-400" : "bg-white border-gray-200")}>
                  <div className="text-3xl">{e.emoji}</div>
                  <div className="text-base mt-1">{isZh ? e.label_zh : e.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xl font-medium text-gray-700 mb-3">{isZh ? "探访时间" : "Visit Length"}</p>
            <div className="flex gap-2">
              {[
                { code: "too_short", label: isZh ? "太短" : "Too Short" },
                { code: "just_right", label: isZh ? "刚好" : "Just Right" },
                { code: "too_long", label: isZh ? "太长" : "Too Long" },
              ].map(v => (
                <button key={v.code} onClick={() => setVisitLength(v.code)}
                  className={"flex-1 py-4 rounded-xl text-lg font-medium border-2 " + (visitLength === v.code ? "bg-emerald-100 border-emerald-400" : "bg-white border-gray-200")}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-4 bg-gray-100 text-gray-700 text-lg font-semibold rounded-xl">{isZh ? "返回" : "Back"}</button>
            <button onClick={() => setStep(3)} className="flex-1 py-4 bg-emerald-600 text-white text-lg font-bold rounded-xl">{isZh ? "下一步" : "Next"}</button>
          </div>
        </div>
      )}

      {/* Step 3: Free text + Submit */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">{isZh ? "什么对您最有帮助？" : "What helped you most?"}</label>
            <textarea value={whatHelped} onChange={e => setWhatHelped(e.target.value)}
              placeholder={isZh ? "例如：祷告让我感到安慰..." : "e.g., The prayer gave me comfort..."}
              rows={3} className="w-full p-4 border border-gray-300 rounded-xl text-lg resize-none" />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">{isZh ? "有什么可以改进的吗？" : "Anything we could improve?"}</label>
            <textarea value={improvements} onChange={e => setImprovements(e.target.value)}
              placeholder={isZh ? "可选" : "Optional"}
              rows={2} className="w-full p-4 border border-gray-300 rounded-xl text-lg resize-none" />
          </div>

          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-lg">{isZh ? "我会再次预约" : "I would book again"}</p>
            <div className="flex gap-2">
              <button onClick={() => setBookAgain(true)} className={"px-5 py-2 rounded-full text-lg border-2 " + (bookAgain === true ? "bg-green-100 border-green-400" : "bg-white border-gray-200")}>
                {isZh ? "是" : "Yes"}
              </button>
              <button onClick={() => setBookAgain(false)} className={"px-5 py-2 rounded-full text-lg border-2 " + (bookAgain === false ? "bg-red-100 border-red-400" : "bg-white border-gray-200")}>
                {isZh ? "否" : "No"}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-4 bg-gray-100 text-gray-700 text-lg font-semibold rounded-xl">{isZh ? "返回" : "Back"}</button>
            <button onClick={submit} disabled={submitting}
              className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xl font-bold rounded-xl min-h-[64px]">
              {submitting ? "..." : (isZh ? "提交" : "Submit")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function SurveyPage() {
  return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><SurveyContent /></Suspense>;
}
