import { setRequestLocale, getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { getAdmin } from "@/components/domain/adminCookie";
import { PLATFORM_FEES } from "@/components/domain/adminMock";

export default async function AdminPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const admin = await getAdmin();
  if (!admin.signedIn) redirect({ href: "/admin/login", locale });
  const t = await getTranslations("aPayments");
  const tCountry = await getTranslations("admin");

  const cards = [
    { label: t("inflow"), value: "$24,850" },
    { label: t("outflow"), value: "$18,920" },
    { label: t("platformFee"), value: "$5,930" },
    { label: t("chargebacks"), value: "2" },
  ];

  return (
    <AdminShell email={admin.email ?? ""}>
      <div className="flex items-center justify-between">
        <h1 className="text-h2">{t("title")}</h1>
        <div className="flex gap-2">
          <button type="button" className="inline-flex h-10 items-center gap-2 rounded-md border-[1.5px] border-border-strong bg-bg-base px-3 text-[13px] font-semibold text-text-primary">
            <Download size={14} aria-hidden /> {t("exportCsv")}
          </button>
          <button type="button" className="inline-flex h-10 items-center gap-2 rounded-md border-[1.5px] border-border-strong bg-bg-base px-3 text-[13px] font-semibold text-text-primary">
            <Download size={14} aria-hidden /> {t("exportPdf")}
          </button>
        </div>
      </div>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-bg-base p-4">
            <p className="text-[12px] text-text-tertiary">{c.label}</p>
            <p className="mt-1 text-[22px] font-extrabold tabular-nums">{c.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-5 rounded-lg border border-border bg-bg-base p-4">
        <p className="text-[14px] font-bold">{t("taxByCountry")}</p>
        <ul className="mt-3 flex flex-col gap-2">
          {(["AU", "CN", "CA"] as const).map((c) => (
            <li key={c} className="flex items-center justify-between text-[13px]">
              <span>{tCountry(`country${c}`)}</span>
              <span className="tabular-nums font-semibold">{Math.round(PLATFORM_FEES[c] * 100)}%</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 rounded-lg border border-border bg-bg-base p-4">
        <p className="text-[14px] font-bold">{t("suspicious")}</p>
        <p className="mt-2 text-[13px] text-text-tertiary">{t("none")}</p>
      </section>
    </AdminShell>
  );
}
