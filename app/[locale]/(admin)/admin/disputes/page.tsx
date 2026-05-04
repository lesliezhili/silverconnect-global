import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { X, Clock, Check } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getAdmin } from "@/components/domain/adminCookie";
import {
  MOCK_DISPUTES,
  type AdminDispute,
  type DisputeStatus,
} from "@/components/domain/adminMock";

const STATUS_KEYS: Record<DisputeStatus, "statusOpen" | "statusReview" | "statusResolved" | "statusRejected"> = {
  open: "statusOpen",
  review: "statusReview",
  resolved: "statusResolved",
  rejected: "statusRejected",
};

async function disputeDecision(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "");
  nextRedirect(`/${locale}/admin/disputes?applied=${id}`);
}

export default async function AdminDisputesPage({
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

  const fStatus = typeof sp.status === "string" ? sp.status : "all";
  const fCountry = typeof sp.country === "string" ? sp.country : "all";
  const drawerId = typeof sp.id === "string" ? sp.id : null;
  const applied = typeof sp.applied === "string" ? sp.applied : null;
  const drawerItem = drawerId
    ? MOCK_DISPUTES.find((d) => d.id === drawerId)
    : null;

  const filtered = MOCK_DISPUTES.filter((d) => {
    if (fStatus !== "all" && d.status !== fStatus) return false;
    if (fCountry !== "all" && d.country !== fCountry) return false;
    return true;
  });

  return (
    <AdminShell email={admin.email ?? ""}>
      <div className="flex items-center justify-between">
        <h1 className="text-h2">{t("disputesTitle")}</h1>
      </div>

      {applied && (
        <div
          role="status"
          className="mt-3 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-2.5 text-[14px] font-semibold text-success"
        >
          <Check size={16} aria-hidden /> {t("applied")} · {applied}
        </div>
      )}

      <FilterBar
        status={fStatus}
        country={fCountry}
        statusOptions={["all", "open", "review", "resolved", "rejected"]}
        statusLabel={(v) => (v === "all" ? t("filterAll") : t(STATUS_KEYS[v as DisputeStatus]))}
        countryLabel={(v) =>
          v === "all"
            ? t("filterAll")
            : t(`country${v}` as "countryAU" | "countryCN" | "countryCA")
        }
        statusName={t("filterStatus")}
        countryName={t("filterCountry")}
      />

      <div className="mt-5 overflow-hidden rounded-lg border border-border bg-bg-base">
        {filtered.length === 0 ? (
          <p className="px-5 py-8 text-center text-[14px] text-text-tertiary">
            {t("emptyDisputes")}
          </p>
        ) : (
          <table className="w-full table-fixed text-left text-[13px]">
            <thead className="border-b border-border bg-bg-surface-2 text-text-secondary">
              <tr>
                <Th>{t("colId")}</Th>
                <Th>{t("colCustomer")}</Th>
                <Th className="hidden lg:table-cell">{t("colProvider")}</Th>
                <Th>{t("colType")}</Th>
                <Th>{t("colAmount")}</Th>
                <Th className="hidden md:table-cell">{t("colCountry")}</Th>
                <Th>{t("colStatus")}</Th>
                <Th>{t("colSla")}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <Row key={d.id} d={d} locale={locale} t={t} active={d.id === drawerId} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {drawerItem && <DisputeDrawer item={drawerItem} locale={locale} t={t} />}
    </AdminShell>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-[12px] font-semibold uppercase tracking-wide ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`truncate px-4 py-3 ${className}`}>{children}</td>;
}

function Row({
  d,
  locale,
  t,
  active,
}: {
  d: AdminDispute;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"admin">>>;
  active: boolean;
}) {
  const slaCls =
    d.status === "resolved" || d.status === "rejected"
      ? "text-text-tertiary"
      : d.slaHours <= 0
      ? "text-danger"
      : d.slaHours < 12
      ? "text-warning"
      : "text-text-primary";
  const slaLabel =
    d.status === "resolved" || d.status === "rejected"
      ? t("slaDone")
      : d.slaHours <= 0
      ? t("slaDanger", { h: -d.slaHours })
      : t("slaWarn", { h: d.slaHours });

  return (
    <tr className={"border-b border-border last:border-b-0 " + (active ? "bg-brand-soft" : "")}>
      <Td>
        <Link
          href={`?id=${d.id}`}
          className="font-bold text-brand tabular-nums"
        >
          {d.id}
        </Link>
      </Td>
      <Td>{d.customerName}</Td>
      <Td className="hidden lg:table-cell">{d.providerName}</Td>
      <Td>{t(`type${d.type.charAt(0).toUpperCase()}${d.type.slice(1)}` as Parameters<typeof t>[0])}</Td>
      <Td className="tabular-nums">${d.amount}</Td>
      <Td className="hidden md:table-cell">{d.country}</Td>
      <Td>
        <StatusPill status={d.status} t={t} />
      </Td>
      <Td className={"tabular-nums font-semibold " + slaCls}>
        <span className="inline-flex items-center gap-1">
          <Clock size={13} aria-hidden />
          {slaLabel}
        </span>
      </Td>
    </tr>
  );
}

function StatusPill({
  status,
  t,
}: {
  status: DisputeStatus;
  t: Awaited<ReturnType<typeof getTranslations<"admin">>>;
}) {
  const cls =
    status === "open"
      ? "bg-danger-soft text-danger"
      : status === "review"
      ? "bg-warning-soft text-warning"
      : status === "resolved"
      ? "bg-success-soft text-success"
      : "bg-bg-surface-2 text-text-tertiary";
  return (
    <span
      className={`inline-flex h-6 items-center rounded-sm px-2 text-[11px] font-bold uppercase tracking-wide ${cls}`}
    >
      {t(STATUS_KEYS[status])}
    </span>
  );
}

function FilterBar({
  status,
  country,
  statusOptions,
  statusLabel,
  countryLabel,
  statusName,
  countryName,
}: {
  status: string;
  country: string;
  statusOptions: string[];
  statusLabel: (v: string) => string;
  countryLabel: (v: string) => string;
  statusName: string;
  countryName: string;
}) {
  return (
    <form
      method="get"
      className="mt-4 flex flex-wrap items-end gap-3 rounded-md border border-border bg-bg-base p-3"
    >
      <div>
        <Label htmlFor="status">{statusName}</Label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="block h-10 rounded-md border-[1.5px] border-border bg-bg-base px-3 text-[14px]"
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="country">{countryName}</Label>
        <select
          id="country"
          name="country"
          defaultValue={country}
          className="block h-10 rounded-md border-[1.5px] border-border bg-bg-base px-3 text-[14px]"
        >
          {["all", "AU", "CN", "CA"].map((c) => (
            <option key={c} value={c}>
              {countryLabel(c)}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="ml-auto inline-flex h-10 items-center rounded-md bg-brand px-4 text-[14px] font-bold text-white"
      >
        OK
      </button>
    </form>
  );
}

function DisputeDrawer({
  item,
  locale,
  t,
}: {
  item: AdminDispute;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"admin">>>;
}) {
  return (
    <>
      <Link
        href="/admin/disputes"
        aria-label={t("drawerClose")}
        className="fixed inset-0 z-40 bg-black/30"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("disputeDrawer")}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col overflow-y-auto border-l border-border bg-bg-base shadow-xl"
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-border bg-bg-base px-5 py-3">
          <p className="text-[16px] font-bold tabular-nums">{item.id}</p>
          <Link
            href="/admin/disputes"
            aria-label={t("drawerClose")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-bg-surface-2"
          >
            <X size={18} aria-hidden />
          </Link>
        </header>
        <div className="flex-1 px-5 py-5">
          <p className="text-[14px] font-bold">{t("disputeTimeline")}</p>
          <p className="mt-2 rounded-md border border-border bg-bg-surface-2 p-3 text-[14px] text-text-primary">
            {item.description}
          </p>

          <p className="mt-5 text-[14px] font-bold">{t("evidence")}</p>
          <p className="mt-2 text-[13px] text-text-tertiary">{t("noEvidence")}</p>

          <form action={disputeDecision} className="mt-6 flex flex-col gap-4 border-t border-border pt-5">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="id" value={item.id} />
            <fieldset>
              <legend className="text-[14px] font-bold">{t("disputeAction")}</legend>
              <ul className="mt-2 flex flex-col gap-2">
                {(
                  [
                    { key: "full", label: t("disputeFullRefund") },
                    { key: "partial", label: t("disputePartialRefund") },
                    { key: "reject", label: t("disputeReject") },
                    { key: "escalate", label: t("disputeEscalate") },
                  ] as const
                ).map((a) => (
                  <li key={a.key}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-md border-[1.5px] border-border bg-bg-base p-3 has-[:checked]:border-2 has-[:checked]:border-brand">
                      <input
                        type="radio"
                        name="action"
                        value={a.key}
                        required
                        defaultChecked={a.key === "full"}
                        className="peer sr-only"
                      />
                      <span
                        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border-strong after:hidden after:h-2.5 after:w-2.5 after:rounded-full after:bg-brand after:content-[''] peer-checked:border-brand peer-checked:after:block"
                        aria-hidden
                      />
                      <span className="text-[14px]">{a.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>

            <div>
              <Label htmlFor="amount">{t("disputePartialAmount")}</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min={0}
                max={item.amount}
                defaultValue={item.amount}
                inputMode="decimal"
              />
            </div>

            <div>
              <Label htmlFor="note">{t("disputeNote")}</Label>
              <textarea
                id="note"
                name="note"
                rows={3}
                aria-describedby="note-hint"
                className="block w-full rounded-md border-[1.5px] border-border-strong bg-bg-base p-3 text-[14px] focus:border-brand focus:outline-none"
              />
              <p id="note-hint" className="mt-1.5 text-[12px] text-text-tertiary">
                {t("disputeNoteHint")}
              </p>
            </div>

            <Button type="submit" variant="primary" block size="md">
              {t("disputeApply")}
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}
