import { setRequestLocale, getTranslations } from "next-intl/server";
import { PhoneCall, Plus, Trash2, ShieldAlert } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";
import { EmptyState } from "@/components/domain/PageStates";

interface Contact {
  id: string;
  name: string;
  phone: string;
  relKey: "relDaughter" | "relSpouse" | "relSibling" | "relFriend" | "relOther";
  isPrimary: boolean;
}

const SAMPLE: Contact[] = [
  { id: "e1", name: "Sarah Wang", phone: "+61 412 345 678", relKey: "relDaughter", isPrimary: true },
  { id: "e2", name: "David Chen", phone: "+61 423 456 789", relKey: "relFriend", isPrimary: false },
];

export default async function EmergencyContactsPage({
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
  const t = await getTranslations("emergencyContacts");
  const tCommon = await getTranslations("common");
  const adding = sp.add === "1";
  const empty = sp.state === "empty";
  const items = empty ? [] : SAMPLE;

  return (
    <>
      <Header
        country={country}
        back
        signedIn={session.signedIn}
        initials={session.initials}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12"
      >
        <h1 className="text-h2">{t("title")}</h1>
        <p className="mt-1 text-[15px] text-text-secondary">{t("sub")}</p>

        {items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              illustration={ShieldAlert as never}
              title={t("empty")}
              hint={t("emptyHint")}
              cta={
                <a
                  href="?add=1"
                  className="inline-flex h-14 items-center justify-center rounded-md bg-brand px-7 text-[17px] font-bold text-white"
                >
                  {t("addContact")}
                </a>
              }
            />
          </div>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {items.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-border bg-bg-base p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger"
                  >
                    <PhoneCall size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[16px] font-bold">{c.name}</p>
                      {c.isPrimary && (
                        <span className="inline-flex h-6 items-center rounded-sm bg-danger-soft px-2 text-[12px] font-semibold text-danger">
                          {t("primary")}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[14px] text-text-secondary">
                      {t(c.relKey)} · <span className="tabular-nums">{c.phone}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!c.isPrimary && (
                    <button
                      type="button"
                      className="inline-flex h-10 items-center rounded-sm border-[1.5px] border-border-strong bg-bg-base px-3 text-[14px] font-semibold text-text-primary"
                    >
                      {t("setPrimary")}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={t("delete")}
                    className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-sm border-[1.5px] border-danger bg-bg-base text-danger"
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!adding && items.length > 0 && (
          <a
            href="?add=1"
            className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border-strong text-[16px] font-semibold text-brand"
          >
            <Plus size={20} aria-hidden /> {t("addContact")}
          </a>
        )}

        {adding && (
          <form
            action="/profile/emergency"
            method="get"
            className="mt-5 flex flex-col gap-4 rounded-lg border-2 border-brand bg-bg-base p-5"
          >
            <h2 className="text-h3">{t("addContact")}</h2>
            <div>
              <Label htmlFor="name">{t("name")}</Label>
              <Input id="name" name="name" autoComplete="name" required />
            </div>
            <div>
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+61 412 345 678"
                required
              />
            </div>
            <div>
              <Label htmlFor="relationship">{t("relationship")}</Label>
              <select
                id="relationship"
                name="relationship"
                required
                className="block h-touch-btn w-full rounded-md border-[1.5px] border-border bg-bg-base px-4 text-body text-text-primary focus:border-brand focus:outline-none"
              >
                <option value="daughter">{t("relDaughter")}</option>
                <option value="spouse">{t("relSpouse")}</option>
                <option value="sibling">{t("relSibling")}</option>
                <option value="friend">{t("relFriend")}</option>
                <option value="other">{t("relOther")}</option>
              </select>
            </div>
            <Button type="submit" variant="primary" block size="md">
              {tCommon("save")}
            </Button>
          </form>
        )}
      </main>
    </>
  );
}
