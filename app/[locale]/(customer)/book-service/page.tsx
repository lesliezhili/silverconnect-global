"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";

interface ServiceItem {
  id: string; code: string; category_code: string;
  duration_min: number; name?: string;
}

const CATEGORIES = [
  { code: "cleaning", emoji: "🧹", en: "Cleaning", zh: "清洁", th: "ทำความสะอาด", ko: "청소", ja: "清掃", vi: "Dọn dẹp" },
  { code: "garden", emoji: "🌳", en: "Garden", zh: "园艺", th: "สวน", ko: "정원", ja: "庭園", vi: "Làm vườn" },
  { code: "repair", emoji: "🔧", en: "Repairs & Renovation", zh: "维修翻新", th: "ซ่อมแซม", ko: "수리 & 보수", ja: "修理・リノベ", vi: "Sửa chữa" },
  { code: "personalCare", emoji: "💊", en: "Personal Care", zh: "护理", th: "ดูแลส่วนตัว", ko: "개인 돌봄", ja: "介護", vi: "Chăm sóc" },
  { code: "companion", emoji: "👋", en: "Companion", zh: "陪伴", th: "เพื่อนคู่ใจ", ko: "동행", ja: "付き添い", vi: "Bầu bạn" },
  { code: "transport", emoji: "🚗", en: "Transport", zh: "接送", th: "รับ-ส่ง", ko: "교통", ja: "送迎", vi: "Đưa đón" },
  { code: "itSupport", emoji: "💻", en: "IT Help", zh: "电脑培训", th: "ช่วยไอที", ko: "IT 지원", ja: "ITサポート", vi: "Hỗ trợ IT" },
  { code: "mealDelivery", emoji: "🍱", en: "Meal Delivery", zh: "餐食配送", th: "จัดส่งอาหาร", ko: "식사 배달", ja: "食事宅配", vi: "Giao đồ ăn" },
];

const HOURLY_RATE = 45; // AUD base
const CN_CATEGORY_RATE: Record<string, number> = { cleaning: 120, repair: 200, garden: 100, personalCare: 150, companion: 100, transport: 80, itSupport: 200, mealDelivery: 130 }; // CNY/hr

// Smart Price — market rate recommendations ($/hr AUD)
const SMART_RATE: Record<string, number> = {
  regular: 40, medium: 50, deep: 65, external: 55, gutter: 60,
  electrical: 85, plumber: 90, window: 55, floor: 60, door: 55, curtain: 45, tree_cut: 75,
  garden_general: 50, personal_care: 55, companion: 40, transport: 45, it_support: 65,
};
const CATEGORY_RATE: Record<string, number> = {
  cleaning: 50, repair: 65, garden: 50, personalCare: 55, companion: 40, transport: 45, itSupport: 65, mealDelivery: 45,
};

// Calendar surcharges (AU Fair Work Act)
function getCalendarLabel(dateStr: string, timeStr: string): { label: string; mult: number } {
  if (!dateStr || !timeStr) return { label: "Weekday", mult: 1.0 };
  const dt = new Date(dateStr + "T" + timeStr + ":00");
  const day = dt.getDay();
  const hour = dt.getHours();
  if (day === 0) return { label: "Sunday +75%", mult: 1.75 };
  if (day === 6) return { label: "Saturday +50%", mult: 1.50 };
  if (hour >= 0 && hour < 6) return { label: "Night +25%", mult: 1.25 };
  if (hour >= 20) return { label: "Evening +15%", mult: 1.15 };
  return { label: "Weekday", mult: 1.0 };
}



const REPAIR_SUBTYPES = [
  { code: "electrical", emoji: "⚡", en: "Electrical", zh: "电路", th: "ไฟฟ้า", ko: "전기", ja: "電気", vi: "Điện" },
  { code: "plumber", emoji: "🚿", en: "Plumbing", zh: "水管", th: "ประปา", ko: "배관", ja: "配管", vi: "Ống nước" },
  { code: "window", emoji: "🪟", en: "Window", zh: "窗户", th: "หน้าต่าง", ko: "창문", ja: "窓", vi: "Cửa sổ" },
  { code: "floor", emoji: "🪵", en: "Floor", zh: "地板", th: "พื้น", ko: "바닥", ja: "床", vi: "Sàn nhà" },
  { code: "door", emoji: "🚪", en: "Door", zh: "门", th: "ประตู", ko: "문", ja: "ドア", vi: "Cửa" },
  { code: "curtain", emoji: "🪢", en: "Curtain", zh: "窗帘", th: "ผ้าม่าน", ko: "커튼", ja: "カーテン", vi: "Rèm" },
  { code: "tree_cut", emoji: "🌳", en: "Tree Cut", zh: "砍树修剪", th: "ตัดต้นไม้", ko: "나무 절단", ja: "伐採", vi: "Cắt cây" },
];

const CLEANING_SUBTYPES = [
  { code: "regular", emoji: "✨", en: "Regular Clean", zh: "日常清洁", th: "ทำความสะอาดปกติ", ko: "일반 청소", ja: "通常清掃", vi: "Dọn thường" },
  { code: "medium", emoji: "🧽", en: "Medium Clean", zh: "中度清洁", th: "ทำความสะอาดระดับกลาง", ko: "중간 청소", ja: "中程度清掃", vi: "Dọn vừa" },
  { code: "deep", emoji: "🧹", en: "Deep Clean", zh: "深度清洁", th: "ทำความสะอาดเชิงลึก", ko: "심층 청소", ja: "ディープクリーニング", vi: "Dọn sâu" },
  { code: "external", emoji: "🏠", en: "External Clean", zh: "外部清洁", th: "ทำความสะอาดภายนอก", ko: "외부 청소", ja: "外部清掃", vi: "Ngoại thất" },
  { code: "gutter", emoji: "🌧️", en: "Gutter Clean", zh: "排水沟清洁", th: "ทำความสะอาดรางน้ำ", ko: "거터 청소", ja: "雨どい清掃", vi: "Máng xối" },
];


function BookServiceContent() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const t = (en: string, zh: string, th?: string, ko?: string, ja?: string, vi?: string) => {
    if (locale.startsWith("zh")) return zh;
    if (locale === "th") return th || en;
    if (locale === "ko") return ko || en;
    if (locale === "ja") return ja || en;
    if (locale === "vi") return vi || en;
    return en;
  };
  const isZh = locale.startsWith("zh");
  const [step, setStep] = useState<number>(1);
  const [category, setCategory] = useState("");
  const [subtype, setSubtype] = useState("");
  const [duration, setDuration] = useState(60);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [providerRate, setProviderRate] = useState<number | null>(null);
  const [providerName, setProviderName] = useState("");


  // Fetch matched provider's custom rate when service/date changes
  useEffect(() => {
    const svc = subtype || category;
    if (!svc || !date || !time) { setProviderRate(null); return; }
    const dayOfWeek = new Date(date).getDay();
    const hour = parseInt(time.split(":")[0] || "10");
    fetch(`/api/bookings/match-volunteer?serviceCode=${svc}&dayOfWeek=${dayOfWeek}&hour=${hour}`)
      .then(r => r.json())
      .then(d => {
        if (d.providerId) {
          // Found a provider — check their custom rate
          fetch(`/api/provider/rate?providerId=${d.providerId}&service=${svc}`)
            .then(r2 => r2.json())
            .then(d2 => {
              if (d2.hasCustomRate) {
                setProviderRate(d2.rate);
                setProviderName(d2.providerName || "");
              } else {
                setProviderRate(null);
                setProviderName("");
              }
            })
            .catch(() => setProviderRate(null));
        } else {
          setProviderRate(null);
          setProviderName("");
        }
      })
      .catch(() => setProviderRate(null));
  }, [category, subtype, date, time]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ bookingId?: string; total?: number } | null>(null);
  const [platformTier, setPlatformTier] = useState<"standard" | "premium" | "free">("standard");
  const [country, setCountry] = useState<"AU" | "CN">("AU");
  const [region, setRegion] = useState("");
  const AU_REGIONS = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "NT", "ACT"];
  const CN_REGIONS = ["北京 Beijing", "上海 Shanghai", "广州 Guangzhou", "深圳 Shenzhen", "成都 Chengdu", "杭州 Hangzhou", "武汉 Wuhan", "西安 Xi'an", "南京 Nanjing", "重庆 Chongqing", "天津 Tianjin", "苏州 Suzhou", "青岛 Qingdao", "长沙 Changsha", "郑州 Zhengzhou"];

  // Auto-select China when viewing in Simplified Chinese
  // Sync country after SSR hydration (useParams=null inside Suspense during SSR)
    useEffect(() => {
      if (locale === "zh") { setCountry("CN"); setRegion(""); }
    }, [locale]);
  const [showTierInfo, setShowTierInfo] = useState(false);

  const marketRate = subtype ? (SMART_RATE[subtype] || HOURLY_RATE) : (country === "CN" ? (CN_CATEGORY_RATE[category] || 120) : (CATEGORY_RATE[category] || HOURLY_RATE));
  const smartRate = providerRate || marketRate;
  const calInfo = getCalendarLabel(date, time);
  const effectiveRate = Math.round(smartRate * calInfo.mult * 100) / 100;
  const basePrice = Math.round((effectiveRate * duration / 60) * 100) / 100;
  const taxRate = country === "CN" ? 0.06 : 0.10; // VAT/GST: CN 6%, AU 10%
  const taxAmount = Math.round(basePrice * taxRate * 100) / 100;
  // Bank fee: Stripe 1.7% + 30c (free with PHLedger)
  // CN uses WeChat Pay / Alipay — no Stripe fee. Bank fee waived for CN.
  const bankFee = (platformTier === "free" || country === "CN") ? 0 : Math.round(((basePrice + taxAmount) * 0.017 + 0.30) * 100) / 100;
  // Cloud platform fee: serverless compute + database hosting
  const CLOUD_FEES = { standard: 1.50, premium: 3.50, free: 0 }; // per booking
  const cloudFee = CLOUD_FEES[platformTier];
  const totalPrice = Math.round((basePrice + taxAmount + bankFee + cloudFee) * 100) / 100;

  const submit = async () => {
    if (!category || !date || !time) return;
    setSubmitting(true);
    try {
      const subtypeNote = subtype ? `[${subtype}] ` : "";
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      const resp = await fetch("/api/bookings/charged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryCode: category, durationMin: duration, scheduledAt, notes: subtypeNote + notes, basePrice, taxAmount, bankFee, cloudFee, platformTier, totalPrice, country, region, currency: country === "CN" ? "CNY" : "AUD" }),
      });
      const d = await resp.json();
      if (d.bookingId) { setResult({ bookingId: d.bookingId, total: totalPrice }); setStep(4); }
      else { alert(d.error || "Booking failed"); }
    } catch { alert("Network error"); }
    setSubmitting(false);
  };

  
  // Tier info modal
  const TierInfoModal = () => {
    if (!showTierInfo) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowTierInfo(false)}>
        <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">{t("Cloud Platform Tiers", "云平台套餐", "แผนแพลตฟอร์ม", "클라우드 플랜", "クラウドプラン", "Gói nền tảng")}</h3>
            <button onClick={() => setShowTierInfo(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>

          {/* PHLedger Free */}
          <div className="border-2 border-green-200 rounded-xl p-4 mb-3 bg-green-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🆓</span>
              <span className="font-bold text-green-700">PHLedger</span>
              <span className="ml-auto text-green-700 font-bold">$0</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>✅ {t("Zero bank fees (PayTo NPP)", "零银行手续费 (PayTo NPP)", "ค่าธรรมเนียมธนาคาร ฟรี", "은행 수수료 없음", "銀行手数料無料", "Miễn phí ngân hàng")}</li>
              <li>✅ {t("Zero platform fees", "零平台费", "ค่าแพลตฟอร์ม ฟรี", "플랫폼 수수료 없음", "プラットフォーム無料", "Miễn phí nền tảng")}</li>
              <li>✅ {t("Instant settlement (< 1 second)", "即时结算 (< 1秒)", "ชำระทันที (< 1 วินาที)", "즉시 정산 (< 1초)", "即時決済 (< 1秒)", "Thanh toán tức thì")}</li>
              <li>✅ {t("Built-in invoicing & accounting", "内置发票和会计", "ออกใบแจ้งหนี้ในตัว", "내장 청구 & 회계", "組込み請求・会計", "Hóa đơn & kế toán tích hợp")}</li>
              <li>✅ {t("BAS/GST compliant journals", "BAS/GST合规日记账", "บัญชีตาม BAS/GST", "BAS/GST 준수", "BAS/GST準拠", "Tuân thủ BAS/GST")}</li>
            </ul>
            <p className="text-[10px] text-green-600 mt-2 italic">{t("Exclusive to PHLedger & SilverConnect", "仅限 PHLedger 与 SilverConnect", "เฉพาะ PHLedger & SilverConnect", "PHLedger & SilverConnect 전용", "PHLedger & SilverConnect 限定", "Chỉ cho PHLedger & SilverConnect")}</p>
          </div>

          {/* Standard */}
          <div className="border rounded-xl p-4 mb-3 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">☁️</span>
              <span className="font-bold text-blue-700">{t("Standard", "标准", "มาตรฐาน", "표준", "標準", "Tiêu chuẩn")}</span>
              <span className="ml-auto text-blue-700 font-bold">$1.50</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>💳 {t("Bank fee: 1.7% + 30c (Stripe)", "银行手续费: 1.7% + 30分 (Stripe)", "ค่าธรรมเนียม: 1.7% + 30c", "은행 수수료: 1.7% + 30c", "銀行手数料: 1.7% + 30c", "Phí NH: 1.7% + 30c")}</li>
              <li>☁️ {t("Serverless compute (auto-scale)", "无服务器计算 (自动扩展)", "Serverless (ปรับขนาดอัตโนมัติ)", "서버리스 (자동 확장)", "サーバーレス (自動スケール)", "Serverless (tự động mở rộng)")}</li>
              <li>🗄️ {t("Shared PostgreSQL database", "共享 PostgreSQL 数据库", "ฐานข้อมูล PostgreSQL ร่วม", "공유 PostgreSQL DB", "共有PostgreSQLデータベース", "PostgreSQL chung")}</li>
              <li>📊 {t("Xero integration for invoicing", "Xero 发票集成", "เชื่อมต่อ Xero", "Xero 청구 연동", "Xero請求書連携", "Tích hợp Xero")}</li>
              <li>⏱️ {t("Settlement: 2-7 business days", "结算: 2-7个工作日", "ชำระ: 2-7 วันทำการ", "정산: 2-7 영업일", "決済: 2-7営業日", "Thanh toán: 2-7 ngày")}</li>
            </ul>
          </div>

          {/* Premium */}
          <div className="border rounded-xl p-4 mb-3 bg-purple-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🚀</span>
              <span className="font-bold text-purple-700">{t("Premium", "高级", "พรีเมียม", "프리미엄", "プレミアム", "Cao cấp")}</span>
              <span className="ml-auto text-purple-700 font-bold">$3.50</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>💳 {t("Bank fee: 1.7% + 30c (Stripe)", "银行手续费: 1.7% + 30分 (Stripe)", "ค่าธรรมเนียม: 1.7% + 30c", "은행 수수료: 1.7% + 30c", "銀行手数料: 1.7% + 30c", "Phí NH: 1.7% + 30c")}</li>
              <li>🚀 {t("Dedicated compute (faster)", "专属计算 (更快)", "Dedicated (เร็วกว่า)", "전용 컴퓨트 (빠름)", "専用コンピュート (高速)", "Dedicated (nhanh hơn)")}</li>
              <li>🔒 {t("Private database (isolated)", "私有数据库 (隔离)", "ฐานข้อมูลส่วนตัว (แยก)", "프라이빗 DB (격리)", "プライベートDB (分離)", "DB riêng (cách ly)")}</li>
              <li>📊 {t("Xero + priority support", "Xero + 优先支持", "Xero + สนับสนุนลำดับแรก", "Xero + 우선 지원", "Xero + 優先サポート", "Xero + hỗ trợ ưu tiên")}</li>
              <li>⏱️ {t("Settlement: 2-7 business days", "结算: 2-7个工作日", "ชำระ: 2-7 วันทำการ", "정산: 2-7 영업일", "決済: 2-7営業日", "Thanh toán: 2-7 ngày")}</li>
              <li>📈 {t("99.9% uptime SLA", "99.9% 可用性 SLA", "SLA 99.9%", "99.9% SLA", "99.9% 稼働率SLA", "SLA 99.9%")}</li>
            </ul>
          </div>

          <p className="text-[10px] text-gray-400 text-center mt-3">{t("Powered by PHLedger", "由 PHLedger 提供技术支持", "ขับเคลื่อนโดย PHLedger", "PHLedger 기술 지원", "PHLedger 技術提供", "Được hỗ trợ bởi PHLedger")}</p>
        </div>
      </div>
    );
  };

// Step 1: Choose category
  if (step === 1) return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("Book a Service", "预约服务", "จองบริการ", "서비스 예약", "サービス予約")}</h1>
      <p className="text-lg text-gray-500 mb-6">{t("Choose a service category", "选择服务类别", "เลือกประเภทบริการ", "서비스 카테고리 선택", "カテゴリーを選択")}</p>

      {/* Country & Region Selector */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-medium text-gray-700">{t("Location", "地区", "ที่ตั้ง", "위치", "地域", "Khu vực")}</span>
        </div>
        <div className="flex gap-2 mb-3">
          <button onClick={() => { setCountry("AU"); setRegion(""); }} className={"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-semibold transition " + (country === "AU" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300")}>
            <span className="text-lg">{String.fromCodePoint(0x1F1E6, 0x1F1FA)}</span> {t("Australia", "澳大利亚", "ออสเตรเลีย", "호주", "オーストラリア", "Úc")}
            <span className="text-xs text-gray-400 ml-1">AUD</span>
          </button>
          <button onClick={() => { setCountry("CN"); setRegion(""); }} className={"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-semibold transition " + (country === "CN" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300")}>
            <span className="text-lg">{String.fromCodePoint(0x1F1E8, 0x1F1F3)}</span> {t("China", "中国大陆", "จีน", "중국", "中国", "Trung Quốc")}
            <span className="text-xs text-gray-400 ml-1">CNY</span>
          </button>
        </div>
        <select value={region} onChange={e => setRegion(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
          <option value="">{t("Select region", country === "CN" ? "选择城市" : "选择地区", "เลือกภูมิภาค", "지역 선택", "地域を選択", "Chọn vùng")}</option>
          {(country === "CN" ? CN_REGIONS : AU_REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {country === "CN" && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
            <span>{String.fromCodePoint(0x2139, 0xFE0F)}</span> {t("China: 6% VAT applies. Prices in CNY (¥). WeChat Pay / Alipay supported.", "中国大陆：增值税 6%，价格以人民币 (¥) 计。支持微信支付 / 支付宝。")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {CATEGORIES.map(c => (
          <button key={c.code} onClick={() => { setCategory(c.code); setSubtype(""); (c.code === "repair" || c.code === "cleaning") ? setStep(15) : setStep(2); }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm active:scale-[0.96] active:bg-teal-50"
            style={{ minHeight: "130px" }}>
            <span className="text-[42px] mb-2">{c.emoji}</span>
            <span className="text-[18px] font-semibold text-gray-900">{locale === "th" ? c.th : locale === "ko" ? c.ko : locale === "ja" ? c.ja : locale === "vi" ? c.vi : isZh ? c.zh : c.en}</span>
            <span className="text-sm text-emerald-600 mt-1 font-medium">{isZh ? "从" : "from"} {country === "CN" ? "¥" : "A$"}{country === "CN" ? (CN_CATEGORY_RATE[c.code] || 120) : (CATEGORY_RATE[c.code] || HOURLY_RATE)}/hr</span>
          </button>
        ))}
      </div>
    </main>
  );

  // Step 1.5: Subtype selection (repair or cleaning)
  if (step === 15) {
    const subtypes = category === "repair" ? REPAIR_SUBTYPES : CLEANING_SUBTYPES;
    const title = category === "repair"
      ? t("What type of repair?", "需要什么维修?", "ต้องการซ่อมแซมอะไร?", "어떤 수리가 필요하세요?", "どのような修理ですか?", "Loại sửa chữa nào?")
      : t("What type of cleaning?", "需要什么清洁?", "ต้องการทำความสะอาดแบบไหน?", "어떤 청소가 필요하세요?", "どのような清掃ですか?", "Loại dọn dẹp nào?");
    return (
      <main className="max-w-lg mx-auto p-6">
        <button onClick={() => setStep(1)} className="text-teal-700 text-lg mb-4">← {t("Back", "返回", "กลับ", "뒤로", "戻る")}</button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-lg text-gray-500 mb-6">{category === "repair" ? t("Select repair type", "选择维修类型", "เลือกประเภทการซ่อม", "수리 유형 선택", "修理タイプを選択") : t("Select cleaning level", "选择清洁类型", "เลือกระดับความสะอาด", "청소 유형 선택", "清掃レベルを選択")}</p>
        <div className="grid grid-cols-2 gap-4">
          {subtypes.map(s => (
            <button key={s.code} onClick={() => { setSubtype(s.code); setStep(2); }}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm active:scale-[0.96] active:bg-teal-50"
              style={{ minHeight: "110px" }}>
              <span className="text-[36px] mb-2">{s.emoji}</span>
              <span className="text-[16px] font-semibold text-gray-900">{locale === "zh" || locale === "zh_tw" ? s.zh : locale === "th" ? s.th : locale === "ko" ? s.ko : locale === "ja" ? s.ja : locale === "vi" ? (s as any).vi || s.en : s.en}</span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  // Step 2: Date, time, duration
  if (step === 2) return (
    <main className="max-w-lg mx-auto p-6">
        <TierInfoModal />
      <button onClick={() => setStep(1)} className="text-teal-700 text-lg mb-4">← {t("Back", "返回", "กลับ", "뒤로", "戻る")}</button>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("Choose Date & Time", "选择时间", "เลือกวันและเวลา", "날짜 및 시간 선택", "日時を選択")}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-1">{t("Date", "日期", "วันที่", "날짜", "日付")}</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-4 border border-gray-300 rounded-xl text-lg" />
        </div>
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-1">{t("Time", "时间", "เวลา", "시간", "時間")}</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-xl text-lg" />
        </div>
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-1">{t("Duration", "时长", "ระยะเวลา", "시간", "所要時間")}</label>
          <div className="grid grid-cols-3 gap-3">
            {[60, 90, 120, 480, 720, 1440].map(d => (
              <button key={d} onClick={() => setDuration(d)}
                className={"rounded-xl border-2 p-4 text-center text-lg font-semibold " + (duration === d ? "border-teal-600 bg-teal-50 text-teal-800" : "border-gray-200 text-gray-600")}>
                {d >= 480 ? (d/60) + (isZh ? "小时（换班制）" : "hr (shifts)") : d + " " + t("min", "分钟", "นาที", "분", "分")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-1">{t("Notes (optional)", "备注", "หมายเหตุ (ถ้ามี)", "메모 (선택)", "メモ（任意）")}</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder={t("Any special requirements...", "任何特殊要求...", "ข้อกำหนดพิเศษ...", "특별 요청사항...", "特別な要望...")}
            className="w-full p-4 border border-gray-300 rounded-xl text-lg" />
        </div>
      </div>
      
      {/* Live Price Display */}
      {category && (
        <div className="mt-6 bg-gradient-to-b from-teal-50 to-white border-2 border-teal-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">{t("✨ Smart Price", "✨ 智能定价", "✨ ราคาอัจฉริยะ", "✨ 스마트 가격", "✨ スマート価格", "✨ Giá thông minh")}</h3>
            {calInfo.mult > 1 && (
              <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                {calInfo.label}
              </span>
            )}
          </div>

          {/* Rate breakdown */}
          <div className="space-y-1.5 text-[15px]">
            <div className="flex justify-between text-gray-600">
              <span>{providerRate ? t("Provider rate", "服务商定价", "ราคาผู้ให้บริการ", "제공자 요금", "提供者料金", "Giá nhà cung cấp") : t("Market rate", "市场价", "ราคาตลาด", "시장 요금", "市場価格", "Giá thị trường")}</span>
              <span className={providerRate ? "font-bold text-indigo-700" : ""}>${smartRate}/hr</span>
            </div>
            {providerRate && providerRate !== marketRate && (
              <div className="flex justify-between text-gray-400 line-through text-sm">
                <span>{t("Market rate", "市场价", "ราคาตลาด", "시장 요금", "市場価格", "Giá thị trường")}</span>
                <span>${marketRate}/hr</span>
              </div>
            )}
            {calInfo.mult > 1 && (
              <div className="flex justify-between text-red-600">
                <span>{calInfo.label} ({calInfo.mult}×)</span>
                <span>${effectiveRate}/hr</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>{t("Duration", "时长", "ระยะเวลา", "시간", "所要時間", "Thời gian")}</span>
              <span>{duration >= 60 ? (duration/60) + (isZh ? "小时" : "hr") : duration + "min"}</span>
            </div>
            <hr className="my-2" />
            <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center justify-between">
                <span>{t("Cloud Platform", "云平台", "แพลตฟอร์มคลาวด์", "클라우드 플랫폼", "クラウド", "Nền tảng")}</span>
                <button onClick={() => setShowTierInfo(true)} className="text-blue-500 hover:text-blue-700 text-[11px] underline">{t("Details", "详情", "รายละเอียด", "상세", "詳細", "Chi tiết")}</button>
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPlatformTier("free")} className={`flex-1 text-[11px] py-1.5 rounded-md border transition ${platformTier === "free" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-300"}`}>
                  🆓 PHLedger
                </button>
                <button onClick={() => setPlatformTier("standard")} className={`flex-1 text-[11px] py-1.5 rounded-md border transition ${platformTier === "standard" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300"}`}>
                  ☁️ {t("Standard", "标准", "มาตรฐาน", "표준", "標準", "Tiêu chuẩn")}
                </button>
                <button onClick={() => setPlatformTier("premium")} className={`flex-1 text-[11px] py-1.5 rounded-md border transition ${platformTier === "premium" ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-300"}`}>
                  🚀 {t("Premium", "高级", "พรีเมียม", "프리미엄", "プレミアム", "Cao cấp")}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5">
                {platformTier === "free" ? t("PHLedger PayTo — zero fees, instant settlement", "PHLedger PayTo — 零手续费，即时结算", "PHLedger PayTo — ฟรี ชำระทันที", "PHLedger PayTo — 수수료 없음, 즉시 정산", "PHLedger PayTo — 手数料無料・即時決済", "PHLedger PayTo — miễn phí, thanh toán tức thì") : platformTier === "standard" ? t("Serverless compute + shared database ($1.50/booking)", "无服务器计算 + 共享数据库 ($1.50/次)", "Serverless + ฐานข้อมูลแชร์ ($1.50/ครั้ง)", "서버리스 + 공유 DB ($1.50/건)", "サーバーレス + 共有DB ($1.50/件)", "Serverless + DB chung ($1.50/lần)") : t("Dedicated compute + private database ($3.50/booking)", "专属计算 + 私有数据库 ($3.50/次)", "Dedicated + ฐานข้อมูลส่วนตัว ($3.50/ครั้ง)", "전용 컴퓨트 + 프라이빗 DB ($3.50/건)", "専用コンピュート + プライベートDB ($3.50/件)", "Dedicated + DB riêng ($3.50/lần)")}
              </p>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>{t("Subtotal", "小计", "ยอดรวม", "소계", "小計", "Tạm tính")}</span>
              <span>{country === "CN" ? "¥" : "A$"}{basePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-sm">
              <span>+ {country === "CN" ? "VAT 6%" : "GST 10%"}</span>
              <span>{country === "CN" ? "¥" : "A$"}{taxAmount.toFixed(2)}</span>
            </div>
            {bankFee > 0 && (
              <div className="flex justify-between text-gray-500 text-sm">
                <span>{t("+ Bank fee", "+ 银行手续费", "+ ค่าธรรมเนียม", "+ 은행 수수료", "+ 銀行手数料", "+ Phí NH")}</span>
                <span>{country === "CN" ? "¥" : "A$"}{bankFee.toFixed(2)}</span>
              </div>
            )}
            {cloudFee > 0 && (
              <div className="flex justify-between text-gray-500 text-sm">
                <span>{t("+ Cloud platform", "+ 云平台", "+ คลาวด์", "+ 클라우드", "+ クラウド", "+ Cloud")}</span>
                <span>${cloudFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-teal-800 border-t pt-2 mt-2">
              <span>{t("Total", "总计", "ทั้งหมด", "합계", "合計", "Tổng")}</span>
              <span>{country === "CN" ? "¥" : "A$"}{totalPrice.toFixed(2)}</span>
            </div>

          <p className="text-xs text-gray-400 text-center mt-3 italic">
            {providerRate ? t("Custom rate by " + providerName, "由" + providerName + "设定", providerName + " กำหนด", providerName + " 설정 요금", providerName + " 設定料金", "Giá bởi " + providerName) : t("Market recommended rate", "市场推荐价格", "ราคาแนะนำตลาด", "시장 추천 요금", "市場推奨料金", "Giá khuyến nghị")}
          </p>
          </div>

          
        </div>
      )}

      <button onClick={() => setStep(3)} disabled={!date}
        className="mt-6 w-full py-4 bg-teal-700 text-white text-xl font-bold rounded-xl disabled:opacity-50">
        {t("Next → Review", "下一步", "ถัดไป → ตรวจสอบ", "다음 → 확인", "次へ → 確認")}
      </button>
    </main>
  );

  // Step 3: Review & confirm
  if (step === 3) {
    const cat = CATEGORIES.find(c => c.code === category);
    return (
      <main className="max-w-lg mx-auto p-6">
        <button onClick={() => setStep(2)} className="text-teal-700 text-lg mb-4">← {t("Back", "返回", "กลับ", "뒤로", "戻る")}</button>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("Review Booking", "确认预约", "ตรวจสอบการจอง", "예약 확인", "予約確認")}</h2>
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{cat?.emoji}</span>
            <div>
              <p className="text-xl font-bold text-gray-900">{isZh ? cat?.zh : cat?.en}</p>
              <p className="text-gray-500">{duration} {isZh ? "分钟" : "minutes"}</p>
            </div>
          </div>
          <hr />
          <div className="flex justify-between text-lg">
            <span className="text-gray-600">{t("Date", "日期", "วันที่", "날짜", "日付")}</span>
            <span className="font-medium">{date}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="text-gray-600">{t("Time", "时间", "เวลา", "시간", "時間")}</span>
            <span className="font-medium">{time}</span>
          </div>
          <hr />
          <div className="flex justify-between text-lg">
            <span className="text-gray-600">{t("Service fee", "基本费用", "ค่าบริการ", "서비스 비용", "サービス料")}</span>
            <span className="font-medium">{country === "CN" ? "¥" : "A$"}{basePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="text-gray-600">{country === "CN" ? "VAT (6%)" : "GST (10%)"}</span>
            <span className="font-medium">{country === "CN" ? "¥" : "A$"}{taxAmount.toFixed(2)}</span>
          </div>
          {bankFee > 0 && (
            <div className="flex justify-between text-lg">
              <span className="text-gray-600">{t("Bank fee", "银行手续费", "ค่าธรรมเนียม", "은행 수수료", "銀行手数料")}</span>
              <span className="font-medium">{country === "CN" ? "¥" : "A$"}{bankFee.toFixed(2)}</span>
            </div>
          )}
          {cloudFee > 0 && (
            <div className="flex justify-between text-lg">
              <span className="text-gray-600">{t("Cloud platform", "云平台", "คลาวด์", "클라우드", "クラウド")} ({platformTier})</span>
              <span className="font-medium">${cloudFee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold border-t pt-3">
            <span>{t("Total", "总计", "ทั้งหมด", "합계", "合計")}</span>
            <span className="text-teal-800">{country === "CN" ? "¥" : "A$"}{totalPrice.toFixed(2)}</span>
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-gray-400">
          {t("Funds held securely until service is completed", "资金安全保管至服务完成", "เงินถูกเก็บอย่างปลอดภัยจนกว่าบริการจะเสร็จสิ้น", "서비스 완료까지 안전하게 보관됩니다", "サービス完了まで安全に保管されます")}
        </p>
        <button onClick={submit} disabled={submitting}
          className="mt-6 w-full py-5 bg-green-600 text-white text-xl font-bold rounded-xl disabled:opacity-50 active:scale-[0.98]">
          {submitting ? "..." : (t("Confirm & Pay", "确认并支付", "ยืนยันและชำระเงิน", "확인 및 결제", "確認して支払う"))}
        </button>
      </main>
    );
  }

  // Step 4: Confirmation
  return (
    <main className="max-w-lg mx-auto p-6 text-center">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("Booking Confirmed!", "预约成功!", "จองสำเร็จ!", "예약 완료!", "予約確定！")}</h2>
      <p className="text-lg text-gray-600 mb-6">{t("Total", "总计", "ทั้งหมด", "합계", "合計")}: {country === "CN" ? "¥" : "A$"}{result?.total?.toFixed(2)}</p>
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <p className="text-green-700">{t("Your verified helper will contact you shortly", "您的专业服务人员将很快联系您", "ผู้ช่วยที่ผ่านการตรวจสอบจะติดต่อคุณเร็วๆ นี้", "인증된 도우미가 곧 연락드립니다", "認定ヘルパーがまもなくご連絡します")}</p>
      </div>
      <button onClick={() => router.push("/" + locale + "/dashboard")}
        className="w-full py-4 bg-teal-700 text-white text-lg font-bold rounded-xl">
        {t("Go to Dashboard", "返回首页", "กลับหน้าหลัก", "대시보드로", "ダッシュボードへ")}
      </button>
    </main>
  );
}

export default function BookServicePage() { return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><BookServiceContent /></Suspense>; }
