import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { Upload, MapPin, Check } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";

const STEPS = [1, 2, 3, 4, 5] as const;
const TITLE_KEYS = [
  "registerStep1",
  "registerStep2",
  "registerStep3",
  "registerStep4",
  "registerStep5",
] as const;

async function submitRegistration(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  nextRedirect(`/${locale}/provider/onboarding-status`);
}

function parseStep(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : 1;
}

export default async function ProviderRegisterPage({
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
  const country = await getCountry();
  const t = await getTranslations("provider");
  const tCommon = await getTranslations("common");
  const tCategories = await getTranslations("categories");
  const step = parseStep(sp.step);

  const prevHref = step > 1 ? `?step=${step - 1}` : "/home";
  const nextStep = step + 1;

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
        className="mx-auto w-full max-w-content px-5 pb-12 pt-6"
      >
        <h1 className="text-h2">{t("registerTitle")}</h1>
        <p className="mt-1 text-[14px] text-text-tertiary">
          {t("registerStep", { n: step })} · {t(TITLE_KEYS[step - 1])}
        </p>

        {/* Step indicator */}
        <ol
          aria-label={t("registerStep", { n: step })}
          className="mt-4 flex gap-2"
        >
          {STEPS.map((s) => (
            <li
              key={s}
              aria-current={s === step ? "step" : undefined}
              className={
                "h-1.5 flex-1 rounded-full " +
                (s < step
                  ? "bg-success"
                  : s === step
                  ? "bg-brand"
                  : "bg-border-strong")
              }
            />
          ))}
        </ol>

        <form
          action={step < 5 ? "" : submitRegistration}
          method={step < 5 ? "get" : undefined}
          className="mt-6 flex flex-col gap-4"
        >
          {step < 5 && (
            <input type="hidden" name="step" value={nextStep} />
          )}
          {step === 5 && (
            <input type="hidden" name="locale" value={locale} />
          )}
          {step === 1 && <Step1 t={t} />}
          {step === 2 && <Step2 t={t} country={country} />}
          {step === 3 && <Step3 t={t} tCategories={tCategories} country={country} />}
          {step === 4 && <Step4 t={t} />}
          {step === 5 && <Step5 t={t} />}

          <div className="mt-4 flex items-center gap-3">
            <Link
              href={prevHref}
              className="inline-flex h-12 items-center rounded-md border-[1.5px] border-border-strong bg-bg-base px-5 text-[15px] font-semibold text-text-primary"
            >
              {tCommon("back")}
            </Link>
            <div className="flex-1" />
            <Button type="submit" variant="primary" size="md">
              {step < 5 ? t("registerNext") : t("registerSubmit")}
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}

type T = Awaited<ReturnType<typeof getTranslations<"provider">>>;

function Step1({ t }: { t: T }) {
  return (
    <>
      <div>
        <Label htmlFor="name">{t("rName")}</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>
      <div>
        <Label htmlFor="phone">{t("rPhone")}</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" required />
      </div>
      <div>
        <Label htmlFor="address">{t("rAddress")}</Label>
        <Input id="address" name="address" autoComplete="street-address" required />
      </div>
      <div>
        <Label htmlFor="bio">{t("rBio")}</Label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          aria-describedby="bio-hint"
          className="block w-full rounded-md border-[1.5px] border-border-strong bg-bg-base p-3.5 text-[16px] text-text-primary focus:border-brand focus:outline-none"
        />
        <p id="bio-hint" className="mt-1.5 text-[13px] text-text-tertiary">
          {t("rBioHint")}
        </p>
      </div>
    </>
  );
}

function Step2({ t, country }: { t: T; country: string }) {
  const docs = [
    { key: "police" as const, labelKey: "docPolice" as const, optional: false },
    { key: "firstAid" as const, labelKey: "docFirstAid" as const, optional: false },
    {
      key: "insurance" as const,
      labelKey: "docInsurance" as const,
      optional: country === "CN",
    },
  ];
  return (
    <ul className="flex flex-col gap-3">
      {docs.map((d) => (
        <li
          key={d.key}
          className="flex items-center gap-3 rounded-lg border border-border bg-bg-base p-4"
        >
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand"
          >
            <Upload size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold">{t(d.labelKey)}</p>
            {d.optional && (
              <p className="mt-0.5 text-[12px] text-text-tertiary">
                {t("docOptional")}
              </p>
            )}
          </div>
          <label className="inline-flex h-10 items-center rounded-sm border-[1.5px] border-border-strong bg-bg-base px-3 text-[13px] font-semibold text-text-primary">
            {t("docUpload")}
            <input type="file" accept="image/*,application/pdf" className="sr-only" />
          </label>
        </li>
      ))}
    </ul>
  );
}

function Step3({
  t,
  tCategories,
  country,
}: {
  t: T;
  tCategories: Awaited<ReturnType<typeof getTranslations<"categories">>>;
  country: string;
}) {
  const cats = ["cleaning", "cooking", "garden", "personalCare", "repair"] as const;
  const defaultRadius = country === "CN" ? "10" : "15";
  return (
    <>
      <div className="rounded-lg border border-border bg-bg-base p-4">
        <p className="flex items-center gap-2 text-[15px] font-bold">
          <MapPin size={18} className="text-brand" aria-hidden />
          {t("serviceArea")}
        </p>
        <p className="mt-1 text-[13px] text-text-secondary">{t("serviceAreaHint")}</p>
        <div className="mt-3 flex h-36 items-center justify-center rounded-md bg-bg-surface-2 text-[13px] text-text-tertiary">
          {t("mapPlaceholder")}
        </div>
        <div className="mt-3">
          <Label htmlFor="radius">{t("radius")}</Label>
          <Input
            id="radius"
            name="radius"
            type="number"
            min={1}
            max={50}
            defaultValue={defaultRadius}
            inputMode="numeric"
            required
          />
        </div>
      </div>

      <fieldset>
        <legend className="text-[15px] font-bold">{t("serviceCategories")}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {cats.map((c) => (
            <label
              key={c}
              className="inline-flex cursor-pointer items-center gap-1 rounded-pill border-[1.5px] border-border-strong bg-bg-base px-4 py-2 text-[14px] font-semibold text-text-primary has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand"
            >
              <input type="checkbox" name="categories" value={c} className="sr-only" />
              {tCategories(c)}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}

function Step4({ t }: { t: T }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
  const dayKeys = {
    Mon: "weekMon",
    Tue: "weekTue",
    Wed: "weekWed",
    Thu: "weekThu",
    Fri: "weekFri",
    Sat: "weekSat",
    Sun: "weekSun",
  } as const;
  const slots = [
    { key: "morning" as const, defaultOn: true },
    { key: "afternoon" as const, defaultOn: true },
    { key: "evening" as const, defaultOn: false },
  ];
  return (
    <>
      <p className="text-[14px] text-text-secondary">{t("availabilityHint")}</p>
      <ul className="mt-2 flex flex-col gap-2">
        {days.map((d) => (
          <li
            key={d}
            className="grid grid-cols-[60px_1fr] items-center gap-3 rounded-lg border border-border bg-bg-base p-3"
          >
            <span className="text-[15px] font-bold">{t(dayKeys[d])}</span>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((s) => (
                <label
                  key={s.key}
                  className="inline-flex cursor-pointer items-center justify-center rounded-sm border-[1.5px] border-border-strong bg-bg-base px-2 py-2 text-[13px] font-semibold text-text-primary has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand"
                >
                  <input
                    type="checkbox"
                    name={`avail_${d}`}
                    value={s.key}
                    defaultChecked={s.defaultOn && d !== "Sat" && d !== "Sun"}
                    className="sr-only"
                  />
                  {t(s.key)}
                </label>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function Step5({ t }: { t: T }) {
  return (
    <div className="rounded-lg border border-border bg-bg-base p-5">
      <p className="text-[15px] text-text-secondary">{t("stripeHint")}</p>
      <button
        type="button"
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#635BFF] px-5 text-[15px] font-bold text-white"
      >
        <Check size={18} aria-hidden />
        {t("stripeConnect")}
      </button>
    </div>
  );
}
