"use client";

/**
 * Powered by PHLedger badge
 * PHLedger is free exclusively for PHLedger & SilverConnect.
 * Commercial license required for all other platforms.
 */
export function PoweredByPHLedger({ locale = "en" }: { locale?: string }) {
  const text = locale === "zh" || locale === "zh_tw" ? "支付系统由"
    : locale === "vi" ? "Thanh toán bởi"
    : locale === "ko" ? "결제:"
    : locale === "ja" ? "決済:"
    : locale === "th" ? "ชำระเงินโดย"
    : "Powered by";

  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      <span className="text-[11px] text-gray-400">{text}</span>
      <span className="text-[12px] font-bold text-emerald-600 tracking-tight">PHLedger</span>
      <span className="text-[10px] text-gray-300 ml-1">|</span>
      <span className="text-[10px] text-gray-400 ml-1">Zero fees</span>
    </div>
  );
}
