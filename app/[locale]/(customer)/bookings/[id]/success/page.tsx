import { setRequestLocale, getTranslations } from "next-intl/server";
import { Calendar, MapPin, CreditCard } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { S5PaymentSuccess } from "@/components/illustrations";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { CURRENCY_SYMBOL } from "@/components/domain/country";
import type { CountryCode } from "@/components/layout";

export default async function PaymentSuccessPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("success");
  const country = "AU" as CountryCode;
  const isZh = locale === "zh";
  const sym = CURRENCY_SYMBOL[country];
  const total = country === "CN" ? "¥1,560.00" : `${sym}195.00`;
  const providerName = isZh ? "李 师傅" : "Helen Li";

  return (
    <>
      <Header country={country} />
      <main className="mx-auto flex w-full max-w-content flex-col items-center bg-bg-surface px-5 pb-[120px] pt-2 text-center">
        <div className="mt-2.5">
          <S5PaymentSuccess width={240} height={170} />
        </div>
        <h1 className="mt-2 text-[28px] font-extrabold">{t("title")}</h1>
        <p className="mt-1.5 text-[16px] text-text-secondary">
          {t("providerAccepted", { name: providerName })}
        </p>

        <section className="mt-5 w-full rounded-lg border border-border bg-bg-base p-4 text-left">
          <div className="flex items-center gap-2.5">
            <ProviderAvatar size={48} hue={0} initials={isZh ? "李" : "HL"} />
            <div>
              <p className="text-[16px] font-bold">{providerName}</p>
              <p className="text-[13px] text-text-tertiary">
                {isZh ? "深度清洁 3 小时" : "Deep clean · 3h"}
              </p>
            </div>
          </div>
          <ul className="mt-3.5 flex flex-col gap-2">
            <li className="flex items-center gap-2.5">
              <Calendar size={18} className="shrink-0 text-text-tertiary" aria-hidden />
              <span className="text-[15px]">
                {isZh ? "5 月 8 日 周三 · 14:00" : "Wed 8 May · 2:00pm"}
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin size={18} className="shrink-0 text-text-tertiary" aria-hidden />
              <span className="text-[15px]">12 Park Ave, Sydney NSW 2000</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CreditCard size={18} className="shrink-0 text-text-tertiary" aria-hidden />
              <span className="text-[15px]">
                {isZh ? `已支付 ${total}` : `Paid ${total}`}
              </span>
            </li>
          </ul>
        </section>

        <div className="mt-3.5 flex w-full flex-col gap-2.5">
          <button
            type="button"
            className="flex h-14 items-center justify-center gap-2 rounded-md bg-brand text-[17px] font-bold text-white hover:bg-brand-hover"
          >
            <Calendar size={20} aria-hidden />
            {t("addCalendar")}
          </button>
          <button
            type="button"
            className="h-14 rounded-md border-[1.5px] border-border-strong bg-bg-base text-[16px] font-semibold text-text-primary"
          >
            {t("downloadIcs")}
          </button>
          <Link
            href={`/bookings/${id}`}
            className="inline-flex h-12 items-center justify-center text-[15px] font-semibold text-brand"
          >
            {t("viewBooking")} →
          </Link>
        </div>
      </main>
    </>
  );
}
