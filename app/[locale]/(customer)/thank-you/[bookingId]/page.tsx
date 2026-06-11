"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";

const DONATION_AMOUNTS = [0, 5, 10, 20, 50];
const THANK_MESSAGES = [
  "God bless you for your service!",
  "Thank you for the wonderful visit.",
  "Your prayer meant the world to me.",
  "I felt God's love through you today.",
];
const THANK_MESSAGES_ZH = [
  "愿神祝福你的服务！",
  "感谢你美好的探访。",
  "你的祷告对我意义重大。",
  "今天通过你我感受到了上帝的爱。",
];

function ThankYouContent() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;
  const locale = (params?.locale as string) || "en";
  const isZh = locale === "zh";

  const [amount, setAmount] = useState(0);
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const res = await fetch("/api/bookings/" + bookingId + "/donate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, message: message || undefined, anonymous }),
    });
    const data = await res.json();
    if (data.success) setDone(true);
    setSubmitting(false);
  };

  if (done) {
    return (
      <main className="max-w-lg mx-auto p-6 text-center">
        <div className="text-6xl mb-4">\u2764\ufe0f</div>
        <h1 className="text-3xl font-bold text-emerald-800 mb-4">{isZh ? "感谢已发送！" : "Thank You Sent!"}</h1>
        <p className="text-xl text-gray-600 mb-8">
          {isZh ? "您的志愿者会收到您的感谢。愿上帝继续祝福你们的友谊！" : "Your volunteer has been notified. May God continue to bless your connection!"}
        </p>
        <button onClick={() => router.push("/" + locale)}
          className="w-full py-5 bg-emerald-600 text-white text-xl font-bold rounded-xl min-h-[64px]">
          {isZh ? "返回首页" : "Back to Home"}
        </button>
      </main>
    );
  }

  const msgs = isZh ? THANK_MESSAGES_ZH : THANK_MESSAGES;

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">\ud83d\ude4f</div>
        <h1 className="text-3xl font-bold text-gray-900">{isZh ? "感谢您的志愿者" : "Thank Your Volunteer"}</h1>
        <p className="text-lg text-gray-500 mt-2">{isZh ? "您的感谢对他们意义重大" : "Your gratitude means the world to them"}</p>
      </div>

      <div className="space-y-6">
        {/* Quick thank-you messages */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">{isZh ? "感谢留言" : "Thank You Message"}</label>
          <div className="space-y-2">
            {msgs.map((m, i) => (
              <button key={i} onClick={() => setMessage(m)}
                className={"w-full p-4 rounded-xl text-left text-lg border-2 min-h-[56px] " +
                  (message === m ? "bg-emerald-50 border-emerald-400" : "bg-white border-gray-200")}>
                {m}
              </button>
            ))}
          </div>
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder={isZh ? "或写下您自己的话..." : "Or write your own words..."}
            rows={2} className="w-full mt-3 p-4 border border-gray-300 rounded-xl text-lg resize-none" />
        </div>

        {/* Donation (optional) */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="text-xl font-semibold text-amber-800 mb-3">{isZh ? "爱心奉献（可选）" : "Donation (Optional)"}</h3>
          <p className="text-base text-amber-700 mb-3">
            {isZh ? "信仰服务永远免费。奉献不是义务，是感恩的表达。" : "Faith services are always free. Donations are never expected, just appreciated."}
          </p>
          <div className="flex gap-2 flex-wrap">
            {DONATION_AMOUNTS.map(a => (
              <button key={a} onClick={() => setAmount(a)}
                className={"px-5 py-3 rounded-xl text-lg font-medium min-h-[48px] border-2 " +
                  (amount === a ? "bg-emerald-100 border-emerald-400 text-emerald-800" : "bg-white border-gray-200 text-gray-700")}>
                {a === 0 ? (isZh ? "不捐" : "Skip") : "$" + a}
              </button>
            ))}
          </div>
        </div>

        {/* Anonymous */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="w-6 h-6 rounded" />
          <span className="text-lg text-gray-700">{isZh ? "匿名发送" : "Send anonymously"}</span>
        </label>

        {/* Submit */}
        <button onClick={submit} disabled={submitting || (!message && amount === 0)}
          className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xl font-bold rounded-xl min-h-[64px]">
          {submitting ? (isZh ? "发送中..." : "Sending...") : amount > 0 ? (isZh ? `发送感谢 + $${amount} 奉献` : `Send Thanks + $${amount}`) : (isZh ? "发送感谢" : "Send Thank You")}
        </button>
      </div>
    </main>
  );
}

export default function ThankYouPage() {
  return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><ThankYouContent /></Suspense>;
}
