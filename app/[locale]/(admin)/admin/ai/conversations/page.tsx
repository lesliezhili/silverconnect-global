import { setRequestLocale, getTranslations } from "next-intl/server";
import { X, Star, ShieldAlert, ArrowUpRight, Check } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { getAdmin } from "@/components/domain/adminCookie";
import { MOCK_AI_CONVS, type AdminAiConv } from "@/components/domain/adminMock";

export default async function AdminAiConversationsPage({
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
  const tA = await getTranslations("aAi");

  const drawerId = typeof sp.id === "string" ? sp.id : null;
  const drawer = drawerId ? MOCK_AI_CONVS.find((c) => c.id === drawerId) : null;

  return (
    <AdminShell email={admin.email ?? ""}>
      <h1 className="text-h2">{tA("convTitle")}</h1>
      <p className="mt-1 text-[15px] text-text-secondary">{tA("convSub")}</p>

      <div className="mt-5 overflow-hidden rounded-lg border border-border bg-bg-base">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-border bg-bg-surface-2 text-text-secondary">
            <tr>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide">{t("colId")}</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide">{t("colCustomer")}</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide">{tA("intent")}</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide">{t("colStatus")}</th>
              <th className="hidden px-4 py-3 text-[12px] font-semibold uppercase tracking-wide md:table-cell">{tA("rating")}</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_AI_CONVS.map((c) => (
              <tr key={c.id} className={"border-b border-border last:border-b-0 " + (c.id === drawerId ? "bg-brand-soft" : "")}>
                <td className="px-4 py-3 font-bold tabular-nums">
                  <Link href={`?id=${c.id}`} className="text-brand">{c.id}</Link>
                </td>
                <td className="px-4 py-3">{c.user}</td>
                <td className="px-4 py-3">{c.intent}</td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1">
                    {c.emergency && (
                      <span className="inline-flex h-6 items-center gap-1 rounded-sm bg-danger-soft px-2 text-[11px] font-bold uppercase text-danger">
                        <ShieldAlert size={11} aria-hidden /> {tA("emergency")}
                      </span>
                    )}
                    {c.escalated && (
                      <span className="inline-flex h-6 items-center gap-1 rounded-sm bg-warning-soft px-2 text-[11px] font-bold uppercase text-warning">
                        <ArrowUpRight size={11} aria-hidden /> {tA("escalated")}
                      </span>
                    )}
                    {c.resolved && (
                      <span className="inline-flex h-6 items-center gap-1 rounded-sm bg-success-soft px-2 text-[11px] font-bold uppercase text-success">
                        <Check size={11} aria-hidden /> {tA("resolved")}
                      </span>
                    )}
                  </span>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {c.rating ? (
                    <span className="inline-flex items-center gap-0.5 tabular-nums">
                      <Star size={12} className="fill-[var(--brand-accent)] text-[var(--brand-accent)]" aria-hidden />
                      {c.rating}
                    </span>
                  ) : (
                    <span className="text-text-tertiary">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawer && <ConversationDrawer item={drawer} t={t} tA={tA} />}
    </AdminShell>
  );
}

function ConversationDrawer({
  item,
  t,
  tA,
}: {
  item: AdminAiConv;
  t: Awaited<ReturnType<typeof getTranslations<"admin">>>;
  tA: Awaited<ReturnType<typeof getTranslations<"aAi">>>;
}) {
  return (
    <>
      <Link href="/admin/ai/conversations" aria-label={t("drawerClose")} className="fixed inset-0 z-40 bg-black/30" />
      <aside role="dialog" aria-modal="true" aria-label={tA("drawer")} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col overflow-y-auto border-l border-border bg-bg-base shadow-xl">
        <header className="sticky top-0 flex items-center justify-between border-b border-border bg-bg-base px-5 py-3">
          <p className="text-[16px] font-bold tabular-nums">{item.id}</p>
          <Link href="/admin/ai/conversations" aria-label={t("drawerClose")} className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-bg-surface-2">
            <X size={18} aria-hidden />
          </Link>
        </header>
        <div className="flex-1 px-5 py-5">
          <p className="text-[13px] text-text-tertiary">{item.user} · {item.intent}</p>
          <ol className="mt-4 flex flex-col gap-3">
            {item.transcript.map((m, i) => (
              <li key={i} className={"flex " + (m.who === "user" ? "justify-end" : "justify-start")}>
                <p className={"max-w-[80%] rounded-md px-3 py-2 text-[14px] " + (m.who === "user" ? "bg-brand text-white" : "bg-bg-surface-2 text-text-primary")}>
                  {m.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </>
  );
}
