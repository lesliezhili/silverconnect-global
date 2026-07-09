"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";

interface FaithService { id: string; code: string; name: string; name_zh?: string; durationMin: number; description?: string; }
interface Volunteer { providerId: string; name: string; bio: string; church: string; servicesOffered: string[]; availability: { day: number; start: number; end: number }[]; }

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function BookFaithContent() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isZh = locale === "zh";

  const [step, setStep] = useState(1);
  const [services, setServices] = useState<FaithService[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ bookingId: string; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/bookings/faith")
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setServices(data.services || []);
          setVolunteers(data.volunteers || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredVolunteers = selectedService
    ? volunteers.filter(v => v.servicesOffered.includes(selectedService))
    : volunteers;

  const getNext7Days = () => {
    const days = [];
    const now = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(now.getTime() + i * 86400000);
      days.push({ date: d.toISOString().split("T")[0], label: DAYS[d.getDay()] + " " + d.getDate() + "/" + (d.getMonth() + 1), day: d.getDay() });
    }
    return days;
  };

  const submit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      const scheduledAt = selectedDate + "T" + selectedTime + ":00";
      const res = await fetch("/api/bookings/faith", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceCode: selectedService,
          providerId: selectedVolunteer || undefined,
          scheduledAt,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setBookingResult(data);
      }
    } catch {}
    setSubmitting(false);
  };

  if (loading) return <div className="p-6 text-center text-xl">{isZh ? "加载中..." : "Loading..."}</div>;

  if (success && bookingResult) {
    return (
      <main className="max-w-lg mx-auto p-6 text-center">
        <div className="text-6xl mb-4">\u2705</div>
        <h1 className="text-3xl font-bold text-emerald-800 mb-4">{isZh ? "预约成功！" : "Booking Confirmed!"}</h1>
        <p className="text-xl text-gray-600 mb-6">{bookingResult.message}</p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6 text-left">
          <p className="text-lg"><strong>{isZh ? "服务" : "Service"}:</strong> {services.find(s => s.code === selectedService)?.name}</p>
          <p className="text-lg"><strong>{isZh ? "日期" : "Date"}:</strong> {selectedDate}</p>
          <p className="text-lg"><strong>{isZh ? "时间" : "Time"}:</strong> {selectedTime}</p>
          <p className="text-lg"><strong>{isZh ? "费用" : "Cost"}:</strong> {isZh ? "免费（爱心奉献）" : "FREE (donation-based)"}</p>
        </div>
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
        <div className="text-4xl mb-2">\u271D</div>
        <h1 className="text-3xl font-bold text-gray-900">{isZh ? "预约信仰服务" : "Book Faith Service"}</h1>
        <p className="text-lg text-emerald-600 mt-1">{isZh ? "免费 — 志愿者爱心服务" : "FREE — Volunteer Ministry"}</p>
        <p className="text-base text-gray-400 mt-2">{isZh ? "第" + step + "步，共3步" : "Step " + step + " of 3"}</p>
      </div>

      {/* Step 1: Choose Service */}
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold mb-4">{isZh ? "选择服务" : "Choose a Service"}</h2>
          {services.map(s => (
            <button key={s.code} onClick={() => { setSelectedService(s.code); setStep(2); }}
              className={"w-full p-5 rounded-2xl text-left border-2 transition-colors min-h-[72px] " +
                (selectedService === s.code ? "bg-emerald-100 border-emerald-400" : "bg-white border-gray-200 hover:border-emerald-300")}>
              <p className="text-xl font-semibold text-gray-900">{isZh && s.name_zh ? s.name_zh : s.name}</p>
              <p className="text-base text-gray-500 mt-1">{s.durationMin} min{s.description ? " — " + s.description : ""}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Choose Date + Time + Volunteer */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-2xl font-semibold">{isZh ? "选择日期和时间" : "Choose Date & Time"}</h2>

          {/* Date picker */}
          <div className="grid grid-cols-4 gap-2">
            {getNext7Days().slice(0, 8).map(d => (
              <button key={d.date} onClick={() => setSelectedDate(d.date)}
                className={"p-3 rounded-xl text-center min-h-[56px] border-2 " +
                  (selectedDate === d.date ? "bg-emerald-100 border-emerald-400 text-emerald-800" : "bg-white border-gray-200 text-gray-700")}>
                <span className="text-base font-medium">{d.label}</span>
              </button>
            ))}
          </div>

          {/* Time picker */}
          {selectedDate && (
            <div>
              <h3 className="text-xl font-medium mb-3">{isZh ? "时间" : "Time"}</h3>
              <div className="grid grid-cols-3 gap-2">
                {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map(t => (
                  <button key={t} onClick={() => setSelectedTime(t)}
                    className={"p-4 rounded-xl text-lg font-medium min-h-[56px] border-2 " +
                      (selectedTime === t ? "bg-teal-100 border-teal-400 text-teal-900" : "bg-white border-gray-200 text-gray-700")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Volunteer (optional) */}
          {filteredVolunteers.length > 0 && (
            <div>
              <h3 className="text-xl font-medium mb-3">{isZh ? "选择志愿者（可选）" : "Prefer a Volunteer? (optional)"}</h3>
              <div className="space-y-2">
                <button onClick={() => setSelectedVolunteer(null)}
                  className={"w-full p-4 rounded-xl text-left border-2 " + (!selectedVolunteer ? "bg-gray-100 border-gray-400" : "bg-white border-gray-200")}>
                  <p className="text-lg font-medium">{isZh ? "任何可用的志愿者" : "Any available volunteer"}</p>
                </button>
                {filteredVolunteers.map(v => (
                  <button key={v.providerId} onClick={() => setSelectedVolunteer(v.providerId)}
                    className={"w-full p-4 rounded-xl text-left border-2 " +
                      (selectedVolunteer === v.providerId ? "bg-emerald-50 border-emerald-400" : "bg-white border-gray-200")}>
                    <p className="text-lg font-semibold">{v.name}</p>
                    <p className="text-base text-gray-500">{v.church} &bull; {v.bio?.substring(0, 50)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep(1)} className="flex-1 py-4 bg-gray-100 text-gray-700 text-lg font-semibold rounded-xl">
              {isZh ? "返回" : "Back"}
            </button>
            <button onClick={() => setStep(3)} disabled={!selectedDate || !selectedTime}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-lg font-bold rounded-xl">
              {isZh ? "下一步" : "Next"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-5">
          <h2 className="text-2xl font-semibold">{isZh ? "确认预约" : "Confirm Booking"}</h2>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
            <p className="text-lg"><strong>{isZh ? "服务" : "Service"}:</strong> {services.find(s => s.code === selectedService)?.name}</p>
            <p className="text-lg"><strong>{isZh ? "日期" : "Date"}:</strong> {selectedDate}</p>
            <p className="text-lg"><strong>{isZh ? "时间" : "Time"}:</strong> {selectedTime}</p>
            <p className="text-lg"><strong>{isZh ? "费用" : "Cost"}:</strong> <span className="text-emerald-600 font-bold">{isZh ? "免费" : "FREE"}</span></p>
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">{isZh ? "备注（可选）" : "Notes (optional)"}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder={isZh ? "例如：我行动不便，请来我家..." : "e.g., I have limited mobility, please come to my home..."}
              rows={3} className="w-full p-4 border border-gray-300 rounded-xl text-lg resize-none" />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-base text-amber-800">
              {isZh
                ? "\ud83d\ude4f 信仰服务由教会志愿者免费提供。如果您愿意，可以在服务后自愿捐款。"
                : "\ud83d\ude4f Faith services are provided free by church volunteers. Donations are welcome but never expected."}
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-4 bg-gray-100 text-gray-700 text-lg font-semibold rounded-xl">
              {isZh ? "返回" : "Back"}
            </button>
            <button onClick={submit} disabled={submitting}
              className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xl font-bold rounded-xl min-h-[64px]">
              {submitting ? (isZh ? "提交中..." : "Booking...") : (isZh ? "确认预约" : "Confirm")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function BookFaithPage() {
  return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><BookFaithContent /></Suspense>;
}
