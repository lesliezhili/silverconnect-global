import { setRequestLocale, getTranslations } from "next-intl/server";
import { Lock, CreditCard, AlertTriangle, Check } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { CURRENCY_SYMBOL, TAX_ABBR } from "@/components/domain/country";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";
import { cn } from "@/components/ui/cn";

type PayState = "default" | "loading" | "threeDS" | "failed" | "success";

const VALID: PayState[] = ["default", "loading", "threeDS", "failed", "success"];

function parseState(raw: string | undefined): PayState {
  if (raw && (VALID as string[]).includes(raw)) return raw as PayState;
  return "default";
}

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; bookingId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, bookingId } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("payment");
  const country = await getCountry();
  const session = await getSession();
  const sym = CURRENCY_SYMBOL[country];
  const taxAbbr = TAX_ABBR[country];
  const taxPct = country === "AU" ? "10%" : country === "CN" ? "6%" : "13%";
  const total = country === "CN" ? "¥1,560.00" : `${sym}195.00`;
  const state = parseState(typeof sp.state === "string" ? sp.state : undefined);

  if (state === "success") {
    return (
      <>
        <Header country={country} back signedIn={session.signedIn} initials={session.initials} />
        <main id="main-content" className="mx-auto flex w-full max-w-content flex-col items-center justify-center bg-bg-surface px-6 py-16 text-center">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-success-soft text-success">
            <Check size={56} strokeWidth={3} aria-hidden />
          </span>
          <h2 className="mt-4 text-[26px] font-extrabold">{t("successTitle")}</h2>
          <p className="mt-1.5 text-[16px] text-text-secondary">
            {t("successAmount", { amount: total })}
          </p>
          <p className="mt-1 text-[14px] text-text-tertiary">{t("redirecting")}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header country={country} back signedIn={session.signedIn} initials={session.initials} />
      <main id="main-content" className="mx-auto w-full max-w-content overflow-auto bg-bg-surface px-5 pb-[120px] sm:pb-12 pt-5">
        <h1 className="text-[26px] font-extrabold">{t("title")}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-[14px] text-text-tertiary">
          <Lock size={14} aria-hidden /> {t("secured")}
        </p>

        <div className="mt-4 flex flex-col gap-2.5">
          <button
            type="button"
            className="flex h-14 items-center justify-center gap-1.5 rounded-md border-[1.5px] border-border bg-black text-[17px] font-bold text-white"
          >
            {t("applePay")}
          </button>
          <button
            type="button"
            className="flex h-14 items-center justify-center gap-1.5 rounded-md border-[1.5px] border-border bg-bg-base text-[16px] font-bold text-text-primary"
          >
            G Pay · {t("googlePay")}
          </button>
          <div className="my-2 flex items-center gap-3">
            <span className="h-[1px] flex-1 bg-border" aria-hidden />
            <span className="text-[13px] text-text-tertiary">{t("orCard")}</span>
            <span className="h-[1px] flex-1 bg-border" aria-hidden />
          </div>

          <fieldset className="rounded-md border-2 border-brand bg-bg-base p-3.5">
            <legend className="mb-2.5 flex items-center gap-2.5 text-[16px] font-bold">
              <CreditCard size={22} className="text-brand" aria-hidden />
              <span>{t("card")}</span>
            </legend>
            <input
              aria-label={t("cardNumber")}
              autoComplete="cc-number"
              inputMode="numeric"
              placeholder={t("cardNumber")}
              defaultValue="4242 4242 4242 4242"
              className="block h-12 w-full rounded-sm border-[1.5px] border-border-strong bg-bg-base px-3.5 font-mono text-[16px] text-text-primary"
            />
            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              <input
                aria-label={t("expLabel")}
                autoComplete="cc-exp"
                inputMode="numeric"
                placeholder={t("expLabel")}
                defaultValue="12 / 28"
                className="block h-12 w-full rounded-sm border-[1.5px] border-border-strong bg-bg-base px-3.5 font-mono text-[16px] text-text-primary"
              />
              <input
                aria-label={t("cvvLabel")}
                autoComplete="cc-csc"
                inputMode="numeric"
                placeholder={t("cvvLabel")}
                defaultValue="123"
                className="block h-12 w-full rounded-sm border-[1.5px] border-border-strong bg-bg-base px-3.5 font-mono text-[16px] text-text-primary"
              />
            </div>
            <input
              aria-label={t("cardName")}
              autoComplete="cc-name"
              placeholder={t("cardName")}
              defaultValue="MARGARET WANG"
              className="mt-2.5 block h-12 w-full rounded-sm border-[1.5px] border-border-strong bg-bg-base px-3.5 text-[16px] text-text-primary"
            />
          </fieldset>
        </div>

        {state === "failed" && (
          <div
            role="alert"
            className="mt-3.5 flex items-start gap-2.5 rounded-md border-[1.5px] border-danger bg-danger-soft p-3.5"
          >
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-danger" aria-hidden />
            <div>
              <p className="text-[16px] font-bold text-danger">{t("declined")}</p>
              <p className="mt-0.5 text-[14px] text-danger">{t("declinedHint")}</p>
            </div>
          </div>
        )}

        {state === "threeDS" && (
          <div
            role="status"
            className="mt-3.5 rounded-md border-[1.5px] border-brand bg-brand-soft p-4 text-center"
          >
            <p className="text-[16px] font-bold text-brand">{t("threeDS")}</p>
            <p className="mt-1.5 text-[14px] text-brand">{t("threeDSHint")}</p>
          </div>
        )}

        <section className="mt-4 rounded-md border border-border bg-bg-base p-3.5">
          <div className="flex justify-between text-[14px] text-text-secondary">
            <span>{t("subtotal")}</span>
            <span>{country === "CN" ? "¥1,471.70" : `${sym}177.27`}</span>
          </div>
          <div className="mt-1.5 flex justify-between text-[14px] text-text-secondary">
            <span>
              {taxAbbr} {taxPct}
            </span>
            <span>{country === "CN" ? "¥88.30" : `${sym}17.73`}</span>
          </div>
          <div className="mt-2.5 flex justify-between border-t border-border pt-2.5 text-[18px] font-extrabold">
            <span>{t("total")}</span>
            <span className="text-brand">{total}</span>
          </div>
        </section>
      </main>

      <div className="sticky bottom-[84px] z-10 border-t border-border bg-bg-base p-3 sm:bottom-0">
        {state === "loading" || state === "threeDS" ? (
          <button
            type="button"
            disabled
            className={cn(
              "flex h-14 w-full items-center justify-center gap-2 rounded-md text-[17px] font-bold",
              "bg-bg-surface-2 text-text-tertiary"
            )}
          >
            <span
              aria-hidden
              className="inline-block h-[18px] w-[18px] animate-spin rounded-full border-[2.5px] border-current border-t-transparent"
            />
            {state === "threeDS" ? t("waitingBank") : t("processing")}
          </button>
        ) : (
          <Link
            href={`/bookings/${bookingId}/success`}
            className="flex h-14 items-center justify-center gap-2 rounded-md bg-brand text-[17px] font-bold text-white hover:bg-brand-hover"
          >
            <Lock size={18} aria-hidden />
            {t("payNow", { amount: total })}
          </Link>
        )}
      </div>
    </>
  );
}
