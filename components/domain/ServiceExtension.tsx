"use client";

import { useState, useCallback } from "react";
import { Clock, CheckCircle2, XCircle, AlertCircle, Phone } from "lucide-react";
import { cn } from "@/components/ui/cn";

type ExtensionStatus = "idle" | "requesting" | "pending" | "approved" | "declined";

interface ServiceExtensionProps {
  locale: string;
  bookingId: string;
  currentEndTime: string;     // "HH:MM"
  serviceName: string;
  serviceNameZh: string;
  customerName: string;
  customerPhone?: string;
  hourlyRate: number;
  currencySymbol: string;
  onExtensionRequest: (bookingId: string, extraMinutes: number) => Promise<void>;
}

const EXTENSION_OPTIONS = [
  { minutes: 30, labelEn: "30 min", labelZh: "30分钟" },
  { minutes: 60, labelEn: "1 hour", labelZh: "1小时" },
  { minutes: 90, labelEn: "1.5 hours", labelZh: "1.5小时" },
  { minutes: 120, labelEn: "2 hours", labelZh: "2小时" },
];

export function ServiceExtension({
  locale,
  bookingId,
  currentEndTime,
  serviceName,
  serviceNameZh,
  customerName,
  customerPhone,
  hourlyRate,
  currencySymbol,
  onExtensionRequest,
}: ServiceExtensionProps) {
  const isZh = locale === "zh" || locale === "zh_tw";
  const [status, setStatus] = useState<ExtensionStatus>("idle");
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState("");

  const extraMinutes = selectedMinutes ?? (parseInt(customMinutes) || 0);
  const extraCost = (hourlyRate / 60) * extraMinutes;

  const newEndTime = (() => {
    if (!extraMinutes) return currentEndTime;
    const [h, m] = currentEndTime.split(":").map(Number);
    const totalMin = h * 60 + m + extraMinutes;
    const nh = Math.floor(totalMin / 60) % 24;
    const nm = totalMin % 60;
    return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
  })();

  const handleRequest = useCallback(async () => {
    if (!extraMinutes || extraMinutes <= 0) return;
    setStatus("requesting");
    try {
      await onExtensionRequest(bookingId, extraMinutes);
      setStatus("pending");
    } catch {
      setStatus("idle");
    }
  }, [bookingId, extraMinutes, onExtensionRequest]);

  if (status === "approved") {
    return (
      <div className="rounded-xl border-2 border-success bg-success-soft p-5 text-center">
        <CheckCircle2 size={48} className="mx-auto text-success" />
        <h3 className="mt-3 text-[20px] font-bold text-success">
          {isZh ? "✓ 延时已批准" : "✓ Extension Approved"}
        </h3>
        <p className="mt-2 text-[17px] text-text-secondary">
          {isZh
            ? `新结束时间: ${newEndTime} · 额外费用: ${currencySymbol}${extraCost.toFixed(2)}`
            : `New end time: ${newEndTime} · Extra charge: ${currencySymbol}${extraCost.toFixed(2)}`}
        </p>
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div className="rounded-xl border-2 border-danger bg-danger-soft p-5 text-center">
        <XCircle size={48} className="mx-auto text-danger" />
        <h3 className="mt-3 text-[20px] font-bold text-danger">
          {isZh ? "✗ 延时被拒绝" : "✗ Extension Declined"}
        </h3>
        <p className="mt-2 text-[17px] text-text-secondary">
          {isZh
            ? "客户拒绝了延时请求。请按原定时间完成服务。"
            : "Customer declined the extension. Please complete service by original end time."}
        </p>
        <p className="mt-3 text-[17px] font-semibold">
          {isZh ? `原定结束: ${currentEndTime}` : `Original end: ${currentEndTime}`}
        </p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="rounded-xl border-2 border-warning bg-warning-soft p-5 text-center">
        <AlertCircle size={48} className="mx-auto text-warning" />
        <h3 className="mt-3 text-[20px] font-bold text-warning">
          {isZh ? "⏳ 等待客户确认" : "⏳ Waiting for Customer Approval"}
        </h3>
        <p className="mt-2 text-[17px] text-text-secondary">
          {isZh
            ? `已向 ${customerName} 发送延时 ${extraMinutes} 分钟的请求。`
            : `Extension request of ${extraMinutes} min sent to ${customerName}.`}
        </p>
        <p className="mt-1 text-[16px] text-text-tertiary">
          {isZh
            ? "客户将通过App通知确认。通常1-2分钟内回复。"
            : "Customer will confirm via app notification. Usually replies within 1-2 min."}
        </p>
        {customerPhone && (
          <a
            href={`tel:${customerPhone}`}
            className="mt-4 inline-flex h-12 items-center gap-2 rounded-md border-2 border-brand px-5 text-[17px] font-bold text-brand"
          >
            <Phone size={18} />
            {isZh ? "致电客户" : "Call Customer"}
          </a>
        )}

        {/* Simulate approval/decline for demo */}
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setStatus("approved")}
            className="rounded-md bg-success px-4 py-2 text-[14px] font-bold text-white"
          >
            [Demo] Approve
          </button>
          <button
            type="button"
            onClick={() => setStatus("declined")}
            className="rounded-md bg-danger px-4 py-2 text-[14px] font-bold text-white"
          >
            [Demo] Decline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-bg-base p-5">
      <h3 className="text-elder-body font-bold text-text-primary">
        {isZh ? "⏱ 延长服务时间" : "⏱ Extend Service Time"}
      </h3>
      <p className="mt-1 text-[16px] text-text-secondary">
        {isZh
          ? `当前服务: ${serviceNameZh} · 预定结束: ${currentEndTime}`
          : `Current service: ${serviceName} · Scheduled end: ${currentEndTime}`}
      </p>

      {/* Extension options */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {EXTENSION_OPTIONS.map((opt) => (
          <button
            key={opt.minutes}
            type="button"
            onClick={() => {
              setSelectedMinutes(opt.minutes);
              setCustomMinutes("");
            }}
            className={cn(
              "flex h-14 flex-col items-center justify-center rounded-lg border-2 text-center",
              selectedMinutes === opt.minutes
                ? "border-brand bg-brand-primary-soft"
                : "border-border bg-bg-surface"
            )}
          >
            <span className="text-[17px] font-bold">
              +{isZh ? opt.labelZh : opt.labelEn}
            </span>
            <span className="text-[14px] text-text-secondary">
              +{currencySymbol}{((hourlyRate / 60) * opt.minutes).toFixed(2)}
            </span>
          </button>
        ))}
      </div>

      {/* Custom time input */}
      <div className="mt-4">
        <label className="text-[15px] font-medium text-text-secondary">
          {isZh ? "或自定义分钟数：" : "Or custom minutes:"}
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="number"
            min="15"
            max="240"
            step="15"
            value={customMinutes}
            onChange={(e) => {
              setCustomMinutes(e.target.value);
              setSelectedMinutes(null);
            }}
            placeholder={isZh ? "分钟" : "minutes"}
            className="h-12 w-28 rounded-md border border-border bg-bg-surface px-3 text-[16px]"
          />
          <span className="text-[15px] text-text-tertiary">
            {isZh ? "分钟" : "min"}
          </span>
        </div>
      </div>

      {/* Preview */}
      {extraMinutes > 0 && (
        <div className="mt-4 rounded-md bg-bg-surface p-3">
          <div className="flex justify-between text-[16px]">
            <span className="text-text-secondary">{isZh ? "新结束时间" : "New end time"}</span>
            <span className="font-bold text-brand">{newEndTime}</span>
          </div>
          <div className="mt-1 flex justify-between text-[16px]">
            <span className="text-text-secondary">{isZh ? "额外费用" : "Extra charge"}</span>
            <span className="font-bold text-text-primary">
              {currencySymbol}{extraCost.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Send request button */}
      <button
        type="button"
        onClick={handleRequest}
        disabled={!extraMinutes || extraMinutes <= 0 || status === "requesting"}
        className={cn(
          "mt-5 flex h-14 w-full items-center justify-center rounded-md text-[18px] font-bold text-white",
          extraMinutes > 0 ? "bg-brand" : "bg-text-tertiary"
        )}
      >
        {status === "requesting" ? (
          isZh ? "发送中..." : "Sending..."
        ) : (
          isZh ? "发送延时请求给客户" : "Request Extension from Customer"
        )}
      </button>

      <p className="mt-3 text-center text-[14px] text-text-tertiary">
        {isZh
          ? "客户将收到通知并可选择批准或拒绝。延时费用将自动添加到账单。"
          : "Customer will be notified and can approve or decline. Extra charges added to bill automatically."}
      </p>
    </div>
  );
}
