import { setRequestLocale, getTranslations } from "next-intl/server";
import { CreditCard, Plus, Trash2, Lock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";
import { EmptyState } from "@/components/domain/PageStates";

interface Card {
  id: string;
  brand: "Visa" | "Mastercard" | "Amex";
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

const SAMPLE: Card[] = [
  { id: "c1", brand: "Visa", last4: "4242", expMonth: 12, expYear: 2028, isDefault: true },
  { id: "c2", brand: "Mastercard", last4: "5555", expMonth: 6, expYear: 2027, isDefault: false },
];

export default async function ProfilePaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session.signedIn) redirect({ href: "/auth/login", locale });
  const country = await getCountry();
  const t = await getTranslations("paymentMethods");
  const tCommon = await getTranslations("common");
  const tPay = await getTranslations("payment");
  const adding = sp.add === "1";
  const empty = sp.state === "empty";
  const items = empty ? [] : SAMPLE;

  return (
    <>
      <Header
        country={country}
        back
        signedIn={session.signedIn}
        initials={session.initials}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12"
      >
        <h1 className="text-h2">{t("title")}</h1>

        <div className="mt-3 flex items-center gap-2 rounded-md bg-bg-surface-2 px-3.5 py-3 text-[14px] text-text-secondary">
          <Lock size={16} aria-hidden />
          <p>{t("secureNote")}</p>
        </div>

        {items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              illustration={CreditCard as never}
              title={t("empty")}
              hint={t("emptyHint")}
              cta={
                <a
                  href="?add=1"
                  className="inline-flex h-14 items-center justify-center rounded-md bg-brand px-7 text-[17px] font-bold text-white"
                >
                  {t("addCard")}
                </a>
              }
            />
          </div>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {items.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-bg-base p-4"
              >
                <span
                  aria-hidden
                  className="flex h-10 w-14 shrink-0 items-center justify-center rounded-sm bg-text-primary text-[12px] font-bold text-bg-base"
                >
                  {c.brand === "Visa" ? "VISA" : c.brand === "Mastercard" ? "MC" : "AMEX"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[16px] font-bold tabular-nums">
                      {t("endingIn", { last4: c.last4 })}
                    </p>
                    {c.isDefault && (
                      <span className="inline-flex h-6 items-center rounded-sm bg-success-soft px-2 text-[12px] font-semibold text-success">
                        {t("default")}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13px] text-text-secondary tabular-nums">
                    {t("expires", {
                      month: String(c.expMonth).padStart(2, "0"),
                      year: c.expYear,
                    })}
                  </p>
                </div>
                {!c.isDefault && (
                  <button
                    type="button"
                    className="inline-flex h-10 items-center rounded-sm border-[1.5px] border-border-strong bg-bg-base px-3 text-[14px] font-semibold text-text-primary"
                  >
                    {t("setDefault")}
                  </button>
                )}
                <button
                  type="button"
                  aria-label={t("delete")}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border-[1.5px] border-danger bg-bg-base text-danger"
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}

        {!adding && items.length > 0 && (
          <a
            href="?add=1"
            className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border-strong text-[16px] font-semibold text-brand"
          >
            <Plus size={20} aria-hidden /> {t("addCard")}
          </a>
        )}

        {adding && (
          <form
            action="/api/profile/payment"
            method="post"
            className="mt-5 flex flex-col gap-4 rounded-lg border-2 border-brand bg-bg-base p-5"
          >
            <h2 className="flex items-center gap-2 text-h3">
              <CreditCard size={22} className="text-brand" aria-hidden />
              {t("addCard")}
            </h2>
            <div>
              <Label htmlFor="cardNumber">{tPay("cardNumber")}</Label>
              <Input
                id="cardNumber"
                name="cardNumber"
                autoComplete="cc-number"
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="exp">{tPay("expLabel")}</Label>
                <Input
                  id="exp"
                  name="exp"
                  autoComplete="cc-exp"
                  inputMode="numeric"
                  placeholder="MM / YY"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cvv">{tPay("cvvLabel")}</Label>
                <Input id="cvv" name="cvv" autoComplete="cc-csc" inputMode="numeric" required />
              </div>
            </div>
            <div>
              <Label htmlFor="name">{tPay("cardName")}</Label>
              <Input id="name" name="name" autoComplete="cc-name" required />
            </div>
            <Button type="submit" variant="primary" block size="md">
              {tCommon("save")}
            </Button>
          </form>
        )}
      </main>
    </>
  );
}
