import { setRequestLocale } from "next-intl/server";
import { landingT } from "@/lib/i18n/landing";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/Header";
import { getCountry } from "@/components/domain/countryCookie";

export const dynamic = "force-dynamic";

export default async function ChristianMembershipPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const country = await getCountry();
  const t = (k: string) => landingT(locale, k);
  const zh = locale === "zh" || locale === "zh_tw";
  const registerHint = zh
    ? "注册时选择基督徒会员选项，即可加入信仰社群"
    : "Select the Christian member option when registering to join the faith community";

  return (
    <>
      <Header country={country} signedIn={false} />
      <main className="mx-auto w-full max-w-content px-5 pb-32 pt-8">

        {/* Hero */}
        <section className="mb-10 text-center">
          <span className="text-6xl block mb-4">✝️</span>
          <h1 className="text-[32px] font-bold leading-tight text-gray-900 sm:text-[40px]">
            {t("christianTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[20px] text-gray-600 leading-relaxed">
            {t("christianSub")}
          </p>
        </section>

        {/* Ministry Services */}
        <section className="mb-10 rounded-2xl border-2 border-amber-200 bg-amber-50 p-6">
          <h2 className="mb-4 text-[22px] font-bold text-amber-900">
            {zh ? "事工服务" : "Ministry Services"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { emoji: "📖", title: zh ? "查经学习" : t("faithBible"), desc: zh ? "每周线上/线下小组查经，一起深入经文" : "Weekly online/offline Bible study groups" },
              { emoji: "🙏", title: zh ? "祷告小组" : t("faithPrayer"), desc: zh ? "代祷支持、祷告分享，彼此守望" : "Prayer support, intercession, and fellowship" },
              { emoji: "🎵", title: zh ? "赞美敬拜" : t("faithWorship"), desc: zh ? "诗歌敬拜，在音乐中感受平安与喜乐" : "Praise & worship sessions — peace through music" },
              { emoji: "🏠", title: zh ? "牧师探访" : t("faithPastoral"), desc: zh ? "教会志愿者上门探访，陪伴与关怀" : "Home visits from trained church volunteers" },
            ].map((item) => (
              <div key={item.emoji} className="rounded-xl border border-amber-200 bg-white p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{item.emoji}</span>
                  <h3 className="text-[18px] font-bold text-gray-900">{item.title}</h3>
                </div>
                <p className="text-[15px] text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Free Declaration */}
        <section className="mb-10 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 p-6 text-center">
          <p className="text-[22px] font-bold text-amber-800 mb-2">
            ✨ {zh ? "完全免费 — 事工服务无需付费" : t("faithFree")}
          </p>
          <p className="text-[16px] text-amber-700">
            {zh ? "所有信仰事工由教会志愿者义务提供，不收取任何费用。" : "All ministry services are provided by church volunteers at no charge."}
          </p>
        </section>

        {/* Register CTA */}
        <section className="mb-10">
          <Link
            href="/auth/register"
            className="flex w-full items-center justify-center rounded-xl bg-amber-600 px-6 py-5 text-center text-[22px] font-bold text-white shadow-lg"
            style={{ minHeight: "64px" }}
          >
            {t("christianCTA")}
          </Link>
          <p className="mt-3 text-center text-[15px] text-gray-500">
            {registerHint}
          </p>
        </section>

        {/* Back link */}
        <div className="text-center">
          <Link href="/" className="text-[16px] text-blue-600 hover:underline">
            ← {zh ? "返回首页" : "Back to home"}
          </Link>
        </div>

      </main>
    </>
  );
}
