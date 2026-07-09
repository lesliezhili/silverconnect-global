"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";

const PRAYER_TOPICS = [
  "Health & Healing", "Loneliness", "Family", "Grief & Loss",
  "Gratitude", "Guidance", "Peace", "Faith Struggles",
  "Financial Worry", "End of Life",
];

const MOODS = [
  { code: "joyful", emoji: "\ud83d\ude0a", label: "Joyful" },
  { code: "peaceful", emoji: "\u262e\ufe0f", label: "Peaceful" },
  { code: "struggling", emoji: "\ud83d\ude1f", label: "Struggling" },
  { code: "grieving", emoji: "\ud83d\ude22", label: "Grieving" },
];

function CompleteFaithContent() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;
  const locale = (params?.locale as string) || "en";

  const [summary, setSummary] = useState("");
  const [prayerTopics, setPrayerTopics] = useState<string[]>([]);
  const [scripture, setScripture] = useState("");
  const [attendees, setAttendees] = useState(1);
  const [mood, setMood] = useState("");
  const [followUp, setFollowUp] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [privatePrayer, setPrivatePrayer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleTopic = (t: string) =>
    setPrayerTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const submit = async () => {
    if (!summary) return;
    setSubmitting(true);
    const res = await fetch("/api/bookings/" + bookingId + "/complete-faith", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary, prayerTopics, scriptureShared: scripture || undefined,
        attendees, mood: mood || undefined, followUpNeeded: followUp,
        followUpNotes: followUpNotes || undefined, privatePrayerNote: privatePrayer || undefined,
      }),
    });
    const data = await res.json();
    if (data.success) setSuccess(true);
    setSubmitting(false);
  };

  if (success) {
    return (
      <main className="max-w-lg mx-auto p-6 text-center">
        <div className="text-6xl mb-4">\u271D</div>
        <h1 className="text-3xl font-bold text-emerald-800 mb-4">Thank You!</h1>
        <p className="text-xl text-gray-600 mb-6">Your prayer report has been submitted. God bless your faithful service!</p>
        <blockquote className="italic text-lg text-gray-500 mb-8">&ldquo;Well done, good and faithful servant.&rdquo; — Matthew 25:21</blockquote>
        <button onClick={() => router.push("/" + locale + "/provider")}
          className="w-full py-5 bg-emerald-600 text-white text-xl font-bold rounded-xl min-h-[64px]">
          Back to Dashboard
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">\ud83d\udcdd</div>
        <h1 className="text-3xl font-bold text-gray-900">Complete Visit</h1>
        <p className="text-lg text-gray-500">Submit your prayer report</p>
      </div>

      <div className="space-y-6">
        {/* Summary */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">Visit Summary *</label>
          <textarea value={summary} onChange={e => setSummary(e.target.value)}
            placeholder="Brief summary of the visit (shared with the senior)..."
            rows={3} className="w-full p-4 border border-gray-300 rounded-xl text-lg resize-none" />
        </div>

        {/* Prayer Topics */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">Prayer Topics</label>
          <div className="flex flex-wrap gap-2">
            {PRAYER_TOPICS.map(t => (
              <button key={t} onClick={() => toggleTopic(t)}
                className={"px-3 py-2 rounded-full text-base font-medium border " +
                  (prayerTopics.includes(t) ? "bg-purple-100 border-purple-300 text-purple-800" : "bg-white border-gray-200 text-gray-600")}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Scripture */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">Scripture Shared</label>
          <input value={scripture} onChange={e => setScripture(e.target.value)}
            placeholder="e.g., Psalm 23:1-4" className="w-full p-4 border border-gray-300 rounded-xl text-lg" />
        </div>

        {/* Mood */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">Senior&apos;s Mood</label>
          <div className="flex gap-3">
            {MOODS.map(m => (
              <button key={m.code} onClick={() => setMood(m.code)}
                className={"flex-1 p-3 rounded-xl text-center border-2 min-h-[56px] " +
                  (mood === m.code ? "bg-teal-100 border-teal-400" : "bg-white border-gray-200")}>
                <div className="text-2xl">{m.emoji}</div>
                <div className="text-sm mt-1">{m.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Attendees */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">Attendees</label>
          <div className="flex items-center gap-4">
            <button onClick={() => setAttendees(Math.max(1, attendees - 1))} className="w-12 h-12 bg-gray-100 rounded-full text-2xl font-bold">-</button>
            <span className="text-2xl font-bold">{attendees}</span>
            <button onClick={() => setAttendees(attendees + 1)} className="w-12 h-12 bg-gray-100 rounded-full text-2xl font-bold">+</button>
          </div>
        </div>

        {/* Follow-up */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={followUp} onChange={e => setFollowUp(e.target.checked)} className="w-6 h-6 rounded" />
            <span className="text-lg font-medium text-amber-800">Follow-up visit recommended</span>
          </label>
          {followUp && (
            <textarea value={followUpNotes} onChange={e => setFollowUpNotes(e.target.value)}
              placeholder="Notes: when, what to focus on next time..."
              rows={2} className="w-full mt-3 p-3 border border-amber-200 rounded-xl text-base resize-none" />
          )}
        </div>

        {/* Private Prayer Note */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">Private Prayer Note <span className="text-sm text-gray-400">(not shared)</span></label>
          <textarea value={privatePrayer} onChange={e => setPrivatePrayer(e.target.value)}
            placeholder="Personal prayer request or note to yourself..."
            rows={2} className="w-full p-4 border border-gray-300 rounded-xl text-lg resize-none" />
        </div>

        {/* Submit */}
        <button onClick={submit} disabled={!summary || submitting}
          className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xl font-bold rounded-xl min-h-[64px]">
          {submitting ? "Submitting..." : "Submit Prayer Report"}
        </button>
      </div>
    </main>
  );
}

export default function CompleteFaithPage() {
  return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><CompleteFaithContent /></Suspense>;
}
