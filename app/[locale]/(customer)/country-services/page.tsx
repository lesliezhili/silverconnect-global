import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";
import {
  CountryCode,
  CURRENCY_SYMBOL,
  COUNTRIES,
} from "@/components/domain/country";

/* ── Hourly rates per country × category ── */
const RATES: Record<CountryCode, Record<string, number>> = {
  AU: { cleaning: 49, garden: 53, repair: 65, personalCare: 57, companion: 48, transport: 50 },
  CN: { cleaning: 25, garden: 22, repair: 35, personalCare: 30, companion: 22, transport: 28 },
  CA: { cleaning: 42, garden: 45, repair: 55, personalCare: 50, companion: 42, transport: 44 },
  US: { cleaning: 45, garden: 48, repair: 59, personalCare: 54, companion: 45, transport: 47 },
  TW: { cleaning: 350, garden: 310, repair: 490, personalCare: 420, companion: 310, transport: 390 },
  SG: { cleaning: 45, garden: 40, repair: 63, personalCare: 54, companion: 40, transport: 50 },
  HK: { cleaning: 150, garden: 130, repair: 210, personalCare: 180, companion: 130, transport: 170 },
  MY: { cleaning: 63, garden: 55, repair: 88, personalCare: 75, companion: 55, transport: 70 },
};

const COUNTRY_INFO: Record<CountryCode, { flag: string; nameEn: string; nameZh: string; lang: string; langZh: string; highlights: string[]; highlightsZh: string[] }> = {
  AU: {
    flag: "🇦🇺", nameEn: "Australia", nameZh: "澳大利亚",
    lang: "English + Mandarin", langZh: "英语+普通话",
    highlights: ["NDIS-compatible services", "Police-checked providers", "Medicare-aligned pricing"],
    highlightsZh: ["NDIS兼容服务", "警察审查提供者", "Medicare对齐价格"],
  },
  CN: {
    flag: "🇨🇳", nameEn: "China", nameZh: "中国",
    lang: "Mandarin", langZh: "普通话",
    highlights: ["Same-day booking", "WeChat Pay accepted", "Local community providers"],
    highlightsZh: ["当天预约", "接受微信支付", "本地社区提供者"],
  },
  CA: {
    flag: "🇨🇦", nameEn: "Canada", nameZh: "加拿大",
    lang: "English + Mandarin + Cantonese", langZh: "英语+普通话+粤语",
    highlights: ["Provincial health plan aligned", "Bilingual providers (EN/ZH)", "Winter-ready home services"],
    highlightsZh: ["省级医疗计划对齐", "双语提供者（英/中）", "冬季家庭服务"],
  },
  US: {
    flag: "🇺🇸", nameEn: "United States", nameZh: "美国",
    lang: "English + Mandarin", langZh: "英语+普通话",
    highlights: ["Major metro coverage (NYC, LA, SF)", "Background-checked providers", "Insurance-compatible"],
    highlightsZh: ["主要城市覆盖（纽约/洛杉矶/旧金山）", "背景审查提供者", "保险兼容"],
  },
  TW: {
    flag: "🇹🇼", nameEn: "Taiwan", nameZh: "台灣",
    lang: "Mandarin + Hokkien", langZh: "普通話+閩南語",
    highlights: ["NHI-aligned pricing", "Long-term care 2.0 integration", "Traditional medicine friendly"],
    highlightsZh: ["健保對齊價格", "長照2.0整合", "中醫友善"],
  },
  SG: {
    flag: "🇸🇬", nameEn: "Singapore", nameZh: "新加坡",
    lang: "English + Mandarin + Cantonese", langZh: "英语+普通话+粤语",
    highlights: ["MediSave-compatible", "Pioneer Generation support", "Island-wide coverage"],
    highlightsZh: ["MediSave兼容", "建国一代支持", "全岛覆盖"],
  },
  HK: {
    flag: "🇭🇰", nameEn: "Hong Kong", nameZh: "香港",
    lang: "Cantonese + Mandarin + English", langZh: "粤语+普通话+英语",
    highlights: ["CSSA-aligned", "MTR-accessible providers", "Elderly Health Voucher scheme"],
    highlightsZh: ["综援对齐", "地铁可达提供者", "长者医疗券计划"],
  },
  MY: {
    flag: "🇲🇾", nameEn: "Malaysia", nameZh: "马来西亚",
    lang: "Mandarin + Malay + English", langZh: "普通话+马来语+英语",
    highlights: ["Affordable rates", "Chinese-speaking providers", "Penang/KL/JB coverage"],
    highlightsZh: ["实惠价格", "华语提供者", "槟城/吉隆坡/新山覆盖"],
  },
};

const CATEGORIES = [
  { code: "cleaning", emoji: "🧹", nameEn: "Home Cleaning", nameZh: "居家清洁" },
  { code: "garden", emoji: "🌿", nameEn: "Garden & Outdoor", nameZh: "花园户外" },
  { code: "repair", emoji: "🔧", nameEn: "Home Repair", nameZh: "家居维修" },
  { code: "personalCare", emoji: "💊", nameEn: "Personal Care", nameZh: "个人护理" },
  { code: "companion", emoji: "👋", nameEn: "Companionship", nameZh: "陪伴服务" },
  { code: "transport", emoji: "🚗", nameEn: "Transport", nameZh: "出行交通" },
];

export default async function CountryServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const country = await getCountry();
  const session = await getSession();
  const isZh = locale === "zh" || locale === "zh_tw";

  return (
    <>
      <Header
        country={country}
        back
        signedIn={session.signedIn}
        initials={session.initials}
      />
      <main className="mx-auto w-full max-w-content px-5 pb-[120px] pt-5 sm:pb-12">
        <h1 className="text-elder-heading font-bold text-text-primary">
          {isZh ? "🌏 全球服务覆盖" : "🌏 Services Across Countries"}
        </h1>
        <p className="mt-2 text-[17px] text-text-secondary">
          {isZh
            ? "SilverConnect 在8个国家/地区运营。无论您的长辈在哪里，我们都能提供当地华语服务。"
            : "SilverConnect operates in 8 countries. Wherever your elderly family lives, we provide local Chinese-speaking services."}
        </p>

        {/* Quick Stats Banner */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-brand-primary-soft p-4 text-center">
            <p className="text-2xl font-bold text-brand">8</p>
            <p className="text-[15px] text-text-secondary">{isZh ? "国家/地区" : "Countries"}</p>
          </div>
          <div className="rounded-lg bg-success-soft p-4 text-center">
            <p className="text-2xl font-bold text-success">6</p>
            <p className="text-[15px] text-text-secondary">{isZh ? "服务类别" : "Categories"}</p>
          </div>
          <div className="rounded-lg bg-warning-soft p-4 text-center">
            <p className="text-2xl font-bold text-warning">6</p>
            <p className="text-[15px] text-text-secondary">{isZh ? "语言支持" : "Languages"}</p>
          </div>
          <div className="rounded-lg bg-bg-surface p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">15%</p>
            <p className="text-[15px] text-text-secondary">{isZh ? "平台费" : "Platform Fee"}</p>
          </div>
        </div>

        {/* Country Cards */}
        <section className="mt-8 flex flex-col gap-6">
          {COUNTRIES.map((cc) => {
            const info = COUNTRY_INFO[cc];
            const rates = RATES[cc];
            const sym = CURRENCY_SYMBOL[cc];

            return (
              <article
                key={cc}
                className="overflow-hidden rounded-xl border border-border bg-bg-base shadow-card"
              >
                {/* Country Header */}
                <div className="flex items-center gap-3 border-b border-border bg-bg-surface px-5 py-4">
                  <span className="text-3xl">{info.flag}</span>
                  <div>
                    <h2 className="text-elder-body font-bold text-text-primary">
                      {isZh ? info.nameZh : info.nameEn}
                    </h2>
                    <p className="text-[15px] text-text-secondary">
                      🗣 {isZh ? info.langZh : info.lang}
                    </p>
                  </div>
                  {cc === country && (
                    <span className="ml-auto rounded-pill bg-brand px-3 py-1 text-[13px] font-bold text-white">
                      {isZh ? "当前" : "Current"}
                    </span>
                  )}
                </div>

                {/* Highlights */}
                <div className="px-5 pt-4">
                  <div className="flex flex-wrap gap-2">
                    {(isZh ? info.highlightsZh : info.highlights).map((h, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-pill bg-brand-primary-soft px-3 py-1 text-[14px] font-medium text-brand"
                      >
                        ✓ {h}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pricing Grid */}
                <div className="mt-3 grid grid-cols-2 gap-2 px-5 pb-5 sm:grid-cols-3">
                  {CATEGORIES.map((cat) => (
                    <div
                      key={cat.code}
                      className="flex items-center gap-2 rounded-md bg-bg-surface px-3 py-2"
                    >
                      <span>{cat.emoji}</span>
                      <div>
                        <p className="text-[14px] font-medium text-text-primary">
                          {isZh ? cat.nameZh : cat.nameEn}
                        </p>
                        <p className="text-[14px] font-semibold text-brand">
                          {sym}{rates[cat.code]}/{isZh ? "时" : "h"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="border-t border-border px-5 py-3">
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-2 text-[17px] font-semibold text-brand"
                  >
                    {isZh ? `浏览${info.nameZh}服务 →` : `Browse ${info.nameEn} services →`}
                  </Link>
                </div>
              </article>
            );
          })}
        </section>

        {/* Cross-Border Feature */}
        <section className="mt-10 rounded-xl border-2 border-brand bg-brand-primary-soft p-6">
          <h2 className="text-elder-subheading font-bold text-text-primary">
            {isZh ? "✈️ 跨国预约" : "✈️ Cross-Border Booking"}
          </h2>
          <p className="mt-2 text-[17px] text-text-secondary">
            {isZh
              ? "您的父母在中国，您在澳大利亚？没问题！您可以为任何国家的长辈远程预约服务。一个账户，全球照顾。"
              : "Your parents in China, you in Australia? No problem! Book services for your elderly family in any country remotely. One account, global care."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/home"
              className="inline-flex h-12 items-center justify-center rounded-md bg-brand px-6 text-[17px] font-bold text-white"
            >
              {isZh ? "立即预约" : "Book Now"}
            </Link>
            <Link
              href="/services"
              className="inline-flex h-12 items-center justify-center rounded-md border-2 border-brand px-6 text-[17px] font-bold text-brand"
            >
              {isZh ? "浏览全部服务" : "Browse All Services"}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
