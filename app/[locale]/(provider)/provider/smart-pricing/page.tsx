"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const SERVICES = [
  { code: "regular", cat: "cleaning", en: "Regular Clean", zh: "日常清洁", rate: 40, min: 30, max: 55 },
  { code: "medium", cat: "cleaning", en: "Medium Clean", zh: "中度清洁", rate: 50, min: 40, max: 65 },
  { code: "deep", cat: "cleaning", en: "Deep Clean", zh: "深度清洁", rate: 65, min: 50, max: 85 },
  { code: "external", cat: "cleaning", en: "External Clean", zh: "外部清洁", rate: 55, min: 40, max: 75 },
  { code: "gutter", cat: "cleaning", en: "Gutter Clean", zh: "排水沟清洁", rate: 60, min: 45, max: 80 },
  { code: "electrical", cat: "repair", en: "Electrical", zh: "电路", rate: 85, min: 65, max: 120 },
  { code: "plumber", cat: "repair", en: "Plumbing", zh: "水管", rate: 90, min: 70, max: 130 },
  { code: "window", cat: "repair", en: "Window", zh: "窗户", rate: 55, min: 40, max: 75 },
  { code: "floor", cat: "repair", en: "Floor", zh: "地板", rate: 60, min: 45, max: 85 },
  { code: "door", cat: "repair", en: "Door", zh: "门", rate: 55, min: 40, max: 75 },
  { code: "curtain", cat: "repair", en: "Curtain", zh: "窗帘", rate: 45, min: 35, max: 65 },
  { code: "tree_cut", cat: "repair", en: "Tree Cut", zh: "砍树修剪", rate: 75, min: 55, max: 110 },
  { code: "garden_general", cat: "garden", en: "Garden & Lawn", zh: "园艺", rate: 50, min: 35, max: 70 },
  { code: "personal_care", cat: "personalCare", en: "Personal Care", zh: "护理", rate: 55, min: 45, max: 75 },
  { code: "companion", cat: "companion", en: "Companion", zh: "陪伴", rate: 40, min: 30, max: 55 },
  { code: "transport", cat: "transport", en: "Transport", zh: "接送", rate: 45, min: 35, max: 60 },
  { code: "it_support", cat: "itSupport", en: "IT Help", zh: "电脑培训", rate: 65, min: 50, max: 90 },
];

const LOCATIONS = [
  { code: "metro_high", en: "Metro – High Income", zh: "都市高收入区", mult: 1.20, desc: "Inner city ($130k+ median)" },
  { code: "metro", en: "Metro – Standard", zh: "都市标准区", mult: 1.00, desc: "Standard suburbs ($90-130k)" },
  { code: "regional", en: "Regional Town", zh: "区域城镇", mult: 0.85, desc: "Regional ($70-90k)" },
  { code: "remote", en: "Remote / Rural", zh: "偏远地区", mult: 1.15, desc: "Remote – travel premium" },
];

const CALENDAR_AU = [
  { code: "weekday_day", en: "Weekday 6am–8pm", zh: "工作日白天", mult: 1.00, law: "Base rate" },
  { code: "weekday_evening", en: "Evening 8pm–12am", zh: "工作日晚间", mult: 1.15, law: "Fair Work +15%" },
  { code: "weekday_night", en: "Night 12am–6am", zh: "夜班", mult: 1.25, law: "Fair Work +25%" },
  { code: "saturday", en: "Saturday", zh: "周六", mult: 1.50, law: "SCHADS Award 150%" },
  { code: "sunday", en: "Sunday", zh: "周日", mult: 1.75, law: "SCHADS Award 175%" },
  { code: "public_holiday", en: "Public Holiday", zh: "公共假日", mult: 2.25, law: "SCHADS Award 225%" },
];

const CATS: Record<string, [string, string]> = {
  cleaning: ["Cleaning", "清洁服务"],
  repair: ["Repairs & Renovation", "维修翻新"],
  garden: ["Garden", "园艺"],
  personalCare: ["Personal Care", "护理"],
  companion: ["Companion", "陪伴"],
  transport: ["Transport", "接送"],
  itSupport: ["IT Help", "电脑培训"],
};

export default function SmartPricingPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isZh = locale.startsWith("zh");
  const isVi = locale === "vi";

  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [locationTier, setLocationTier] = useState("metro");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/provider/pricing")
      .then(r => r.json())
      .then(d => {
        if (d.rates) setOverrides(d.rates);
        if (d.locationTier) setLocationTier(d.locationTier);
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    await fetch("/api/provider/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rates: overrides, locationTier }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const locMult = LOCATIONS.find(l => l.code === locationTier)?.mult || 1.0;
  const cats = [...new Set(SERVICES.map(s => s.cat))];

  return (
    <main className="max-w-lg mx-auto p-6 pb-32">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {isZh ? "✨ 智能定价设置" : isVi ? "✨ Cài Đặt Giá Thông Minh" : "✨ Smart Price Settings"}
      </h1>
      <p className="text-lg text-gray-500 mb-4">
        {isZh ? "价格 = 基础价 × 地区系数 × 时间系数" : "Rate = Base × Location × Calendar"}
      </p>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-indigo-800 font-medium">
            💡 {isZh ? "您设置的价格将直接显示给客户。未设置时使用市场推荐价格。" : isVi ? "Giá bạn đặt sẽ hiển thị cho khách hàng. Nếu chưa đặt, dùng giá thị trường." : "Your custom rates will be shown directly to customers when they book. If not set, market rate is used."}
          </p>
        </div>


      {/* Location Tier */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
        <h2 className="text-lg font-bold text-blue-900 mb-2">
          📍 {isZh ? "地区定价层级（收入水平）" : "Location Tier (Income-Based)"}
        </h2>
        <p className="text-sm text-blue-600 mb-3">
          {isZh ? "基于您服务区域的收入水平自动调整价格" : "Auto-adjusts rate based on your service area income level"}
        </p>
        <div className="space-y-2">
          {LOCATIONS.map(loc => (
            <button
              key={loc.code}
              onClick={() => setLocationTier(loc.code)}
              className={`w-full flex items-center justify-between rounded-xl p-3 border ${locationTier === loc.code ? "border-teal-600 bg-teal-100" : "border-gray-200 bg-white"}`}
            >
              <div className="text-left">
                <p className="font-semibold text-gray-900">{isZh ? loc.zh : loc.en}</p>
                <p className="text-xs text-gray-400">{loc.desc}</p>
              </div>
              <span className={`text-lg font-bold ${loc.mult > 1 ? "text-amber-600" : loc.mult < 1 ? "text-green-600" : "text-gray-600"}`}>
                {loc.mult === 1 ? "1.0×" : `${loc.mult}×`}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Penalty Rates (read-only, informational) */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6">
        <h2 className="text-lg font-bold text-purple-900 mb-2">
          🕐 {isZh ? "时间附加费（法定）" : "Calendar Surcharges (Legal)"}
        </h2>
        <p className="text-sm text-purple-600 mb-3">
          {isZh ? "根据澳洲Fair Work法律自动计算，无法手动调整" : "Auto-calculated per Fair Work Act. Cannot be overridden."}
        </p>
        <div className="space-y-1.5">
          {CALENDAR_AU.map(cal => (
            <div key={cal.code} className="flex items-center justify-between rounded-lg bg-white p-2.5 border border-purple-100">
              <div>
                <p className="text-[15px] font-medium text-gray-900">{isZh ? cal.zh : cal.en}</p>
                <p className="text-xs text-gray-400">{cal.law}</p>
              </div>
              <span className={`text-[15px] font-bold ${cal.mult > 1 ? "text-red-600" : "text-gray-600"}`}>
                {cal.mult === 1 ? "Base" : `${cal.mult}×`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Service Base Rates (overridable) */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          💰 {isZh ? "服务基础价格（可自定义）" : "Service Base Rates (Customizable)"}
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          {isZh ? "显示金额 = 基础价 × 地区系数。时间附加费在预约时自动计算。" : "Shown = Base × Location. Calendar surcharge applied at booking time."}
        </p>
      </div>

      {cats.map(cat => {
        const items = SERVICES.filter(s => s.cat === cat);
        const label = CATS[cat] || [cat, cat];
        return (
          <div key={cat} className="mb-6">
            <h3 className="text-[17px] font-bold text-gray-800 mb-2 border-b pb-1.5">
              {isZh ? label[1] : label[0]}
            </h3>
            <div className="space-y-2.5">
              {items.map(item => {
                const val = overrides[item.code] ?? item.rate;
                const effective = Math.round(val * locMult * 100) / 100;
                const isCustom = overrides[item.code] !== undefined && overrides[item.code] !== item.rate;
                return (
                  <div key={item.code} className="flex items-center justify-between bg-white rounded-xl border p-3.5">
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold text-gray-900">{isZh ? item.zh : item.en}</p>
                      <p className="text-xs text-gray-400">
                        {isZh ? "市场价" : "Market"}: ${item.rate} → {isZh ? "含地区" : "w/ location"}: ${effective}/hr
                      </p>
                    </div>
                    <div className="flex flex-col items-end ml-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">$</span>
                        <input
                          type="number"
                          min={item.min}
                          max={item.max}
                          step={5}
                          value={val}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (v === item.rate) {
                              const next = { ...overrides };
                              delete next[item.code];
                              setOverrides(next);
                            } else {
                              setOverrides({ ...overrides, [item.code]: v });
                            }
                          }}
                          className="w-[72px] text-right text-lg font-bold border rounded-lg p-1.5"
                        />
                        <span className="text-xs text-gray-400">/hr</span>
                      </div>
                      {isCustom && (
                        <button onClick={() => { const n = { ...overrides }; delete n[item.code]; setOverrides(n); }} className="text-xs text-teal-700 mt-0.5">
                          {isZh ? "恢复" : "Reset"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Example calculation */}
      <div className="bg-gray-50 border rounded-xl p-4 mb-6">
        <p className="text-sm font-bold text-gray-700 mb-1">{isZh ? "💡 价格示例" : "💡 Example Calculation"}</p>
        <p className="text-sm text-gray-500">
          {isZh
            ? `深度清洁 $65 × ${locMult}(地区) × 1.75(周日) = $${Math.round(65 * locMult * 1.75)}/hr`
            : `Deep Clean $65 × ${locMult}(location) × 1.75(Sunday) = $${Math.round(65 * locMult * 1.75)}/hr`}
        </p>
      </div>

      <button
        onClick={save}
        className="w-full bg-teal-700 text-white text-xl font-bold rounded-xl py-4 active:scale-[0.97]"
      >
        {saved ? (isZh ? "✅ 已保存" : "✅ Saved!") : (isZh ? "保存我的定价" : "Save My Pricing")}
      </button>
    </main>
  );
}
