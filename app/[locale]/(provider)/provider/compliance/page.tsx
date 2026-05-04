import { setRequestLocale, getTranslations } from "next-intl/server";
import { CheckCircle2, AlertTriangle, FileText, Upload } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { redirect } from "@/i18n/navigation";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";

interface Doc {
  id: string;
  type: "police" | "firstAid" | "insurance";
  expiresISO: string;
}

const MOCK: Doc[] = [
  { id: "D-1", type: "police", expiresISO: new Date(Date.now() + 86400000 * 200).toISOString() },
  { id: "D-2", type: "firstAid", expiresISO: new Date(Date.now() + 86400000 * 18).toISOString() },
  { id: "D-3", type: "insurance", expiresISO: new Date(Date.now() - 86400000 * 5).toISOString() },
];

export default async function CompliancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session.signedIn) redirect({ href: "/auth/login", locale });
  const country = await getCountry();
  const t = await getTranslations("pCompliance");
  const tProvider = await getTranslations("provider");

  const now = Date.now();
  const docs = MOCK.map((d) => {
    const ms = +new Date(d.expiresISO) - now;
    const days = Math.round(ms / 86400000);
    const state: "valid" | "expiring" | "expired" = days < 0 ? "expired" : days < 30 ? "expiring" : "valid";
    return { ...d, state, days };
  });
  const anyExpiring = docs.some((d) => d.state !== "valid");
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-AU", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <>
      <Header country={country} back signedIn={session.signedIn} initials={session.initials} />
      <main id="main-content" className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12">
        <h1 className="text-h2">{t("title")}</h1>
        <p className="mt-1 text-[15px] text-text-secondary">{t("sub")}</p>

        {anyExpiring && (
          <div role="alert" className="mt-4 flex items-center gap-2 rounded-md border-[1.5px] border-warning bg-warning-soft px-3.5 py-3 text-[14px] font-semibold text-warning">
            <AlertTriangle size={18} aria-hidden /> {t("expiringWarn")}
          </div>
        )}

        <ul className="mt-5 flex flex-col gap-2">
          {docs.map((d) => {
            const Icon = d.state === "valid" ? CheckCircle2 : AlertTriangle;
            const cls =
              d.state === "valid"
                ? "bg-success-soft text-success"
                : d.state === "expiring"
                ? "bg-warning-soft text-warning"
                : "bg-danger-soft text-danger";
            const labelKey =
              d.type === "police" ? "docPolice" : d.type === "firstAid" ? "docFirstAid" : "docInsurance";
            return (
              <li key={d.id} className="flex items-start gap-3 rounded-lg border border-border bg-bg-base p-4">
                <span aria-hidden className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${cls}`}>
                  <FileText size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold">{tProvider(labelKey)}</p>
                  <p className="mt-0.5 text-[13px] text-text-secondary tabular-nums">
                    {t("expiresOn", { when: fmt(d.expiresISO) })}
                  </p>
                  <p className={"mt-1 inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide " + cls}>
                    <Icon size={12} aria-hidden />
                    {t(d.state === "valid" ? "valid" : d.state === "expiring" ? "expiring" : "expired")}
                  </p>
                </div>
                <label className="inline-flex h-10 cursor-pointer items-center gap-1 rounded-sm border-[1.5px] border-brand bg-bg-base px-3 text-[13px] font-semibold text-brand">
                  <Upload size={13} aria-hidden /> {t("reupload")}
                  <input type="file" accept="image/*,application/pdf" className="sr-only" />
                </label>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
