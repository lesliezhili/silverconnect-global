import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const SLOTS = ["morning", "afternoon", "evening"] as const;

const DAY_KEYS: Record<(typeof DAYS)[number], "weekMon" | "weekTue" | "weekWed" | "weekThu" | "weekFri" | "weekSat" | "weekSun"> = {
  Mon: "weekMon",
  Tue: "weekTue",
  Wed: "weekWed",
  Thu: "weekThu",
  Fri: "weekFri",
  Sat: "weekSat",
  Sun: "weekSun",
};

async function saveAvailability(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  nextRedirect(`/${locale}/provider/availability?saved=1`);
}

async function applyTemplate(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const tpl = String(formData.get("tpl") ?? "");
  nextRedirect(`/${locale}/provider/availability?tpl=${tpl}`);
}

interface DefaultsArg {
  tpl?: string;
}

function defaultChecked(day: (typeof DAYS)[number], slot: (typeof SLOTS)[number], { tpl }: DefaultsArg): boolean {
  if (tpl === "mwf") {
    return (day === "Mon" || day === "Wed" || day === "Fri") && slot === "morning";
  }
  if (tpl === "weekday") {
    return day !== "Sat" && day !== "Sun" && slot === "afternoon";
  }
  // Default: every weekday morning + afternoon
  return day !== "Sat" && day !== "Sun" && (slot === "morning" || slot === "afternoon");
}

export default async function ProviderAvailabilityPage({
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
  const t = await getTranslations("provider");
  const tCommon = await getTranslations("common");
  const saved = sp.saved === "1";
  const tpl = typeof sp.tpl === "string" ? sp.tpl : undefined;

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
        <h1 className="text-h2">{t("availabilityTitle")}</h1>
        <p className="mt-1 text-[15px] text-text-secondary">{t("availabilityHint")}</p>

        {saved && (
          <div
            role="status"
            className="mt-4 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-3 text-[15px] font-semibold text-success"
          >
            <CheckCircle2 size={18} aria-hidden /> {tCommon("save")}
          </div>
        )}

        {/* Templates */}
        <section className="mt-5 rounded-lg border border-border bg-bg-base p-4">
          <p className="text-[14px] font-bold">{t("availabilityApply")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <TemplateForm
              locale={locale}
              tpl="mwf"
              label={t("availabilityTemplateMWF")}
            />
            <TemplateForm
              locale={locale}
              tpl="weekday"
              label={t("availabilityTemplateWeekday")}
            />
          </div>
        </section>

        {/* Grid */}
        <form action={saveAvailability} className="mt-5 flex flex-col gap-3">
          <input type="hidden" name="locale" value={locale} />
          {DAYS.map((d) => (
            <div
              key={d}
              className="grid grid-cols-[60px_1fr] items-center gap-3 rounded-lg border border-border bg-bg-base p-3"
            >
              <span className="text-[15px] font-bold">{t(DAY_KEYS[d])}</span>
              <div className="grid grid-cols-3 gap-2">
                {SLOTS.map((s) => (
                  <label
                    key={s}
                    className="inline-flex h-12 cursor-pointer items-center justify-center rounded-sm border-[1.5px] border-border-strong bg-bg-base px-2 text-[14px] font-semibold text-text-primary has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand"
                  >
                    <input
                      type="checkbox"
                      name={`avail_${d}`}
                      value={s}
                      defaultChecked={defaultChecked(d, s, { tpl })}
                      className="sr-only"
                    />
                    {t(s)}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <Button type="submit" variant="primary" block size="md">
            {tCommon("save")}
          </Button>
        </form>
      </main>
    </>
  );
}

function TemplateForm({
  locale,
  tpl,
  label,
}: {
  locale: string;
  tpl: string;
  label: string;
}) {
  return (
    <form action={applyTemplate}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="tpl" value={tpl} />
      <button
        type="submit"
        className="inline-flex h-10 items-center rounded-pill border-[1.5px] border-brand bg-bg-base px-4 text-[14px] font-semibold text-brand"
      >
        {label}
      </button>
    </form>
  );
}
