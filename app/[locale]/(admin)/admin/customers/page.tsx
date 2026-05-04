import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { X, Check } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { Button } from "@/components/ui/Button";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { getAdmin } from "@/components/domain/adminCookie";
import { MOCK_CUSTOMERS, type AdminCustomer } from "@/components/domain/adminMock";

async function customerAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "");
  nextRedirect(`/${locale}/admin/customers?applied=${id}`);
}

export default async function AdminCustomersPage({
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
  const tC = await getTranslations("aCustomers");

  const drawerId = typeof sp.id === "string" ? sp.id : null;
  const applied = typeof sp.applied === "string" ? sp.applied : null;
  const drawer = drawerId ? MOCK_CUSTOMERS.find((c) => c.id === drawerId) : null;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-AU", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <AdminShell email={admin.email ?? ""}>
      <h1 className="text-h2">{tC("title")}</h1>

      {applied && (
        <div role="status" className="mt-3 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-2.5 text-[14px] font-semibold text-success">
          <Check size={16} aria-hidden /> {t("applied")} · {applied}
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-lg border border-border bg-bg-base">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-border bg-bg-surface-2 text-text-secondary">
            <tr>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide">{t("colCustomer")}</th>
              <th className="hidden px-4 py-3 text-[12px] font-semibold uppercase tracking-wide md:table-cell">{t("colCountry")}</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide">{tC("bookings")}</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide">{tC("spend")}</th>
              <th className="hidden px-4 py-3 text-[12px] font-semibold uppercase tracking-wide lg:table-cell">{tC("risk")}</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CUSTOMERS.map((c) => (
              <tr key={c.id} className={"border-b border-border last:border-b-0 " + (c.id === drawerId ? "bg-brand-soft" : "")}>
                <td className="px-4 py-3">
                  <Link href={`?id=${c.id}`} className="flex items-center gap-3">
                    <ProviderAvatar size={36} hue={1} initials={c.initials} />
                    <span className="min-w-0">
                      <span className="block font-bold text-brand">{c.name}</span>
                      <span className="block text-[12px] text-text-tertiary">{c.email}</span>
                    </span>
                  </Link>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">{c.country}</td>
                <td className="px-4 py-3 tabular-nums">{c.bookings}</td>
                <td className="px-4 py-3 tabular-nums">${c.lifetimeSpend.toLocaleString()}</td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  {c.riskFlags.length === 0 ? (
                    <span className="text-text-tertiary">{tC("riskNone")}</span>
                  ) : (
                    c.riskFlags.map((f) => (
                      <span key={f} className="mr-1 inline-flex h-6 items-center rounded-sm bg-danger-soft px-2 text-[11px] font-bold uppercase text-danger">
                        {f}
                      </span>
                    ))
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawer && <CustomerDrawer item={drawer} locale={locale} t={t} tC={tC} fmt={fmt} />}
    </AdminShell>
  );
}

function CustomerDrawer({
  item,
  locale,
  t,
  tC,
  fmt,
}: {
  item: AdminCustomer;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"admin">>>;
  tC: Awaited<ReturnType<typeof getTranslations<"aCustomers">>>;
  fmt: (iso: string) => string;
}) {
  return (
    <>
      <Link href="/admin/customers" aria-label={t("drawerClose")} className="fixed inset-0 z-40 bg-black/30" />
      <aside role="dialog" aria-modal="true" aria-label={tC("drawer")} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col overflow-y-auto border-l border-border bg-bg-base shadow-xl">
        <header className="sticky top-0 flex items-center justify-between border-b border-border bg-bg-base px-5 py-3">
          <p className="text-[16px] font-bold">{item.name}</p>
          <Link href="/admin/customers" aria-label={t("drawerClose")} className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-bg-surface-2">
            <X size={18} aria-hidden />
          </Link>
        </header>
        <div className="flex-1 px-5 py-5">
          <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-[14px]">
            <dt className="font-semibold text-text-tertiary">{tC("colEmail")}</dt>
            <dd>{item.email}</dd>
            <dt className="font-semibold text-text-tertiary">{t("colCountry")}</dt>
            <dd>{item.country}</dd>
            <dt className="font-semibold text-text-tertiary">{tC("colRegistered")}</dt>
            <dd className="tabular-nums">{fmt(item.registeredISO)}</dd>
            <dt className="font-semibold text-text-tertiary">{tC("bookings")}</dt>
            <dd className="tabular-nums">{item.bookings}</dd>
            <dt className="font-semibold text-text-tertiary">{tC("spend")}</dt>
            <dd className="tabular-nums">${item.lifetimeSpend.toLocaleString()}</dd>
          </dl>

          <Link href={`/admin/customers/${item.id}`} className="mt-5 inline-flex h-10 items-center rounded-sm border-[1.5px] border-brand bg-bg-base px-3 text-[13px] font-semibold text-brand">
            {tC("viewFull")}
          </Link>

          <form action={customerAction} className="mt-6 flex flex-col gap-3 border-t border-border pt-5">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="id" value={item.id} />
            <Button type="submit" variant="primary" size="md" name="action" value="reset">
              {tC("resetPassword")}
            </Button>
            <button type="submit" name="action" value="merge" className="inline-flex h-10 items-center justify-center rounded-md border-[1.5px] border-border-strong bg-bg-base text-[14px] font-semibold text-text-primary">
              {tC("mergeAccounts")}
            </button>
            <button type="submit" name="action" value="delete" className="inline-flex h-10 items-center justify-center rounded-md border-[1.5px] border-danger bg-bg-base text-[14px] font-bold text-danger">
              {tC("deleteGdpr")}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
