"use client";

import { useState, useCallback } from "react";

/**
 * PostcodeSearch — Customer-facing provider search by postcode/ZIP
 *
 * Elder-friendly design:
 * - 56px input height
 * - Country-adaptive label (Postcode/ZIP/邮编/郵遞區號/Poskod)
 * - Big clear results cards
 * - Shows walking/cycling badge prominently (cheaper!)
 * - Tool provision toggle (save money option)
 */

type CountryCode = "AU" | "CN" | "CA" | "US" | "TW" | "SG" | "HK" | "MY";
type ToolProvision = "customer_provides" | "provider_brings" | "platform_supplies";
type DistanceTier = "walking" | "cycling" | "driving" | "far" | "remote";

interface PostcodeSearchProps {
  locale: string;
  country: CountryCode;
  serviceCategory: string;
  onProviderSelect?: (providerId: string) => void;
}

// Localised labels
const POSTCODE_LABELS: Record<CountryCode, { label: string; placeholder: string; format: string }> = {
  AU: { label: "Postcode", placeholder: "e.g. 6430", format: "4 digits" },
  CN: { label: "邮政编码", placeholder: "如 200001", format: "6位数字" },
  CA: { label: "Postal Code", placeholder: "e.g. V6B 1A1", format: "A1A 1A1" },
  US: { label: "ZIP Code", placeholder: "e.g. 94105", format: "5 digits" },
  TW: { label: "郵遞區號", placeholder: "如 100", format: "3位數" },
  SG: { label: "Postal Code", placeholder: "e.g. 018956", format: "6 digits" },
  HK: { label: "地區 District", placeholder: "e.g. Central", format: "District" },
  MY: { label: "Poskod", placeholder: "e.g. 50000", format: "5 digits" },
};

const TOOL_OPTIONS: Record<ToolProvision, { en: string; zh: string; icon: string; savings: string }> = {
  customer_provides: { en: "I have my own tools", zh: "我有自己的工具", icon: "🧰", savings: "-12%" },
  provider_brings:   { en: "Provider brings tools", zh: "服务者带工具", icon: "🧹", savings: "" },
  platform_supplies: { en: "Need supplies delivered", zh: "需要配送工具", icon: "📦", savings: "+5%" },
};

const DISTANCE_BADGES: Record<DistanceTier, { icon: string; color: string; labelEn: string; labelZh: string }> = {
  walking:  { icon: "🚶", color: "bg-green-100 text-green-800 border-green-300", labelEn: "Walking — Cheapest!", labelZh: "步行距离 — 最便宜！" },
  cycling:  { icon: "🚲", color: "bg-blue-100 text-blue-800 border-blue-300", labelEn: "Cycling distance", labelZh: "骑行距离" },
  driving:  { icon: "🚗", color: "bg-gray-100 text-gray-700 border-gray-300", labelEn: "Short drive", labelZh: "短程驾车" },
  far:      { icon: "🛣️", color: "bg-orange-100 text-orange-800 border-orange-300", labelEn: "Far +10%", labelZh: "较远 +10%" },
  remote:   { icon: "✈️", color: "bg-red-100 text-red-800 border-red-300", labelEn: "Remote +20%", labelZh: "偏远 +20%" },
};

// Service categories that allow customer-provided tools
const TOOL_ELIGIBLE: string[] = ["cleaning", "garden", "repair"];

interface ProviderResult {
  id: string;
  name: string;
  postcode: string;
  distanceTier: DistanceTier;
  distanceKm: number;
  travelMin: number;
  rating: number;
  reviewCount: number;
  matchScore: number;
  finalRate: number;
  baseRate: number;
  savings: number;
  languages: string[];
  badges: string[];
  availableToday: boolean;
}

export default function PostcodeSearch({ locale, country, serviceCategory, onProviderSelect }: PostcodeSearchProps) {
  const isZh = locale === "zh" || locale === "zh_tw";
  const postcodeConfig = POSTCODE_LABELS[country] || POSTCODE_LABELS.AU;

  const [postcode, setPostcode] = useState("");
  const [toolChoice, setToolChoice] = useState<ToolProvision>("provider_brings");
  const [results, setResults] = useState<ProviderResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const toolEligible = TOOL_ELIGIBLE.includes(serviceCategory);

  const handleSearch = useCallback(async () => {
    if (!postcode.trim()) return;
    setSearching(true);
    setSearched(true);

    try {
      const res = await fetch("/api/match-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode: postcode.trim(), country, serviceCategory, toolProvision: toolChoice }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.providers || []);
      }
    } catch {
      // Silent fail, show empty
    } finally {
      setSearching(false);
    }
  }, [postcode, country, serviceCategory, toolChoice]);

  return (
    <div className="space-y-6">
      {/* ─── Postcode Input ────────────────────── */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <label className="block text-lg font-semibold text-gray-800 mb-2">
          📍 {postcodeConfig.label}
          <span className="text-sm font-normal text-gray-500 ml-2">({postcodeConfig.format})</span>
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder={postcodeConfig.placeholder}
            className="flex-1 h-14 text-xl px-4 border-2 border-gray-300 rounded-lg focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
          />
          <button
            onClick={handleSearch}
            disabled={!postcode.trim() || searching}
            className="h-14 px-8 bg-teal-700 text-white text-lg font-semibold rounded-lg hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? "..." : isZh ? "搜索" : "Search"}
          </button>
        </div>
      </div>

      {/* ─── Tool Provision (only for eligible services) ─── */}
      {toolEligible && (
        <div className="bg-amber-50 rounded-xl border-2 border-amber-200 p-5">
          <h3 className="text-lg font-semibold text-amber-900 mb-3">
            {isZh ? "🧰 工具选项（影响价格）" : "🧰 Tool Options (affects price)"}
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {(Object.entries(TOOL_OPTIONS) as [ToolProvision, typeof TOOL_OPTIONS[ToolProvision]][]).map(([key, opt]) => (
              <button
                key={key}
                onClick={() => setToolChoice(key)}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                  toolChoice === key
                    ? "border-amber-500 bg-amber-100 shadow-sm"
                    : "border-gray-200 bg-white hover:border-amber-300"
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="flex-1 text-lg">{isZh ? opt.zh : opt.en}</span>
                {opt.savings && (
                  <span className={`text-sm font-bold px-2 py-1 rounded ${
                    opt.savings.startsWith("-") ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {opt.savings}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Results ──────────────────────────── */}
      {searched && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">
            {results.length > 0
              ? isZh ? `找到 ${results.length} 位附近服务者` : `${results.length} providers near you`
              : isZh ? "暂无附近服务者" : "No nearby providers found"
            }
          </h2>

          {results.map((prov) => {
            const badge = DISTANCE_BADGES[prov.distanceTier];
            return (
              <div
                key={prov.id}
                className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-teal-300 transition-all cursor-pointer"
                onClick={() => onProviderSelect?.(prov.id)}
              >
                {/* Distance badge — prominent */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold border ${badge.color}`}>
                    {badge.icon} {isZh ? badge.labelZh : badge.labelEn}
                  </span>
                  <span className="text-sm text-gray-500">
                    {prov.distanceKm < 1 ? "<1" : prov.distanceKm.toFixed(1)}km • ~{prov.travelMin}min
                  </span>
                </div>

                {/* Provider info */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{prov.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-yellow-500">{"★".repeat(Math.round(prov.rating))}</span>
                      <span className="text-sm text-gray-600">{prov.rating.toFixed(1)} ({prov.reviewCount})</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {prov.badges.map((b) => (
                        <span key={b} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{b}</span>
                      ))}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">${prov.finalRate.toFixed(0)}<span className="text-sm font-normal text-gray-500">/hr</span></div>
                    {prov.savings > 0 && (
                      <div className="text-sm text-green-600 font-semibold">
                        {isZh ? `省$${prov.savings.toFixed(0)}/hr` : `Save $${prov.savings.toFixed(0)}/hr`}
                      </div>
                    )}
                    {prov.distanceTier === "walking" && (
                      <div className="text-xs text-green-600 mt-1">{isZh ? "步行可达 = 更便宜" : "Walkable = cheaper"}</div>
                    )}
                  </div>
                </div>

                {/* Match score bar */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-gray-500">{isZh ? "匹配度" : "Match"}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full"
                      style={{ width: `${prov.matchScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700">{prov.matchScore}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
