import { setRequestLocale, getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { eq, sql } from "drizzle-orm";
import { redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { getAdmin } from "@/components/domain/adminCookie";
import { db } from "@/lib/db";
import { payments, refunds, payouts } from "@/lib/db/schema/payments";

export const dynamic = "force-dynamic";

const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? "20");

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

  try {
    const [inflow] = await db
      .select({
        total: (sql<number>`coalesce(sum(${payments.amount}::numeric), 0)::float`),
      })
      .from(payments)
      .where(eq(payments.status, "captured"));

    const [outflow] = await db
      .select({
        total: (sql<number>`coalesce(sum(${payouts.amount}::numeric), 0)::float`),
      })
      .from(payouts)
      .where(eq(payouts.status, "paid"));

    const [refundAgg] = await db
      .select({
        count: (sql<number>`count(*)::int`),
        total: (sql<number>`coalesce(sum(${refunds.amount}::numeric), 0)::float`),
      })
      .from(refunds);

    const inflowTotal = Number(inflow?.total ?? 0);
    const outflowTotal = Number(outflow?.total ?? 0);
    const refundTotal = Number(refundAgg?.total ?? 0);
    const refundCount = Number(refundAgg?.count ?? 0);
    const platformFee = (inflowTotal * PLATFORM_FEE_PERCENT) / 100;

    const fmt = (n: number) =>
      n.toLocaleString(locale === "zh" ? "zh-CN" : "en-AU", {
        maximumFractionDigits: 0,
      });

    const cards = [
      { label: t("inflow"), value: `$${fmt(inflowTotal)}` },
      { label: t("outflow"), value: `$${fmt(outflowTotal)}` },
      { label: t("platformFee"), value: `$${fmt(platformFee)}` },
      { label: t("chargebacks"), value: String(refundCount) },
    ];

    return (
      <AdminShell email={admin.email ?? ""}>
        <div className="flex items-center justify-between">
          <h1 className="text-h2">{t("title")}</h1>
          <div className="flex gap-2">
            <button
              type="button"
              disabled
              className="inline-flex h-12 items-center gap-2 rounded-md border-[1.5px] border-border-strong bg-bg-base px-3 text-[17px] font-semibold text-text-tertiary opacity-60"
            >
              <Download size={14} aria-hidden /> {t("exportCsv")}
            </button>
            <button
              type="button"
              disabled
              className="inline-flex h-12 items-center gap-2 rounded-md border-[1.5px] border-border-strong bg-bg-base px-3 text-[17px] font-semibold text-text-tertiary opacity-60"
            >
              <Download size={14} aria-hidden /> {t("exportPdf")}
            </button>
          </div>
        </div>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-lg border border-border bg-bg-base p-4"
            >
              <p className="text-[16px] text-text-tertiary">{c.label}</p>
              <p className="mt-1 text-[22px] font-extrabold tabular-nums">
                {c.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-5 rounded-lg border border-border bg-bg-base p-4">
          <p className="text-[16px] font-bold">{t("platformFee")}</p>
          <p className="mt-1 text-[17px] text-text-secondary">
            {PLATFORM_FEE_PERCENT}% — set via{" "}
            <code className="rounded bg-bg-surface-2 px-1">
              PLATFORM_FEE_PERCENT
            </code>
          </p>
          <p className="mt-2 text-[16px] text-text-tertiary">
            Refunded:{" "}
            <span className="font-semibold tabular-nums">
              ${fmt(refundTotal)}
            </span>{" "}
            across {refundCount} refund(s)
          </p>
        </section>

        <section className="mt-5 rounded-lg border border-border bg-bg-base p-4">
          <p className="text-[16px] font-bold">{t("suspicious")}</p>
          <p className="mt-2 text-[17px] text-text-tertiary">{t("none")}</p>
        </section>
      </AdminShell>
    );
  } catch (error) {
    console.error("[payments] DB unavailable", error);
    return (
      <main className="mx-auto w-full max-w-content px-5 py-12 text-center">
        <p className="text-[48px]">⏳</p>
        <h1 className="mt-4 text-[22px] font-bold">Service Temporarily Unavailable</h1>
        <p className="mt-2 text-[17px] text-text-secondary">Please try again shortly.</p>
      </main>
    );
  }
}
