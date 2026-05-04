import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { getAdmin } from "@/components/domain/adminCookie";
import { MOCK_CUSTOMERS } from "@/components/domain/adminMock";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const admin = await getAdmin();
  if (!admin.signedIn) redirect({ href: "/admin/login", locale });
  const t = await getTranslations("admin");
  const tC = await getTranslations("aCustomers");
  const tD = await getTranslations("aCustomerDetail");

  const c = MOCK_CUSTOMERS.find((x) => x.id === id);
  if (!c) notFound();

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-AU", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <AdminShell email={admin.email ?? ""}>
      <Link href="/admin/customers" className="inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-brand">
        <ChevronLeft size={16} aria-hidden /> {tC("title")}
      </Link>

      <div className="mt-3 flex items-center gap-4 rounded-lg border border-border bg-bg-base p-5">
        <ProviderAvatar size={72} hue={1} initials={c.initials} />
        <div className="min-w-0 flex-1">
          <h1 className="text-h2">{c.name}</h1>
          <p className="mt-0.5 text-[13px] text-text-tertiary">{c.email}</p>
          <p className="mt-0.5 text-[12px] text-text-tertiary tabular-nums">{tC("registeredAt", { when: fmt(c.registeredISO) })}</p>
        </div>
      </div>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={tD("bookings")} value={String(c.bookings)} />
        <Stat label={tC("spend")} value={`$${c.lifetimeSpend.toLocaleString()}`} />
        <Stat label={tD("disputes")} value={"0"} />
        <Stat label={tD("family")} value={"2"} />
      </section>

      {(["bookings", "payments", "disputes", "family", "devices", "loginHistory"] as const).map((sec) => (
        <section key={sec} className="mt-5 rounded-lg border border-border bg-bg-base p-4">
          <p className="text-[14px] font-bold">{tD(sec)}</p>
          <p className="mt-2 text-[13px] text-text-tertiary">—</p>
        </section>
      ))}

      <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
        <button type="button" className="inline-flex h-10 items-center rounded-md border-[1.5px] border-warning bg-bg-base px-4 text-[14px] font-bold text-warning">
          {tD("suspend")}
        </button>
        <button type="button" className="inline-flex h-10 items-center rounded-md border-[1.5px] border-success bg-bg-base px-4 text-[14px] font-bold text-success">
          {tD("resume")}
        </button>
        <button type="button" className="inline-flex h-10 items-center rounded-md border-[1.5px] border-danger bg-bg-base px-4 text-[14px] font-bold text-danger">
          {tD("ban")}
        </button>
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-base p-4">
      <p className="text-[12px] text-text-tertiary">{label}</p>
      <p className="mt-1 text-[22px] font-extrabold tabular-nums">{value}</p>
    </div>
  );
}
