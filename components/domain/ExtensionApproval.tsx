"use client";

import { useState } from "react";
import { Clock, CheckCircle2, XCircle, DollarSign } from "lucide-react";
import { cn } from "@/components/ui/cn";

interface ExtensionApprovalProps {
  locale: string;
  providerName: string;
  serviceName: string;
  serviceNameZh: string;
  currentEndTime: string;
  newEndTime: string;
  extraMinutes: number;
  extraCost: number;
  currencySymbol: string;
  onApprove: () => Promise<void>;
  onDecline: () => Promise<void>;
}

/**
 * Customer-facing notification to approve/decline a service time extension.
 * Shows clear cost impact and new end time. Elder-friendly with large buttons.
 */
export function ExtensionApproval({
  locale,
  providerName,
  serviceName,
  serviceNameZh,
  currentEndTime,
  newEndTime,
  extraMinutes,
  extraCost,
  currencySymbol,
  onApprove,
  onDecline,
}: ExtensionApprovalProps) {
  const isZh = locale === "zh" || locale === "zh_tw";
  const [responding, setResponding] = useState(false);
  const [responded, setResponded] = useState<"approved" | "declined" | null>(null);

  const handleApprove = async () => {
    setResponding(true);
    await onApprove();
    setResponded("approved");
  };

  const handleDecline = async () => {
    setResponding(true);
    await onDecline();
    setResponded("declined");
  };

  if (responded === "approved") {
    return (
      <div className="rounded-xl border-2 border-success bg-success-soft p-6 text-center">
        <CheckCircle2 size={56} className="mx-auto text-success" />
        <h2 className="mt-4 text-[22px] font-bold text-success">
          {isZh ? "已批准延时" : "Extension Approved"}
        </h2>
        <p className="mt-2 text-[18px] text-text-secondary">
          {isZh
            ? `服务将延长至 ${newEndTime}。额外费用 ${currencySymbol}${extraCost.toFixed(2)} 将添加到账单。`
            : `Service extended to ${newEndTime}. ${currencySymbol}${extraCost.toFixed(2)} will be added to your bill.`}
        </p>
      </div>
    );
  }

  if (responded === "declined") {
    return (
      <div className="rounded-xl border-2 border-border bg-bg-surface p-6 text-center">
        <XCircle size={56} className="mx-auto text-text-tertiary" />
        <h2 className="mt-4 text-[22px] font-bold text-text-primary">
          {isZh ? "已拒绝延时" : "Extension Declined"}
        </h2>
        <p className="mt-2 text-[18px] text-text-secondary">
          {isZh
            ? `服务将按原定时间 ${currentEndTime} 结束。`
            : `Service will end at the original time: ${currentEndTime}.`}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-brand bg-brand-primary-soft p-6">
      {/* Header */}
      <div className="text-center">
        <Clock size={48} className="mx-auto text-brand" />
        <h2 className="mt-3 text-[22px] font-bold text-text-primary">
          {isZh ? "服务延时请求" : "Service Extension Request"}
        </h2>
        <p className="mt-1 text-[17px] text-text-secondary">
          {isZh
            ? `${providerName} 请求延长服务时间`
            : `${providerName} is requesting more time`}
        </p>
      </div>

      {/* Details */}
      <div className="mt-5 rounded-lg bg-bg-base p-4">
        <div className="flex flex-col gap-3 text-[17px]">
          <div className="flex justify-between">
            <span className="text-text-secondary">{isZh ? "服务" : "Service"}</span>
            <span className="font-semibold">{isZh ? serviceNameZh : serviceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">{isZh ? "原定结束" : "Original end"}</span>
            <span className="font-semibold">{currentEndTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">{isZh ? "延长" : "Extension"}</span>
            <span className="font-bold text-brand">+{extraMinutes} {isZh ? "分钟" : "min"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">{isZh ? "新结束时间" : "New end time"}</span>
            <span className="font-bold text-brand">{newEndTime}</span>
          </div>
          <hr className="border-border" />
          <div className="flex justify-between">
            <span className="flex items-center gap-1 text-text-secondary">
              <DollarSign size={16} /> {isZh ? "额外费用" : "Extra cost"}
            </span>
            <span className="text-[20px] font-bold text-text-primary">
              {currencySymbol}{extraCost.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons — LARGE for elderly */}
      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleApprove}
          disabled={responding}
          className="flex h-16 w-full items-center justify-center gap-2 rounded-lg bg-success text-[20px] font-bold text-white"
        >
          <CheckCircle2 size={24} />
          {isZh ? "✓ 同意延时" : "✓ Approve Extension"}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          disabled={responding}
          className="flex h-16 w-full items-center justify-center gap-2 rounded-lg border-2 border-danger bg-bg-base text-[20px] font-bold text-danger"
        >
          <XCircle size={24} />
          {isZh ? "✗ 拒绝，按原时间结束" : "✗ Decline, end on time"}
        </button>
      </div>

      <p className="mt-4 text-center text-[14px] text-text-tertiary">
        {isZh
          ? "批准后额外费用将自动添加到账单。您可以在付款时查看明细。"
          : "Extra charges will be added to your bill automatically. You can review at payment."}
      </p>
    </div>
  );
}
