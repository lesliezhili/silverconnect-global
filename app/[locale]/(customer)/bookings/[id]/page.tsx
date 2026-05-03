import { setRequestLocale, getTranslations } from "next-intl/server";
import { Calendar, MapPin, CreditCard, Clock, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import {
  BookingStatusBadge,
  type BookingStatus,
} from "@/components/domain/BookingStatusBadge";
import { BookingTimeline } from "@/components/domain/BookingTimeline";
import { CURRENCY_SYMBOL } from "@/components/domain/country";
import { cn } from "@/components/ui/cn";
import type { CountryCode } from "@/components/layout";

const VALID_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "inProgress",
  "awaitingConfirm",
  "completed",
  "cancelledFull",
  "cancelledPartial",
  "refunded",
];

function parseStatus(raw: string | undefined): BookingStatus {
  if (raw && (VALID_STATUSES as string[]).includes(raw)) {
    return raw as BookingStatus;
  }
  return "confirmed";
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, id } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("booking");
  const tStatus = await getTranslations("booking.status");
  const tCta = await getTranslations("booking.cta");
  const country = "AU" as CountryCode;
  const isZh = locale === "zh";
  const sym = CURRENCY_SYMBOL[country];
  const total = country === "CN" ? "¥1,560.00" : `${sym}195.00`;
  const status = parseStatus(typeof sp.status === "string" ? sp.status : undefined);

  const cancelBar =
    status === "confirmed" ? (
      <p className="flex items-center gap-2 rounded-md bg-brand-soft px-3.5 py-3 text-[14px] text-brand">
        <Clock size={16} aria-hidden /> {t("cancelFreeUntil", { hours: 47 })}
      </p>
    ) : status === "inProgress" || status === "awaitingConfirm" ? (
      <p className="rounded-md bg-warning-soft px-3.5 py-3 text-[14px] text-[#92590A]">
        {t("cantCancelInProgress")}
      </p>
    ) : null;

  return (
    <>
      <Header country={country} back />
      <main className="mx-auto w-full max-w-content overflow-auto bg-bg-surface px-5 pb-[120px] pt-4">
        <div className="mb-4 flex items-center gap-2">
          <BookingStatusBadge status={status}>{tStatus(status)}</BookingStatusBadge>
          <span className="text-[13px] text-text-tertiary">#{id}</span>
        </div>

        {cancelBar}

        <section className="mt-4 rounded-lg border border-border bg-bg-base p-4">
          <div className="flex items-center gap-3">
            <ProviderAvatar size={56} hue={0} initials={isZh ? "李" : "HL"} />
            <div className="flex-1">
              <p className="text-[17px] font-bold">{isZh ? "李 师傅 (Helen Li)" : "Helen Li"}</p>
              <p className="text-[13px] text-text-tertiary">
                {isZh ? "深度清洁 · 3 小时" : "Deep clean · 3h"}
              </p>
            </div>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
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
              <span className="text-[15px]">{total}</span>
            </li>
          </ul>
        </section>

        <h2 className="mb-2.5 mt-5 text-[16px] font-bold">{t("statusTimeline")}</h2>
        <BookingTimeline status={status} />
      </main>

      <div className="sticky bottom-[84px] z-10 flex gap-2 border-t border-border bg-bg-base p-3 sm:bottom-0">
        {(status === "confirmed" || status === "pending") && (
          <button
            type="button"
            aria-label={t("cta.cancelledFull")}
            className="inline-flex h-14 w-14 items-center justify-center rounded-md border-[1.5px] border-danger bg-bg-base text-danger"
          >
            <X size={22} aria-hidden />
          </button>
        )}
        <button
          type="button"
          className={cn(
            "flex h-14 flex-1 items-center justify-center rounded-md text-[17px] font-bold text-white",
            status === "awaitingConfirm" ? "bg-success" : "bg-brand hover:bg-brand-hover"
          )}
        >
          {tCta(status)}
        </button>
      </div>
    </>
  );
}
