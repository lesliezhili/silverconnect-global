import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { getCountry } from "@/components/domain/countryCookie";
import PostcodeSearch from "@/components/domain/PostcodeSearch";

/**
 * /[locale]/nearby — Find nearby providers by postcode/ZIP
 *
 * Features:
 * - Country-adaptive postcode input (Postcode/ZIP/邮编/郵遞區號/Poskod)
 * - Walking distance priority (cheapest)
 * - Tool provision toggle (customer provides = -12%)
 * - Dynamic pricing breakdown
 * - Match scoring (proximity 35% + rating 25% + availability 20% + language 10% + certs 10%)
 */

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}

export default async function NearbyPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { category } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("proximity");
  const country = await getCountry();
  const isZh = locale === "zh" || locale === "zh_tw";

  const serviceCategory = category || "cleaning";

  return (
    <>
      <Header country={country as any} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-base text-gray-600 mt-1">{t("subtitle")}</p>
        </div>

        {/* How it works — elder-friendly explainer */}
        <div className="mb-6 bg-teal-50 rounded-xl border border-teal-200 p-5">
          <h2 className="text-lg font-semibold text-teal-950 mb-3">
            {isZh ? "💡 省钱小贴士" : "💡 Save Money Tips"}
          </h2>
          <ul className="space-y-2 text-base text-teal-900">
            <li className="flex items-start gap-2">
              <span className="text-xl">🚶</span>
              <span>{isZh ? "步行距离的服务者：节省15%（无出行费）" : "Walking distance provider: Save 15% (no travel cost)"}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xl">🧰</span>
              <span>{isZh ? "自备工具（如吸尘器、拖把）：节省12%" : "Provide your own tools (vacuum, mop): Save 12%"}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xl">📅</span>
              <span>{isZh ? "工作日非高峰时段：节省8%" : "Weekday off-peak hours: Save 8%"}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xl">💜</span>
              <span>{isZh ? "重复预约同一服务者：节省5%" : "Rebook same provider: Save 5%"}</span>
            </li>
          </ul>
          <p className="mt-3 text-sm text-teal-700 font-medium">
            {isZh ? "💚 最多可节省40%！（步行+自备工具+非高峰+老客户）" : "💚 Stack up to 40% savings! (walk + tools + off-peak + loyalty)"}
          </p>
        </div>

        {/* PostcodeSearch Component */}
        <PostcodeSearch
          locale={locale}
          country={country as any}
          serviceCategory={serviceCategory}
        />

        {/* Price factors explanation */}
        <div className="mt-8 bg-gray-50 rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {isZh ? "📊 价格计算方式" : "📊 How Price is Calculated"}
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">📍</div>
              <div>
                <p className="font-semibold">{isZh ? "距离因素 (±15-20%)" : "Distance Factor (±15-20%)"}</p>
                <p className="text-gray-500">{isZh ? "步行<2km=-15%，骑行2-5km=-8%，驾车5-15km=标准，远15-30km=+10%，偏远30km+=+20%" : "<2km walk=-15%, 2-5km cycle=-8%, 5-15km drive=base, 15-30km=+10%, 30km+=+20%"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">🧰</div>
              <div>
                <p className="font-semibold">{isZh ? "工具因素 (-12% to +5%)" : "Tools Factor (-12% to +5%)"}</p>
                <p className="text-gray-500">{isZh ? "自备工具=-12%，服务者带=标准，平台配送=+5%" : "Your tools=-12%, Provider brings=base, Platform delivers=+5%"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">⏰</div>
              <div>
                <p className="font-semibold">{isZh ? "时间因素 (±8-15%)" : "Time Factor (±8-15%)"}</p>
                <p className="text-gray-500">{isZh ? "非高峰=-8%，高峰=+10%，周末=+15%" : "Off-peak=-8%, Peak=+10%, Weekend=+15%"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">💜</div>
              <div>
                <p className="font-semibold">{isZh ? "忠诚度 (-5%)" : "Loyalty (-5%)"}</p>
                <p className="text-gray-500">{isZh ? "重复预约同一服务者自动享5%优惠" : "Repeat bookings with same provider get auto 5% off"}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
