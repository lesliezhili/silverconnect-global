import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { BookingProgress } from "@/components/domain/BookingProgress";
import { CURRENCY_SYMBOL, TAX_ABBR } from "@/components/domain/country";
import { getCountry } from "@/components/domain/countryCookie";
import { S3EmptyBookings, S7NetworkError } from "@/components/illustrations";
import { Skeleton } from "@/components/ui/Skeleton";

type Step = 1 | 2 | 3 | 4;

function clampStep(raw: string | undefined): Step {
  const n = Number.parseInt(raw ?? "1", 10);
  return (Math.min(Math.max(Number.isNaN(n) ? 1 : n, 1), 4) as Step) || 1;
}

export default async function BookingNewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("booking");
  const tCommon = await getTranslations("common");
  const country = await getCountry();
  const isZh = locale === "zh";
  const sym = CURRENCY_SYMBOL[country];
  const taxAbbr = TAX_ABBR[country];

  const step = clampStep(typeof sp.step === "string" ? sp.step : undefined);
  const nextStep = (step + 1) as Step;
  const state = typeof sp.state === "string" ? sp.state : undefined;
  const finalCta =
    step === 4
      ? isZh
        ? `确认并支付 ${sym}195.00`
        : `Confirm & pay ${sym}195.00`
      : tCommon("next");

  return (
    <>
      <Header country={country} back />
      <BookingProgress step={step} />
      <main id="main-content" className="mx-auto w-full max-w-content overflow-auto bg-bg-surface px-5 pb-[120px] sm:pb-12 pt-5">
        {step === 1 && (
          <>
            <h1 className="text-[22px] font-bold">{t("step1Title")}</h1>
            <ul className="mt-4 flex flex-col gap-3">
              {(isZh
                ? [
                    { n: "2 小时基础清洁", d: "客厅 + 厨房 + 1 卫", p: 110 },
                    { n: "3 小时深度清洁", d: "全屋 + 玻璃 + 油烟机", p: 195 },
                    { n: "4 小时全屋整理", d: "全屋整理 + 收纳", p: 280 },
                  ]
                : [
                    { n: "2h Basic clean", d: "Living + kitchen + 1 bath", p: 110 },
                    { n: "3h Deep clean", d: "Whole home + windows + range", p: 195 },
                    { n: "4h Seasonal", d: "Whole home + organising", p: 280 },
                  ]
              ).map((s, i) => (
                <li key={s.n}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-md border-[1.5px] bg-bg-base p-4 ${
                      i === 1 ? "border-2 border-brand" : "border-border"
                    }`}
                  >
                    <input type="radio" name="svc" defaultChecked={i === 1} className="sr-only" />
                    <span
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        i === 1 ? "border-brand" : "border-border-strong"
                      }`}
                      aria-hidden
                    >
                      {i === 1 && <span className="h-3 w-3 rounded-full bg-brand" />}
                    </span>
                    <span className="flex-1">
                      <span className="block text-[17px] font-bold">{s.n}</span>
                      <span className="mt-0.5 block text-[14px] text-text-secondary">{s.d}</span>
                    </span>
                    <span className="text-[18px] font-bold text-brand">
                      {sym}
                      {s.p}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}

        {step === 2 && state === "loading" && (
          <>
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="mt-5 h-12 w-full rounded-md" />
            <Skeleton className="mt-5 h-5 w-1/3" />
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {Array.from({ length: 28 }).map((_, i) => (
                <Skeleton key={i} className="h-9 rounded-sm" />
              ))}
            </div>
          </>
        )}
        {step === 2 && state === "noSlot" && (
          <div className="flex flex-col items-center gap-3 pt-10 text-center">
            <S3EmptyBookings width={200} height={140} />
            <h2 className="m-0 text-[21px] font-bold">{t("fullyBookedDay")}</h2>
            <p className="m-0 text-[15px] text-text-secondary">{t("tryAnother")}</p>
            <button
              type="button"
              className="mt-2 h-14 rounded-md bg-brand px-6 text-[17px] font-bold text-white"
            >
              {t("seeOtherTimes")}
            </button>
          </div>
        )}
        {step === 2 && state === "recurring" && (
          <>
            <h1 className="text-[22px] font-bold">{t("recurringTitle")}</h1>
            <ul className="mt-4 flex flex-col gap-2.5">
              {[
                t("recurringWeekly"),
                t("recurringBiweekly"),
                t("recurringMonthly"),
              ].map((l, i) => (
                <li key={l}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-md border-[1.5px] bg-bg-base p-4 ${
                      i === 0 ? "border-2 border-brand" : "border-border"
                    }`}
                  >
                    <input type="radio" name="rec" defaultChecked={i === 0} className="sr-only" />
                    <span
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        i === 0 ? "border-brand" : "border-border-strong"
                      }`}
                      aria-hidden
                    >
                      {i === 0 && <span className="h-3 w-3 rounded-full bg-brand" />}
                    </span>
                    <span className="text-[17px] font-semibold">{l}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-md bg-brand-soft px-3.5 py-3 text-[14px] text-brand">
              {t("recurringDiscount")}
            </p>
          </>
        )}
        {step === 2 && state === "error" && (
          <div className="flex flex-col items-center gap-3 pt-10 text-center">
            <S7NetworkError width={200} height={140} />
            <h2 className="m-0 text-[21px] font-bold">{t("errorTimes")}</h2>
            <Link
              href="/bookings/new?step=2"
              className="inline-flex h-14 items-center rounded-md bg-brand px-6 text-[17px] font-bold text-white"
            >
              {tCommon("retry")}
            </Link>
          </div>
        )}
        {step === 2 && !state && (
          <>
            <h1 className="text-[22px] font-bold">{t("step2Title")}</h1>
            <p className="mt-2 text-[14px] text-text-secondary">
              {isZh ? "本周可预订时段（示例）" : "Available this week (sample)"}
            </p>
            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {(isZh
                ? ["今", "周二", "周三", "周四", "周五", "周六", "周日"]
                : ["Today", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
              ).map((d, di) => (
                <div key={d} className="flex flex-col items-center gap-1.5">
                  <span className="text-[12px] font-bold uppercase text-text-secondary">{d}</span>
                  {["09:00", "11:00", "14:00", "16:00"].map((s, si) => {
                    const avail = (di + si) % 3 !== 0;
                    const sel = di === 1 && si === 2;
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={!avail}
                        className={`h-10 w-full rounded-sm text-[12px] font-semibold ${
                          sel
                            ? "bg-brand text-white"
                            : avail
                            ? "border border-border bg-bg-base text-text-primary"
                            : "bg-bg-surface-2 text-text-tertiary opacity-50"
                        }`}
                      >
                        {avail ? s : "—"}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-[22px] font-bold">{t("step3Title")}</h1>
            <ul className="mt-4 flex flex-col gap-3">
              {(isZh
                ? [
                    { l: "家", a: "12 Park Ave, Sydney NSW 2000", d: true },
                    { l: "母亲家", a: "8 Mill St, Sydney NSW 2000", d: false },
                  ]
                : [
                    { l: "Home", a: "12 Park Ave, Sydney NSW 2000", d: true },
                    { l: "Mum's", a: "8 Mill St, Sydney NSW 2000", d: false },
                  ]
              ).map((addr) => (
                <li key={addr.a}>
                  <label
                    className={`flex h-20 cursor-pointer items-center gap-3 rounded-md border-[1.5px] bg-bg-base p-4 ${
                      addr.d ? "border-2 border-brand" : "border-border"
                    }`}
                  >
                    <input type="radio" name="addr" defaultChecked={addr.d} className="sr-only" />
                    <span className="flex-1">
                      <span className="block text-[16px] font-bold">{addr.l}</span>
                      <span className="block text-[14px] text-text-secondary">{addr.a}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-md border-[1.5px] border-dashed border-border-strong text-[15px] font-semibold text-brand"
            >
              {isZh ? "+ 新增地址" : "+ Add address"}
            </button>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-[22px] font-bold">{t("step4Title")}</h1>
            <section className="mt-4 rounded-lg border border-border bg-bg-base p-4">
              <div className="flex justify-between text-[14px] text-text-secondary">
                <span>{isZh ? "服务费" : "Service"}</span>
                <span>{sym}177.27</span>
              </div>
              <div className="mt-1.5 flex justify-between text-[14px] text-text-secondary">
                <span>
                  {taxAbbr} {country === "AU" ? "10%" : country === "CN" ? "6%" : "13%"}
                </span>
                <span>{sym}17.73</span>
              </div>
              <div className="mt-2.5 flex justify-between border-t border-border pt-2.5 text-[18px] font-extrabold">
                <span>{isZh ? "合计" : "Total"}</span>
                <span className="text-brand">
                  {sym}195.00
                </span>
              </div>
            </section>
            <p className="mt-3 rounded-md bg-brand-soft px-3.5 py-3 text-[14px] text-brand">
              {isZh
                ? "ℹ️ 距开始 > 24 小时取消可全额退款"
                : "ℹ️ Free cancel until 24h before start"}
            </p>
          </>
        )}
      </main>

      <div className="sticky bottom-[84px] z-10 flex gap-2 border-t border-border bg-bg-base p-3 sm:bottom-0">
        {step > 1 && (
          <Link
            href={`/bookings/new?step=${step - 1}`}
            className="inline-flex h-14 flex-1 items-center justify-center rounded-md border-2 border-brand bg-bg-base text-[16px] font-semibold text-brand"
          >
            {tCommon("back")}
          </Link>
        )}
        {step < 4 ? (
          <Link
            href={`/bookings/new?step=${nextStep}`}
            className="inline-flex h-14 flex-1 items-center justify-center rounded-md bg-brand text-[17px] font-bold text-white hover:bg-brand-hover"
          >
            {finalCta}
          </Link>
        ) : (
          <Link
            href="/pay/new"
            className="inline-flex h-14 flex-1 items-center justify-center rounded-md bg-brand text-[17px] font-bold text-white hover:bg-brand-hover"
          >
            {finalCta}
          </Link>
        )}
      </div>
    </>
  );
}
