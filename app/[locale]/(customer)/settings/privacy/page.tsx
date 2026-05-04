import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { CheckCircle2, Download, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";

async function savePrivacy(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  nextRedirect(`/${locale}/settings/privacy?saved=1`);
}

export default async function PrivacySettingsPage({
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
  const t = await getTranslations("privacy");
  const tCommon = await getTranslations("common");
  const saved = sp.saved === "1";

  const opts = [
    { name: "analytics", label: t("optAnalytics"), hint: t("optAnalyticsHint"), defaultOn: true },
    { name: "marketing", label: t("optMarketing"), hint: t("optMarketingHint"), defaultOn: false },
    { name: "shareFamily", label: t("optShareWithFamily"), hint: "", defaultOn: true },
  ];

  return (
    <>
      <Header country={country} back signedIn={session.signedIn} initials={session.initials} />
      <main id="main-content" className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12">
        <h1 className="text-h2">{t("title")}</h1>
        <p className="mt-1 text-[15px] text-text-secondary">{t("sub")}</p>

        {saved && (
          <div role="status" className="mt-4 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-3 text-[15px] font-semibold text-success">
            <CheckCircle2 size={18} aria-hidden /> {t("saved")}
          </div>
        )}

        <form action={savePrivacy} className="mt-5 flex flex-col gap-3">
          <input type="hidden" name="locale" value={locale} />
          {opts.map((o) => (
            <label key={o.name} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-bg-base p-4 has-[:checked]:border-brand">
              <input type="checkbox" name={o.name} defaultChecked={o.defaultOn} className="peer sr-only" />
              <span aria-hidden className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border-[1.5px] border-border-strong peer-checked:border-brand peer-checked:bg-brand peer-checked:after:block after:hidden after:text-white after:content-['✓']" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold">{o.label}</span>
                {o.hint && <span className="mt-0.5 block text-[13px] text-text-secondary">{o.hint}</span>}
              </span>
            </label>
          ))}
          <Button type="submit" variant="primary" block size="md">{tCommon("save")}</Button>
        </form>

        <section className="mt-8 rounded-lg border border-border bg-bg-base p-5">
          <h2 className="flex items-center gap-2 text-[16px] font-bold">
            <Download size={18} className="text-brand" aria-hidden />
            {t("download")}
          </h2>
          <p className="mt-1 text-[13px] text-text-secondary">{t("downloadHint")}</p>
          <button type="button" className="mt-3 inline-flex h-12 items-center rounded-md border-[1.5px] border-brand bg-bg-base px-5 text-[15px] font-bold text-brand">
            {t("download")}
          </button>
        </section>

        <section className="mt-5 rounded-lg border-[1.5px] border-danger bg-danger-soft p-5">
          <h2 className="flex items-center gap-2 text-[16px] font-bold text-danger">
            <AlertTriangle size={18} aria-hidden />
            {t("deleteAccount")}
          </h2>
          <p className="mt-1 text-[13px] text-danger">{t("deleteHint")}</p>
          <button type="button" className="mt-3 inline-flex h-12 items-center rounded-md border-[1.5px] border-danger bg-bg-base px-5 text-[15px] font-bold text-danger">
            {t("deleteAccount")}
          </button>
        </section>
      </main>
    </>
  );
}
