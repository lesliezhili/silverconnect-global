"use client";

/**
 * PriceBreakdownCard — Transparent pricing display
 *
 * Shows customers exactly HOW the price is calculated:
 * - Base rate
 * - Distance discount/surcharge
 * - Tool provision discount
 * - Loyalty discount
 * - Time/demand adjustments
 * - Platform fee (15%)
 * - Provider earnings
 * - Savings vs industry
 *
 * Elder-friendly: large text, color-coded savings, simple language
 */

interface PriceBreakdownProps {
  locale: string;
  currencySymbol: string;
  baseRate: number;
  distanceDiscount: number;
  toolDiscount: number;
  loyaltyDiscount: number;
  demandAdjustment: number;
  timeAdjustment: number;
  weekendSurcharge: number;
  finalRate: number;
  platformFee: number;
  providerEarnings: number;
  savingsVsMarket: number;
  distanceTier: string;
  toolProvision: string;
  durationHours: number;
}

export default function PriceBreakdownCard({
  locale,
  currencySymbol,
  baseRate,
  distanceDiscount,
  toolDiscount,
  loyaltyDiscount,
  demandAdjustment,
  timeAdjustment,
  weekendSurcharge,
  finalRate,
  platformFee,
  providerEarnings,
  savingsVsMarket,
  distanceTier,
  toolProvision,
  durationHours,
}: PriceBreakdownProps) {
  const isZh = locale === "zh" || locale === "zh_tw";
  const sym = currencySymbol || "$";

  const totalCost = finalRate * durationHours;
  const totalSavings = savingsVsMarket * durationHours;

  const lines: { label: string; amount: number; highlight?: "green" | "red" | "orange" }[] = [
    { label: isZh ? "基准费率" : "Base rate", amount: baseRate },
  ];

  if (distanceDiscount !== 0) {
    lines.push({
      label: distanceDiscount < 0
        ? (isZh ? `🚶 近距离优惠 (${distanceTier})` : `🚶 Proximity discount (${distanceTier})`)
        : (isZh ? `🛣️ 远程附加费` : `🛣️ Distance surcharge`),
      amount: distanceDiscount,
      highlight: distanceDiscount < 0 ? "green" : "red",
    });
  }

  if (toolDiscount !== 0) {
    lines.push({
      label: toolDiscount < 0
        ? (isZh ? "🧰 自备工具优惠" : "🧰 Own tools discount")
        : (isZh ? "📦 工具配送费" : "📦 Supply delivery fee"),
      amount: toolDiscount,
      highlight: toolDiscount < 0 ? "green" : "orange",
    });
  }

  if (loyaltyDiscount !== 0) {
    lines.push({
      label: isZh ? "💜 老客户优惠" : "💜 Repeat customer discount",
      amount: loyaltyDiscount,
      highlight: "green",
    });
  }

  if (demandAdjustment !== 0) {
    lines.push({
      label: demandAdjustment > 0
        ? (isZh ? "📈 高需求时段" : "📈 High demand")
        : (isZh ? "📉 低需求优惠" : "📉 Low demand discount"),
      amount: demandAdjustment,
      highlight: demandAdjustment < 0 ? "green" : "orange",
    });
  }

  if (timeAdjustment !== 0) {
    lines.push({
      label: timeAdjustment > 0
        ? (isZh ? "🕐 高峰时段" : "🕐 Peak hours")
        : (isZh ? "🕐 非高峰优惠" : "🕐 Off-peak discount"),
      amount: timeAdjustment,
      highlight: timeAdjustment < 0 ? "green" : "orange",
    });
  }

  if (weekendSurcharge > 0) {
    lines.push({
      label: isZh ? "📅 周末附加费" : "📅 Weekend surcharge",
      amount: weekendSurcharge,
      highlight: "orange",
    });
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-teal-50 px-5 py-3 border-b">
        <h3 className="text-lg font-bold text-teal-950">
          {isZh ? "💰 价格明细" : "💰 Price Breakdown"}
        </h3>
        <p className="text-sm text-teal-800">
          {isZh ? "透明定价 — 让您了解每一分钱的去向" : "Transparent pricing — see where every dollar goes"}
        </p>
      </div>

      {/* Line items */}
      <div className="p-5 space-y-2">
        {lines.map((line, i) => (
          <div key={i} className="flex items-center justify-between py-1">
            <span className="text-base text-gray-700">{line.label}</span>
            <span className={`text-base font-semibold ${
              line.highlight === "green" ? "text-green-600" :
              line.highlight === "red" ? "text-red-600" :
              line.highlight === "orange" ? "text-orange-600" :
              "text-gray-900"
            }`}>
              {line.amount >= 0 ? `${sym}${line.amount.toFixed(2)}` : `-${sym}${Math.abs(line.amount).toFixed(2)}`}
              {line.amount >= 0 && i > 0 ? "/hr" : "/hr"}
            </span>
          </div>
        ))}

        {/* Divider */}
        <div className="border-t-2 border-gray-200 my-3" />

        {/* Final rate */}
        <div className="flex items-center justify-between py-1">
          <span className="text-lg font-bold text-gray-900">
            {isZh ? "最终费率" : "Your rate"}
          </span>
          <span className="text-2xl font-bold text-gray-900">
            {sym}{finalRate.toFixed(2)}/hr
          </span>
        </div>

        {/* Duration total */}
        <div className="flex items-center justify-between py-1">
          <span className="text-base text-gray-600">
            {isZh ? `× ${durationHours}小时` : `× ${durationHours} hours`}
          </span>
          <span className="text-xl font-bold text-teal-800">
            {sym}{totalCost.toFixed(2)}
          </span>
        </div>

        {/* Savings banner */}
        {totalSavings > 0 && (
          <div className="mt-3 bg-green-50 border-2 border-green-200 rounded-lg p-3 text-center">
            <span className="text-lg font-bold text-green-700">
              {isZh
                ? `💚 比市场价节省 ${sym}${totalSavings.toFixed(0)}`
                : `💚 You save ${sym}${totalSavings.toFixed(0)} vs market rate`
              }
            </span>
          </div>
        )}

        {/* Platform split (small) */}
        <div className="mt-3 text-xs text-gray-400 flex justify-between">
          <span>{isZh ? "平台费 15%" : "Platform fee 15%"}: {sym}{platformFee.toFixed(2)}/hr</span>
          <span>{isZh ? "服务者收入 85%" : "Provider earns 85%"}: {sym}{providerEarnings.toFixed(2)}/hr</span>
        </div>
      </div>
    </div>
  );
}
