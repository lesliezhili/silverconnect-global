"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";

const FAITH_SERVICES = [
  { code: "bible_study_1h", label: "Bible Study", label_zh: "圣经学习" },
  { code: "church_plant_training", label: "Church Planting", label_zh: "教会植堂" },
  { code: "prayer_group_1h", label: "Prayer Group", label_zh: "祷告小组" },
  { code: "discipleship_mentoring", label: "Discipleship", label_zh: "门徒训练" },
  { code: "worship_music_session", label: "Worship & Music", label_zh: "敬拜诗歌" },
  { code: "pastoral_visit", label: "Pastoral Visit", label_zh: "牧养探访" },
  { code: "sunday_school", label: "Sunday School", label_zh: "主日学" },
  { code: "bible_reading_plan", label: "Bible Reading", label_zh: "圣经阅读" },
];

const AVAILABILITY = [
  { code: "weekday_morning", label: "Weekday Mornings" },
  { code: "weekday_afternoon", label: "Weekday Afternoons" },
  { code: "weekday_evening", label: "Weekday Evenings" },
  { code: "saturday", label: "Saturday" },
  { code: "sunday", label: "Sunday" },
];

function FaithRegistrationForm() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [churchName, setChurchName] = useState("");
  const [denomination, setDenomination] = useState("");
  const [pastorName, setPastorName] = useState("");
  const [pastorPhone, setPastorPhone] = useState("");
  const [pastorEmail, setPastorEmail] = useState("");
  const [ministryExperience, setMinistryExperience] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [agreeToSafety, setAgreeToSafety] = useState(false);
  const [agreeToFaith, setAgreeToFaith] = useState(false);

  const toggleService = (code: string) => {
    setSelectedServices(prev => prev.includes(code) ? prev.filter(s => s !== code) : [...prev, code]);
  };

  const toggleAvailability = (code: string) => {
    setSelectedAvailability(prev => prev.includes(code) ? prev.filter(s => s !== code) : [...prev, code]);
  };

  const submit = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/provider/register-faith", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          churchName, denomination,
          pastorReference: { name: pastorName, phone: pastorPhone, email: pastorEmail },
          ministryExperience,
          servicesOffered: selectedServices,
          availability: selectedAvailability,
          bio, agreeToSafety, agreeToFaith,
        }),
      });
      const data = await res.json();
      if (data.success) setSuccess(true);
      else setError(data.error);
    } catch { setError("Network error. Please try again."); }
    setLoading(false);
  };

  if (success) {
    return (
      <main className="max-w-lg mx-auto p-6 text-center">
        <div className="text-6xl mb-4">\u271D</div>
        <h1 className="text-3xl font-bold text-emerald-800 mb-4">Thank You!</h1>
        <p className="text-xl text-gray-600 mb-4">Your volunteer application has been submitted.</p>
        <p className="text-lg text-gray-500 mb-8">We will contact your pastor reference and notify you within 1-2 days. God bless you for your willingness to serve!</p>
        <button onClick={() => router.push("/" + locale + "/provider")}
          className="py-4 px-8 bg-emerald-600 text-white text-xl font-semibold rounded-xl min-h-[56px]">
          Go to Dashboard
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">\u271D</div>
        <h1 className="text-3xl font-bold text-gray-900">Faith Volunteer</h1>
        <p className="text-lg text-gray-500">Register to serve through spiritual care</p>
        <p className="text-base text-emerald-600 mt-2">Step {step} of 4</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4"><p className="text-red-700 text-lg">{error}</p></div>}

      {/* Step 1: Church & Background */}
      {step === 1 && (
        <div className="space-y-5">
          <h2 className="text-2xl font-semibold">Your Church</h2>
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Church Name *</label>
            <input value={churchName} onChange={e => setChurchName(e.target.value)}
              placeholder="e.g., St Andrew's Anglican Church"
              className="w-full p-4 border border-gray-300 rounded-xl text-lg" />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Denomination (optional)</label>
            <input value={denomination} onChange={e => setDenomination(e.target.value)}
              placeholder="e.g., Anglican, Baptist, Catholic, Uniting"
              className="w-full p-4 border border-gray-300 rounded-xl text-lg" />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Ministry Experience *</label>
            <textarea value={ministryExperience} onChange={e => setMinistryExperience(e.target.value)}
              placeholder="Describe your experience serving in ministry (e.g., led Bible study for 5 years, visited nursing homes, trained in pastoral care)..."
              rows={4} className="w-full p-4 border border-gray-300 rounded-xl text-lg resize-none" />
          </div>
          <button onClick={() => setStep(2)} disabled={!churchName || !ministryExperience}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xl font-bold rounded-xl min-h-[64px]">
            Next: Pastor Reference
          </button>
        </div>
      )}

      {/* Step 2: Pastor Reference */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-2xl font-semibold">Pastor/Minister Reference</h2>
          <p className="text-lg text-gray-500">We will contact your pastor to verify your church involvement. This protects our elderly community.</p>
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Pastor/Minister Name *</label>
            <input value={pastorName} onChange={e => setPastorName(e.target.value)}
              placeholder="Rev. John Smith" className="w-full p-4 border border-gray-300 rounded-xl text-lg" />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Phone *</label>
            <input value={pastorPhone} onChange={e => setPastorPhone(e.target.value)}
              type="tel" placeholder="0412 345 678" className="w-full p-4 border border-gray-300 rounded-xl text-lg" />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Email (optional)</label>
            <input value={pastorEmail} onChange={e => setPastorEmail(e.target.value)}
              type="email" placeholder="pastor@church.org" className="w-full p-4 border border-gray-300 rounded-xl text-lg" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-4 bg-gray-100 text-gray-700 text-lg font-semibold rounded-xl">Back</button>
            <button onClick={() => setStep(3)} disabled={!pastorName || !pastorPhone}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-lg font-bold rounded-xl">
              Next: Services
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Services & Availability */}
      {step === 3 && (
        <div className="space-y-5">
          <h2 className="text-2xl font-semibold">Services You Can Offer</h2>
          <p className="text-lg text-gray-500">Select all that apply. You can change these later.</p>
          <div className="grid grid-cols-2 gap-3">
            {FAITH_SERVICES.map(s => (
              <button key={s.code} onClick={() => toggleService(s.code)}
                className={"p-4 rounded-xl text-base font-medium min-h-[56px] border-2 " +
                  (selectedServices.includes(s.code) ? "bg-emerald-100 border-emerald-400 text-emerald-800" : "bg-white border-gray-200 text-gray-700")}>
                {s.label}
              </button>
            ))}
          </div>
          <h3 className="text-xl font-semibold mt-6">Your Availability</h3>
          <div className="flex flex-wrap gap-2">
            {AVAILABILITY.map(a => (
              <button key={a.code} onClick={() => toggleAvailability(a.code)}
                className={"px-4 py-3 rounded-full text-base font-medium min-h-[48px] " +
                  (selectedAvailability.includes(a.code) ? "bg-blue-100 border-2 border-blue-300 text-blue-800" : "bg-gray-100 text-gray-700 border border-gray-200")}>
                {a.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep(2)} className="flex-1 py-4 bg-gray-100 text-gray-700 text-lg font-semibold rounded-xl">Back</button>
            <button onClick={() => setStep(4)} disabled={selectedServices.length === 0}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-lg font-bold rounded-xl">
              Next: Confirm
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Agreements & Submit */}
      {step === 4 && (
        <div className="space-y-5">
          <h2 className="text-2xl font-semibold">Almost Done!</h2>
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Short Bio (shown to seniors)</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              placeholder="A few words about yourself and why you want to serve..."
              rows={3} className="w-full p-4 border border-gray-300 rounded-xl text-lg resize-none" />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreeToSafety} onChange={e => setAgreeToSafety(e.target.checked)}
                className="w-6 h-6 mt-1 rounded" />
              <span className="text-lg">I agree to undergo a Working with Vulnerable People check and follow all safety protocols to protect elderly participants.</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreeToFaith} onChange={e => setAgreeToFaith(e.target.checked)}
                className="w-6 h-6 mt-1 rounded" />
              <span className="text-lg">I affirm the historic Christian faith (Apostles' Creed) and commit to serving with love, patience, and respect for all people regardless of their beliefs.</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="flex-1 py-4 bg-gray-100 text-gray-700 text-lg font-semibold rounded-xl">Back</button>
            <button onClick={submit} disabled={loading || !agreeToSafety || !agreeToFaith}
              className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xl font-bold rounded-xl min-h-[64px]">
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function FaithRegisterPage() {
  return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><FaithRegistrationForm /></Suspense>;
}
