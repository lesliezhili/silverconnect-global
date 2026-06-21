import { setRequestLocale, getTranslations } from "next-intl/server";
import { landingT } from "@/lib/i18n/landing";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/Header";
import { cookies } from 'next/headers'
import { getCountry } from "@/components/domain/countryCookie";
import { getCurrentUser } from "@/lib/auth/server";
import { redirect } from "@/i18n/navigation";

// No forced Bible content on public landing — faith content is opt-in after login

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentUser();
  const country = await getCountry(locale);
  const faith = (await cookies()).get('sc-faith')?.value
  if (me) { redirect({ href: "/home", locale }); }
  const zh = locale === "zh" || locale === "zh_tw";
  const isCN = country === "CN";
  const tCare = await getTranslations("care");
  const t = (k: string) => landingT(locale, k);

  // Prayer widget removed from public landing page — faith content is opt-in for logged-in Christian users only


  return (
    <>
      <Header country={country} signedIn={false} />
      <main className="mx-auto w-full max-w-content px-5 pb-32 pt-8">

        {/* Hero — Faith Mission + Visual Warmth */}
        <section className="mb-10 text-center">
          <h1 className="text-[32px] font-bold leading-tight text-gray-900 sm:text-[40px]">
            {t("heroTitle1")}
            <br />
            {t("heroTitle2")}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[20px] text-gray-600">
            {t("heroSub")}
          </p>
          {/* Visual warmth — illustration placeholder */}
          <div className="mx-auto mt-6 flex h-[180px] max-w-[320px] items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-amber-50 border-2 border-blue-100">
            <div className="text-center">
              <img
                src="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=400&h=240&fit=crop&crop=faces"
                alt={t("altPhoto")}
                className="w-full h-44 object-cover rounded-xl mb-3"
                loading="eager"
              />
              <p className="mt-2 text-[17px] text-gray-600 font-medium">
                {t("heroPhoto")}
              </p>
            </div>
          </div>
        </section>

        {/* Primary CTA */}
        <section className="mb-10 space-y-4">
          <Link href="/auth/register" className="flex w-full items-center justify-center rounded-2xl bg-blue-600 px-6 py-6 text-center text-[22px] font-bold text-white shadow-lg active:scale-[0.98]" style={{ minHeight: "72px" }}>
            {t("joinNow")}
          </Link>
          <Link href="/auth/login" className="flex w-full items-center justify-center rounded-2xl border-2 border-gray-300 bg-white px-6 py-5 text-center text-[20px] font-semibold text-gray-700 active:scale-[0.98]" style={{ minHeight: "64px" }}>
            {t("signIn")}
          </Link>
        </section>




        {/* ── Two Care Pillars ── */}
        <section className="mb-10">
          <h2 className="mb-2 text-center text-[24px] font-bold text-gray-900">{tCare("careChoose")}</h2>
          <p className="mb-5 text-center text-[17px] text-gray-500">{tCare("careChooseSub")}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Pillar 1: Home-Based Care */}
            <Link
              href="/services"
              className="group relative flex flex-col rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm transition-all hover:border-blue-400 hover:shadow-lg active:scale-[0.98]"
              style={{ minHeight: "260px" }}
            >
              <span className="absolute top-3 right-3 rounded-full bg-blue-100 px-3 py-1 text-[12px] font-bold text-blue-700">{tCare("homeBadge")}</span>
              <span className="text-[48px] mb-3">🏠</span>
              <h3 className="text-[20px] font-bold text-gray-900 mb-2">{tCare("homeTitle")}</h3>
              <p className="text-[15px] text-gray-600 mb-3">{tCare("homeSub")}</p>
              <p className="text-[13px] text-gray-400 mb-4">{tCare("homeFeatures")}</p>
              <span className="mt-auto inline-flex items-center text-[16px] font-semibold text-blue-600 group-hover:text-blue-800">
                {tCare("homeCTA")} →
              </span>
            </Link>

            {/* Pillar 2: Day Care Facility */}
            <Link
              href="/help"
              className="group relative flex flex-col rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm transition-all hover:border-emerald-400 hover:shadow-lg active:scale-[0.98]"
              style={{ minHeight: "260px" }}
            >
              <span className="absolute top-3 right-3 rounded-full bg-emerald-100 px-3 py-1 text-[12px] font-bold text-emerald-700">{tCare("facilityBadge")}</span>
              <span className="text-[48px] mb-3">🏛️</span>
              <h3 className="text-[20px] font-bold text-gray-900 mb-2">{tCare("facilityTitle")}</h3>
              <p className="text-[15px] text-gray-600 mb-3">{tCare("facilitySub")}</p>
              <p className="text-[13px] text-gray-400 mb-4">{tCare("facilityFeatures")}</p>
              <span className="mt-auto inline-flex items-center text-[16px] font-semibold text-emerald-600 group-hover:text-emerald-800">
                {tCare("facilityCTA")} →
              </span>
            </Link>
          </div>
        </section>

        {/* How It Works — Softened Step 3 language */}
        <section className="mb-10">
          <h2 className="mb-5 text-center text-[24px] font-bold text-gray-900">{t("howTitle2")}</h2>
          <div className="flex flex-col gap-4">
            {[
              { n: "1", e: "📱", label: t("step1") },
              { n: "2", e: "🔍", label: t("step2") },
              { n: "3", e: "🔒", label: t("step3") },
              { n: "4", e: "⭐", label: t("step4") },
            ].map((i) => (
              <div key={i.n} className="flex items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[24px] font-bold text-blue-600">{i.n}</div>
                <span className="text-[20px] font-semibold text-gray-900">{i.e} {i.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Services — Clickable cards linking to signup with category pre-selected */}
        <section className="mb-10">
          <h2 className="mb-4 text-[24px] font-bold text-gray-900">{t("servicesTitle")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { e: "🧹", cat: "cleaning", label: t("cleaning") },
              { e: "🌳", cat: "garden", label: t("garden") },
              { e: "🔧", cat: "repair", label: t("repair") },
              { e: "💊", cat: "personalCare", label: t("personalCare") },
              { e: "👋", cat: "companion", label: t("companion") },
              { e: "🚗", cat: "transport", label: t("transport") },
              { e: "💻", cat: "itSupport",       label: t("itSupport") },
              { e: "🎵", cat: "musicLesson",     label: t("musicLesson") },
              { e: "🎨", cat: "artClass",         label: t("artClass") },
              { e: "🤖", cat: "digitalLiteracy",  label: t("digitalLiteracy") }
            ].map((s) => (
              <Link
                key={s.cat}
                href="/book-service"
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50 hover:shadow-lg active:scale-[0.96] active:bg-blue-100"
                style={{ minHeight: "130px" }}
              >
                <span className="mb-2 text-[42px]">{s.e}</span>
                <span className="text-[18px] font-semibold text-gray-900">{s.label}</span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-center text-[16px] text-gray-400">
            {t("servicesTap")}
          </p>
        </section>

        {/* Safety & Trust — Using actual ✅ emoji, not escaped unicode */}
        <section className="mb-10 rounded-2xl border-2 border-green-200 bg-green-50 p-6">
          <h2 className="mb-4 text-[24px] font-bold text-gray-900">{t("safetyTitle2")}</h2>
          <ul className="space-y-3 text-[20px] text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-green-600 shrink-0">{"✅"}</span>
              <span>{t("safe1")}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 shrink-0">{"✅"}</span>
              <span>{t("safe2")}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 shrink-0">{"✅"}</span>
              <span>{t("safe3")}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 shrink-0">{"✅"}</span>
              <span>{t("safeSOS")}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 shrink-0">{"✅"}</span>
              <span>{t("safeRating")}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 shrink-0">{"✅"}</span>
              <span>{t("safeFunds")}</span>
            </li>
          </ul>
        </section>

        {/* Government Funding — country-adaptive */}
        <section className="mb-10 rounded-2xl border-2 border-purple-200 bg-purple-50 p-6">
          <h2 className="mb-3 text-[24px] font-bold text-gray-900">{t("fundingTitle2")}</h2>
          <div className="flex flex-wrap gap-2">
            {(isCN
              ? ["民政救助", "基本养老险", "基本医保", "长期护理险", "残障补贴", "高龄津贴", "医疗救助"]
              : ["NDIS", "TAC", "WorkSafe", "DVA", "My Aged Care", "Aged Pension", "Super"]
            ).map((s) => (
              <span key={s} className="rounded-full border border-purple-200 bg-white px-4 py-2 text-[18px] font-semibold text-purple-700">{s}</span>
            ))}
          </div>
          <p className="mt-4 text-[18px] text-gray-700 leading-relaxed">
            {isCN
              ? "提供您的参保号 + 用手机拍照批准信或上传PDF = 即可使用政府资助"
              : zh
              ? "提供您的索赔号 + 用手机拍照批准信或上传PDF = 即可使用政府资助"
              : "Claim number + a photo of your approval letter (or PDF) = funded care"}
          </p>
          <p className="mt-2 text-[16px] text-purple-600 font-medium">
            {t("fundingExtract")}
          </p>
          <p className="text-[15px] text-gray-400 mt-1 px-4">
            {t("fundingReassure")}
          </p>
        </section>

        {/* 基督徒互助平台 — teaser card linking to dedicated page */}
        {zh && faith === 'christian' && (
            <a href={`/${locale}/christian`} className="mb-10 flex items-center gap-4 rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 hover:bg-amber-100 transition-colors">
              <span className="text-3xl shrink-0">✝️</span>
              <div className="flex-1">
                <h2 className="text-[20px] font-bold text-gray-900">{t("christianTitle")}</h2>
                <p className="text-[15px] text-amber-700 mt-1">{zh ? "免费查经 · 祷告小组 · 牧师探访" : "Bible study · Prayer · Pastoral visits"}</p>
              </div>
              <span className="text-amber-600 text-[20px] font-bold shrink-0">→</span>
            </a>
        )}

        {/* 和润心语者 — aged emotional companion, Chinese locale only */}
        {zh && (
          <a
            href={`/${locale}/xinyuzhe`}
            className="mb-10 flex items-start gap-4 rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50 border-2 border-rose-200 p-5 shadow-sm active:scale-[0.98] transition-transform"
          >
            <span className="text-[42px] shrink-0">🌸</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[20px] font-bold text-gray-900">和润心语者</h3>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[12px] font-medium text-rose-700">老年心理健康</span>
              </div>
              <p className="text-[15px] text-gray-600 leading-relaxed">专属情感陞伴 · 数字生命传记 · 心理健康支持</p>
              <p className="mt-1.5 text-[14px] font-semibold text-rose-600">立即预约 →</p>
            </div>
          </a>
        )}

                {/* Fair Pricing — Visual comparison cards */}
        <section className="mb-10">
          <h2 className="mb-4 text-[24px] font-bold text-gray-900">{t("pricingTitle")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* SilverConnect card */}
            <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-5 text-center shadow-sm">
              <p className="text-[16px] font-bold text-green-700 uppercase tracking-wide">{isCN ? "九鼎银联" : "SilverConnect"}</p>
              <p className="mt-2 text-[36px] font-extrabold text-green-700">15%</p>
              <p className="mt-1 text-[16px] text-green-600">{t("platformFee")}</p>
              <div className="mt-3 rounded-lg bg-green-100 p-2">
                <p className="text-[15px] text-green-800 font-semibold">
                  {t("carerKeeps85")}
                </p>
              </div>
            </div>
            {/* Industry average card */}
            <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-5 text-center shadow-sm">
              <p className="text-[16px] font-bold text-gray-500 uppercase tracking-wide">{t("industryAvg")}</p>
              <p className="mt-2 text-[36px] font-extrabold text-gray-400 line-through">25-40%</p>
              <p className="mt-1 text-[16px] text-gray-400">{t("platformFee")}</p>
              <div className="mt-3 rounded-lg bg-gray-100 p-2">
                <p className="text-[15px] text-gray-500">
                  {t("carerKeeps60")}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
              <p className="text-[15px] text-green-700 font-medium">
                {t("belowCaps")}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
              <p className="text-[15px] text-gray-400 font-medium">
                {t("highOverhead")}
              </p>
            </div>
          </div>
          <p className="mt-3 text-center text-[17px] text-gray-500 font-medium">
            {t("pricingFooter")}
          </p>
        </section>

        

        {/* For Helpers */}
        <section className="mb-10 rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-3 text-[24px] font-bold text-gray-900">{t("helperWant")}</h2>
          <ul className="space-y-3 text-[20px] text-gray-700">
            <li>{"💰"} {t("helperEarn")}</li>
            <li>{"📅"} {t("helperFlex2")}</li>
            <li>{"🏦"} {t("helperPay2")}</li>
          </ul>
          <Link href="/auth/register" className="mt-5 flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-5 text-center text-[22px] font-bold text-white" style={{ minHeight: "64px" }}>
            {t("becomeHelper")}
          </Link>
        </section>



        {/* Footer */}
        <footer className="mt-8 border-t border-gray-200 pt-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-[18px]">
            <Link href="/cancellation-policy" className="text-gray-500 hover:text-blue-600">{t("cancelPolicy")}</Link>
            <span className="text-gray-300">|</span>
            <Link href="/terms" className="text-gray-500 hover:text-blue-600">{t("terms")}</Link>
            <span className="text-gray-300">|</span>
            <Link href="/privacy-policy" className="text-gray-500 hover:text-blue-600">{t("privacy")}</Link>
            <span className="text-gray-300">|</span>
            <Link href="/help" className="text-gray-500 hover:text-blue-600">{t("help")}</Link>
          </div>
          <p className="mt-4 text-[16px] text-gray-400">{t("footerBrand")}</p>
          <p className="mt-1 text-[14px] text-gray-400">{isCN ? "© 2026 九鼎银联 · SilverConnect Global（和润）" : "© 2026 SilverConnect Global"}</p>
        
          {/* Powered by PHLedger */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex flex-col items-center gap-2">
              <p className="text-[13px] font-semibold text-emerald-700">
                {locale === "zh" || locale === "zh_tw" ? "由 PHLedger 提供技术支持" : locale === "vi" ? "Được hỗ trợ bởi PHLedger" : locale === "ko" ? "PHLedger 기술 지원" : locale === "ja" ? "PHLedger 技術提供" : locale === "th" ? "ขับเคลื่อนโดย PHLedger" : "Powered by PHLedger"}
              </p>
              <p className="text-[11px] text-gray-500 text-center max-w-xs leading-relaxed">
                {locale === "zh" || locale === "zh_tw"
                  ? "PHLedger 帮助企业设计和交付现代数据平台。专注于 Databricks 湖仓架构、AI 数据基础、财务报告自动化和数据 DevOps。"
                  : locale === "vi"
                  ? "PHLedger giúp tổ chức xây dựng nền tảng dữ liệu hiện đại — Databricks Lakehouse, AI-ready data, tự động hóa báo cáo tài chính."
                  : "PHLedger helps organisations design and deliver modern data platforms — Databricks Lakehouse, AI-ready data foundations, financial reporting automation, and DevOps for data."}
              </p>
              <a href="https://www.linkedin.com/company/phledger/" target="_blank" rel="noopener noreferrer" className="text-[11px] text-emerald-600 hover:text-emerald-800 underline">
                linkedin.com/company/phledger
              </a>

            </div>
          </div>

        </footer>
      </main>
    </>
  );
}
