import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { X, Check, ShieldAlert } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { getAdmin } from "@/components/domain/adminCookie";
import {
  MOCK_SAFETY,
  type AdminSafetyEvent,
  type SafetyLevel,
  type SafetyStatus,
} from "@/components/domain/adminMock";

const LEVEL_KEYS: Record<SafetyLevel, "levelLow" | "levelMid" | "levelHigh"> = {
  low: "levelLow",
  mid: "levelMid",
  high: "levelHigh",
};

const STATUS_KEYS: Record<SafetyStatus, "statusOpen" | "statusInvestigating" | "statusClosed"> = {
  open: "statusOpen",
  investigating: "statusInvestigating",
  closed: "statusClosed",
};

const LEVEL_RANK: Record<SafetyLevel, number> = { high: 0, mid: 1, low: 2 };

async function safetyAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "");
  nextRedirect(`/${locale}/admin/safety?applied=${id}`);
}

export default async function AdminSafetyPage({
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

  const drawerId = typeof sp.id === "string" ? sp.id : null;
  const applied = typeof sp.applied === "string" ? sp.applied : null;
  const drawerItem = drawerId ? MOCK_SAFETY.find((s) => s.id === drawerId) : null;

  const sorted = [...MOCK_SAFETY].sort(
    (a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]
  );

  return (
    <AdminShell email={admin.email ?? ""}>
      <h1 className="text-h2">{t("safetyTitle")}</h1>

      {applied && (
        <div
          role="status"
          className="mt-3 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-2.5 text-[14px] font-semibold text-success"
        >
          <Check size={16} aria-hidden /> {t("applied")} · {applied}
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-lg border border-border bg-bg-base">
        {sorted.length === 0 ? (
          <p className="px-5 py-8 text-center text-[14px] text-text-tertiary">
            {t("emptySafety")}
          </p>
        ) : (
          <table className="w-full table-fixed text-left text-[13px]">
            <thead className="border-b border-border bg-bg-surface-2 text-text-secondary">
              <tr>
                <Th>{t("colId")}</Th>
                <Th>{t("colLevel")}</Th>
                <Th>{t("colReporter")}</Th>
                <Th className="hidden lg:table-cell">{t("colReported")}</Th>
                <Th>{t("colStatus")}</Th>
                <Th className="hidden md:table-cell">{t("colSubmitted")}</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <Row
                  key={s.id}
                  s={s}
                  locale={locale}
                  t={t}
                  active={s.id === drawerId}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {drawerItem && <SafetyDrawer item={drawerItem} locale={locale} t={t} />}
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
  s,
  locale,
  t,
  active,
}: {
  s: AdminSafetyEvent;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"admin">>>;
  active: boolean;
}) {
  const lvlCls =
    s.level === "high"
      ? "bg-danger-soft text-danger"
      : s.level === "mid"
      ? "bg-warning-soft text-warning"
      : "bg-bg-surface-2 text-text-secondary";

  return (
    <tr className={"border-b border-border last:border-b-0 " + (active ? "bg-brand-soft" : "")}>
      <Td>
        <Link href={`?id=${s.id}`} className="font-bold text-brand tabular-nums">
          {s.id}
        </Link>
      </Td>
      <Td>
        <span
          className={`inline-flex h-6 items-center gap-1 rounded-sm px-2 text-[11px] font-bold uppercase ${lvlCls}`}
        >
          <ShieldAlert size={12} aria-hidden />
          {t(LEVEL_KEYS[s.level])}
        </span>
      </Td>
      <Td>{s.reporterName}</Td>
      <Td className="hidden lg:table-cell">{s.reportedName}</Td>
      <Td>{t(STATUS_KEYS[s.status])}</Td>
      <Td className="hidden md:table-cell tabular-nums text-text-tertiary">
        {new Date(s.submittedISO).toLocaleString(
          locale === "zh" ? "zh-CN" : "en-AU",
          { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
        )}
      </Td>
    </tr>
  );
}

function SafetyDrawer({
  item,
  locale,
  t,
}: {
  item: AdminSafetyEvent;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"admin">>>;
}) {
  return (
    <>
      <Link
        href="/admin/safety"
        aria-label={t("drawerClose")}
        className="fixed inset-0 z-40 bg-black/30"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("safetyDrawer")}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col overflow-y-auto border-l border-border bg-bg-base shadow-xl"
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-border bg-bg-base px-5 py-3">
          <p className="text-[16px] font-bold tabular-nums">{item.id}</p>
          <Link
            href="/admin/safety"
            aria-label={t("drawerClose")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-bg-surface-2"
          >
            <X size={18} aria-hidden />
          </Link>
        </header>
        <div className="flex-1 px-5 py-5">
          <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-[14px]">
            <dt className="font-semibold text-text-tertiary">{t("colReporter")}</dt>
            <dd>{item.reporterName}</dd>
            <dt className="font-semibold text-text-tertiary">{t("colReported")}</dt>
            <dd>{item.reportedName}</dd>
            <dt className="font-semibold text-text-tertiary">{t("colLevel")}</dt>
            <dd className="font-bold">{t(LEVEL_KEYS[item.level])}</dd>
            <dt className="font-semibold text-text-tertiary">{t("colSubmitted")}</dt>
            <dd className="tabular-nums">
              {new Date(item.submittedISO).toLocaleString(
                locale === "zh" ? "zh-CN" : "en-AU",
                { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
              )}
            </dd>
          </dl>

          <p className="mt-4 text-[14px] font-bold">{t("disputeTimeline")}</p>
          <p className="mt-2 rounded-md border border-border bg-bg-surface-2 p-3 text-[14px]">
            {item.description}
          </p>

          <form action={safetyAction} className="mt-6 flex flex-col gap-4 border-t border-border pt-5">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="id" value={item.id} />
            <fieldset>
              <legend className="text-[14px] font-bold">{t("safetyAction")}</legend>
              <ul className="mt-2 flex flex-col gap-2">
                {(
                  [
                    { key: "warn", label: t("safetyWarn") },
                    { key: "suspend", label: t("safetySuspend") },
                    { key: "ban", label: t("safetyBan") },
                    { key: "police", label: t("safetyPolice") },
                    { key: "close", label: t("safetyClose") },
                  ] as const
                ).map((a) => (
                  <li key={a.key}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-md border-[1.5px] border-border bg-bg-base p-3 has-[:checked]:border-2 has-[:checked]:border-brand">
                      <input
                        type="radio"
                        name="action"
                        value={a.key}
                        required
                        defaultChecked={a.key === "warn"}
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
              <Label htmlFor="note">{t("disputeNote")}</Label>
              <textarea
                id="note"
                name="note"
                rows={3}
                className="block w-full rounded-md border-[1.5px] border-border-strong bg-bg-base p-3 text-[14px] focus:border-brand focus:outline-none"
              />
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
