"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Elder-First Booking Wizard
 * One question per step, large buttons, no typing required
 * Steps: Category → Service → Date → Time → Confirm
 */

type Step = "category" | "service" | "date" | "time" | "confirm";

interface BookingState {
  category: string | null;
  service: string | null;
  date: string | null;
  time: string | null;
}

export default function BookingWizard() {
  const t = useTranslations("booking");
  const [step, setStep] = useState<Step>("category");
  const [booking, setBooking] = useState<BookingState>({
    category: null, service: null, date: null, time: null,
  });

  const steps: Step[] = ["category", "service", "date", "time", "confirm"];
  const currentIndex = steps.indexOf(step);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  function goBack() {
    if (currentIndex > 0) setStep(steps[currentIndex - 1]);
  }

  return (
    <div className="min-h-screen bg-white px-4 pb-24 pt-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-3 w-full rounded-full bg-gray-200">
          <div
            className="h-3 rounded-full bg-teal-700 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-elder-small text-gray-600">
          {t("step")} {currentIndex + 1} / {steps.length}
        </p>
      </div>

      {/* Back Button */}
      {currentIndex > 0 && (
        <button
          onClick={goBack}
          className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-elder-body text-teal-700"
          style={{ minHeight: "56px" }}
        >
          ← {t("back")}
        </button>
      )}

      {/* Step Content */}
      {step === "category" && (
        <StepCategory
          onSelect={(cat) => { setBooking({ ...booking, category: cat }); setStep("service"); }}
        />
      )}
      {step === "service" && (
        <StepService
          category={booking.category!}
          onSelect={(svc) => { setBooking({ ...booking, service: svc }); setStep("date"); }}
        />
      )}
      {step === "date" && (
        <StepDate
          onSelect={(date) => { setBooking({ ...booking, date }); setStep("time"); }}
        />
      )}
      {step === "time" && (
        <StepTime
          onSelect={(time) => { setBooking({ ...booking, time }); setStep("confirm"); }}
        />
      )}
      {step === "confirm" && (
        <StepConfirm booking={booking} />
      )}
    </div>
  );
}

function StepCategory({ onSelect }: { onSelect: (cat: string) => void }) {
  const t = useTranslations("booking");
  const categories = [
    { id: "domestic", icon: "🧹", label: t("domestic") },
    { id: "garden", icon: "🌳", label: t("garden") },
    { id: "repair", icon: "🔧", label: t("repair") },
    { id: "personal", icon: "💊", label: t("personalCare") },
    { id: "companion", icon: "👋", label: t("companion") },
    { id: "transport", icon: "🚗", label: t("transport") },
  ];

  return (
    <div>
      <h1 className="mb-6 text-elder-heading font-bold text-gray-900">{t("whatService")}</h1>
      <div className="space-y-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-5 text-left transition-colors hover:border-teal-400 active:bg-teal-50"
            style={{ minHeight: "64px" }}
          >
            <span className="text-3xl">{cat.icon}</span>
            <span className="text-elder-body font-medium">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepService({ category, onSelect }: { category: string; onSelect: (svc: string) => void }) {
  const t = useTranslations("booking");
  // Simplified — in production, fetch from API based on category
  return (
    <div>
      <h1 className="mb-6 text-elder-heading font-bold text-gray-900">{t("whichService")}</h1>
      <button
        onClick={() => onSelect(`${category}.general`)}
        className="flex w-full items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-5 text-left"
        style={{ minHeight: "64px" }}
      >
        <span className="text-elder-body font-medium">{t("generalService")}</span>
      </button>
    </div>
  );
}

function StepDate({ onSelect }: { onSelect: (date: string) => void }) {
  const t = useTranslations("booking");
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  return (
    <div>
      <h1 className="mb-6 text-elder-heading font-bold text-gray-900">{t("whenDate")}</h1>
      <div className="space-y-3">
        {dates.map((date) => (
          <button
            key={date}
            onClick={() => onSelect(date)}
            className="flex w-full items-center rounded-2xl border-2 border-gray-200 bg-white p-5 text-left"
            style={{ minHeight: "64px" }}
          >
            <span className="text-elder-body font-medium">
              {new Date(date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepTime({ onSelect }: { onSelect: (time: string) => void }) {
  const t = useTranslations("booking");
  const times = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

  return (
    <div>
      <h1 className="mb-6 text-elder-heading font-bold text-gray-900">{t("whenTime")}</h1>
      <div className="grid grid-cols-2 gap-3">
        {times.map((time) => (
          <button
            key={time}
            onClick={() => onSelect(time)}
            className="rounded-2xl border-2 border-gray-200 bg-white p-5 text-center"
            style={{ minHeight: "64px" }}
          >
            <span className="text-elder-body font-medium">{time}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepConfirm({ booking }: { booking: BookingState }) {
  const t = useTranslations("booking");

  return (
    <div>
      <h1 className="mb-6 text-elder-heading font-bold text-gray-900">{t("confirmTitle")}</h1>
      <div className="mb-6 space-y-3 rounded-2xl border-2 border-green-200 bg-green-50 p-5">
        <p className="text-elder-body"><strong>{t("service")}:</strong> {booking.category} — {booking.service}</p>
        <p className="text-elder-body"><strong>{t("date")}:</strong> {booking.date}</p>
        <p className="text-elder-body"><strong>{t("time")}:</strong> {booking.time}</p>
      </div>
      <button
        className="w-full rounded-2xl bg-green-600 p-5 text-center text-elder-cta font-bold text-white shadow-lg"
        style={{ minHeight: "64px" }}
      >
        ✓ {t("confirmBook")}
      </button>
    </div>
  );
}
