"use client";

import { useState, useCallback, useMemo } from "react";
import { Clock, AlertTriangle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/components/ui/cn";

/* ── Service Duration Requirements ── */
const SERVICE_MIN_DURATION: Record<string, { min: number; nameEn: string; nameZh: string }> = {
  cleaning: { min: 120, nameEn: "Home Cleaning", nameZh: "居家清洁" },
  garden: { min: 90, nameEn: "Garden & Outdoor", nameZh: "花园户外" },
  repair: { min: 60, nameEn: "Home Repair", nameZh: "家居维修" },
  personalCare: { min: 60, nameEn: "Personal Care", nameZh: "个人护理" },
  companion: { min: 120, nameEn: "Companionship", nameZh: "陪伴服务" },
  transport: { min: 30, nameEn: "Transport", nameZh: "出行交通" },
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DAY_LABELS_EN: Record<string, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday",
  Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};
const DAY_LABELS_ZH: Record<string, string> = {
  Mon: "周一", Tue: "周二", Wed: "周三", Thu: "周四",
  Fri: "周五", Sat: "周六", Sun: "周日",
};

type TimeSlot = {
  id: string;
  day: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
};

type ValidationWarning = {
  day: string;
  slotId: string;
  service: string;
  serviceNameEn: string;
  serviceNameZh: string;
  required: number;
  available: number;
};

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function formatDuration(min: number, isZh: boolean): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (isZh) {
    return h > 0 ? (m > 0 ? `${h}小时${m}分钟` : `${h}小时`) : `${m}分钟`;
  }
  return h > 0 ? (m > 0 ? `${h}h ${m}min` : `${h}h`) : `${m}min`;
}

interface CalendarSetupProps {
  locale: string;
  providerServices: string[]; // category codes the provider offers
  existingSlots?: TimeSlot[];
  onSave: (slots: TimeSlot[]) => void;
}

export function CalendarSetup({
  locale,
  providerServices,
  existingSlots = [],
  onSave,
}: CalendarSetupProps) {
  const isZh = locale === "zh" || locale === "zh_tw";
  const [slots, setSlots] = useState<TimeSlot[]>(existingSlots);
  const [saved, setSaved] = useState(false);

  const addSlot = useCallback((day: string) => {
    const newSlot: TimeSlot = {
      id: `${day}-${Date.now()}`,
      day,
      startTime: "09:00",
      endTime: "12:00",
    };
    setSlots((prev) => [...prev, newSlot]);
    setSaved(false);
  }, []);

  const updateSlot = useCallback((id: string, field: "startTime" | "endTime", value: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
    setSaved(false);
  }, []);

  const removeSlot = useCallback((id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    setSaved(false);
  }, []);

  // Validate each slot against provider's services
  const warnings = useMemo<ValidationWarning[]>(() => {
    const warns: ValidationWarning[] = [];
    for (const slot of slots) {
      const duration = minutesBetween(slot.startTime, slot.endTime);
      if (duration <= 0) continue; // Invalid time range handled elsewhere
      
      for (const svc of providerServices) {
        const req = SERVICE_MIN_DURATION[svc];
        if (req && duration < req.min) {
          warns.push({
            day: slot.day,
            slotId: slot.id,
            service: svc,
            serviceNameEn: req.nameEn,
            serviceNameZh: req.nameZh,
            required: req.min,
            available: duration,
          });
        }
      }
    }
    return warns;
  }, [slots, providerServices]);

  const hasErrors = slots.some((s) => minutesBetween(s.startTime, s.endTime) <= 0);

  const handleSave = () => {
    if (hasErrors) return;
    onSave(slots);
    setSaved(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-elder-subheading font-bold text-text-primary">
          {isZh ? "📅 设置您的可用时间" : "📅 Set Your Availability"}
        </h2>
        <p className="mt-1 text-[16px] text-text-secondary">
          {isZh
            ? "为每天添加您可以提供服务的时间段。系统会验证时间是否满足服务最低要求。"
            : "Add time periods for each day you're available. We'll validate if your slots meet minimum service requirements."}
        </p>
      </div>

      {/* Day-by-day slots */}
      {DAYS.map((day) => {
        const daySlots = slots.filter((s) => s.day === day);
        const dayWarnings = warnings.filter((w) => w.day === day);

        return (
          <section key={day} className="rounded-lg border border-border bg-bg-base p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-text-primary">
                {isZh ? DAY_LABELS_ZH[day] : DAY_LABELS_EN[day]}
              </h3>
              <button
                type="button"
                onClick={() => addSlot(day)}
                className="inline-flex h-10 items-center gap-1 rounded-md bg-brand px-3 text-[15px] font-bold text-white"
              >
                <Plus size={16} /> {isZh ? "添加时段" : "Add Slot"}
              </button>
            </div>

            {daySlots.length === 0 ? (
              <p className="mt-3 text-[15px] text-text-tertiary">
                {isZh ? "未设置 — 当天不可预约" : "Not set — unavailable this day"}
              </p>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                {daySlots.map((slot) => {
                  const duration = minutesBetween(slot.startTime, slot.endTime);
                  const isInvalid = duration <= 0;

                  return (
                    <div
                      key={slot.id}
                      className={cn(
                        "flex items-center gap-3 rounded-md border p-3",
                        isInvalid ? "border-danger bg-danger-soft" : "border-border bg-bg-surface"
                      )}
                    >
                      <Clock size={20} className="shrink-0 text-text-tertiary" />
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateSlot(slot.id, "startTime", e.target.value)}
                          className="h-11 rounded-md border border-border bg-bg-base px-3 text-[16px]"
                        />
                        <span className="text-[16px] text-text-secondary">
                          {isZh ? "至" : "to"}
                        </span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateSlot(slot.id, "endTime", e.target.value)}
                          className="h-11 rounded-md border border-border bg-bg-base px-3 text-[16px]"
                        />
                        {!isInvalid && (
                          <span className="rounded-pill bg-brand-primary-soft px-2 py-1 text-[14px] font-medium text-brand">
                            {formatDuration(duration, isZh)}
                          </span>
                        )}
                        {isInvalid && (
                          <span className="text-[14px] font-medium text-danger">
                            {isZh ? "结束时间必须晚于开始时间" : "End must be after start"}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSlot(slot.id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-danger"
                        aria-label="Remove"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Duration warnings for this day */}
            {dayWarnings.length > 0 && (
              <div className="mt-3 rounded-md border border-warning bg-warning-soft p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-warning">
                      {isZh ? "时间段不足以完成以下服务：" : "Time slot too short for:"}
                    </p>
                    <ul className="mt-1 flex flex-col gap-1">
                      {dayWarnings.map((w, i) => (
                        <li key={i} className="text-[14px] text-text-secondary">
                          • {isZh ? w.serviceNameZh : w.serviceNameEn}: {isZh ? "需要" : "needs"}{" "}
                          <strong>{formatDuration(w.required, isZh)}</strong>,{" "}
                          {isZh ? "当前仅" : "only"}{" "}
                          <strong>{formatDuration(w.available, isZh)}</strong>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[14px] text-text-tertiary">
                      {isZh
                        ? "客户将无法预约这些服务在此时段。建议延长时间。"
                        : "Customers won't be able to book these services in this slot. Consider extending."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        );
      })}

      {/* Summary + Save */}
      <div className="rounded-lg border border-border bg-bg-surface p-4">
        <h3 className="text-[17px] font-bold">
          {isZh ? "服务时间要求" : "Service Duration Requirements"}
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {providerServices.map((svc) => {
            const req = SERVICE_MIN_DURATION[svc];
            if (!req) return null;
            return (
              <div key={svc} className="rounded-md bg-bg-base px-3 py-2 text-[14px]">
                <p className="font-medium">{isZh ? req.nameZh : req.nameEn}</p>
                <p className="text-text-secondary">
                  {isZh ? "最少" : "Min"} {formatDuration(req.min, isZh)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={hasErrors}
        className={cn(
          "flex h-14 w-full items-center justify-center rounded-md text-[18px] font-bold text-white",
          hasErrors ? "bg-text-tertiary" : "bg-brand"
        )}
      >
        {saved ? (
          <span className="flex items-center gap-2">
            <CheckCircle2 size={22} /> {isZh ? "已保存" : "Saved"}
          </span>
        ) : (
          isZh ? "保存可用时间" : "Save Availability"
        )}
      </button>

      {warnings.length > 0 && !hasErrors && (
        <p className="text-center text-[15px] text-warning">
          {isZh
            ? `⚠️ ${warnings.length} 个时段警告 — 仍可保存，但部分服务无法在这些时段预约`
            : `⚠️ ${warnings.length} warning(s) — you can still save, but some services won't be bookable in short slots`}
        </p>
      )}
    </div>
  );
}
