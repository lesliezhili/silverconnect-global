import { setRequestLocale, getTranslations } from "next-intl/server";
import { AlertTriangle } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { getAdmin } from "@/components/domain/adminCookie";
import { MOCK_BOOKINGS_FEED, type AdminBookingStatus } from "@/components/domain/adminMock";

const STATUS_KEYS: Record<AdminBookingStatus, "statusUnconfirmed" | "statusInEscrow" | "statusReleased" | "statusRescheduled"> = {
  unconfirmed: "statusUnconfirmed",
  inEscrow: "statusInEscrow",
  released: "statusReleased",
  rescheduled: "statusRescheduled",
};

export default async function AdminBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const admin = await getAdmin();
  if (!admin.signedIn) redirect({ href: "/admin/login", locale });
  const t = await getTranslations("admin");
  const tB = await getTranslations("aBookings");

  const filter = typeof sp.filter === "string" ? sp.filter : "all";
  const items = MOCK_BOOKINGS_FEED.filter((b) =>
    filter === "all" ? true : b.flag === filter
  );

  const filters = [
    { key: "all", label: t("filterAll") },
    { key: "stuck", label: tB("filterStuck") },
    { key: "escrow", label: tB("filterEscrow") },
    { key: "rescheduled", label: tB("filterRescheduled") },
  ];

  return (
    <AdminShell email={admin.email ?? ""}>
      <h1 className="text-h2">{tB("title")}</h1>
      <p className="mt-1 text-[15px] text-text-secondary">{tB("sub")}</p>

      <nav role="tablist" className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => {
          const on = f.key === filter;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "?" : `?filter=${f.key}`}
              role="tab"
              aria-selected={on}
              className={
                "inline-flex h-9 items-center rounded-pill border-[1.5px] px-3 text-[13px] font-semibold " +
                (on ? "border-brand bg-brand-soft text-brand" : "border-border-strong bg-bg-base text-text-primary")
              }
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      <ul className="mt-5 flex flex-col gap-2">
        {items.map((b) => {
          const min = Math.max(0, Math.round((Date.now() - +new Date(b.createdISO)) / 60000));
          const cls =
            b.status === "unconfirmed"
              ? "bg-warning-soft text-warning"
              : b.status === "inEscrow"
              ? "bg-brand-soft text-brand"
              : b.status === "released"
              ? "bg-success-soft text-success"
              : "bg-bg-surface-2 text-text-secondary";
          return (
            <li key={b.id} className="flex items-center gap-3 rounded-lg border border-border bg-bg-base p-3">
              {b.flag && (
                <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-warning-soft text-warning">
                  <AlertTriangle size={16} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold tabular-nums">{b.id}</p>
                <p className="mt-0.5 text-[12px] text-text-secondary">
                  {b.customerName} → {b.providerName}
                </p>
              </div>
              <span className="tabular-nums text-[13px] font-bold">${b.amount}</span>
              <span className={`inline-flex h-6 items-center rounded-sm px-2 text-[11px] font-bold uppercase tracking-wide ${cls}`}>
                {tB(STATUS_KEYS[b.status])}
              </span>
              <span className="hidden text-[12px] text-text-tertiary tabular-nums sm:inline">
                {tB("minutesAgo", { n: min })}
              </span>
            </li>
          );
        })}
      </ul>
    </AdminShell>
  );
}
