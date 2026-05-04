import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { EmptyState } from "@/components/domain/PageStates";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";
import { CalendarOff } from "lucide-react";

interface Block {
  id: string;
  fromISO: string;
  toISO: string;
  reason: "vacation" | "training" | "other";
}

const MOCK: Block[] = [
  {
    id: "B-1",
    fromISO: new Date(Date.now() + 86400000 * 14).toISOString(),
    toISO: new Date(Date.now() + 86400000 * 21).toISOString(),
    reason: "vacation",
  },
];

async function addBlock(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  nextRedirect(`/${locale}/provider/blocked-times?added=1`);
}

export default async function BlockedTimesPage({
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
  const t = await getTranslations("pBlocked");
  const tCommon = await getTranslations("common");
  const adding = sp.add === "1";
  const added = sp.added === "1";

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

        {added && (
          <div role="status" className="mt-4 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-3 text-[15px] font-semibold text-success">
            <CheckCircle2 size={18} aria-hidden /> {tCommon("save")}
          </div>
        )}

        {MOCK.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              illustration={CalendarOff as never}
              title={t("empty")}
              cta={
                <a
                  href="?add=1"
                  className="inline-flex h-14 items-center rounded-md bg-brand px-7 text-[17px] font-bold text-white"
                >
                  {t("addBlock")}
                </a>
              }
            />
          </div>
        ) : (
          <ul className="mt-5 flex flex-col gap-2">
            {MOCK.map((b) => (
              <li key={b.id} className="flex items-center gap-3 rounded-lg border border-border bg-bg-base p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold tabular-nums">
                    {fmt(b.fromISO)} → {fmt(b.toISO)}
                  </p>
                  <p className="mt-0.5 text-[13px] text-text-secondary">
                    {t(b.reason === "vacation" ? "reasonVacation" : b.reason === "training" ? "reasonTraining" : "reasonOther")}
                  </p>
                </div>
                <button type="button" aria-label={tCommon("delete")} className="inline-flex h-10 w-10 items-center justify-center rounded-sm border-[1.5px] border-danger bg-bg-base text-danger">
                  <Trash2 size={16} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}

        {!adding && MOCK.length > 0 && (
          <a href="?add=1" className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border-strong text-[16px] font-semibold text-brand">
            <Plus size={18} aria-hidden /> {t("addBlock")}
          </a>
        )}

        {adding && (
          <form action={addBlock} className="mt-5 flex flex-col gap-4 rounded-lg border-2 border-brand bg-bg-base p-5">
            <input type="hidden" name="locale" value={locale} />
            <h2 className="text-h3">{t("addBlock")}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="from">{t("from")}</Label>
                <input id="from" name="from" type="date" required className="block h-touch-btn w-full rounded-md border-[1.5px] border-border bg-bg-base px-4 text-body" />
              </div>
              <div>
                <Label htmlFor="to">{t("to")}</Label>
                <input id="to" name="to" type="date" required className="block h-touch-btn w-full rounded-md border-[1.5px] border-border bg-bg-base px-4 text-body" />
              </div>
            </div>
            <div>
              <Label htmlFor="reason">{t("reason")}</Label>
              <select id="reason" name="reason" required className="block h-touch-btn w-full rounded-md border-[1.5px] border-border bg-bg-base px-4 text-body">
                <option value="vacation">{t("reasonVacation")}</option>
                <option value="training">{t("reasonTraining")}</option>
                <option value="other">{t("reasonOther")}</option>
              </select>
            </div>
            <Button type="submit" variant="primary" block size="md">{tCommon("save")}</Button>
          </form>
        )}
      </main>
    </>
  );
}
