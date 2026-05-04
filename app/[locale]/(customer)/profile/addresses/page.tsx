import { setRequestLocale, getTranslations } from "next-intl/server";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";
import { EmptyState } from "@/components/domain/PageStates";

interface Address {
  id: string;
  label: string;
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  isDefault: boolean;
}

const SAMPLE: Address[] = [
  {
    id: "a1",
    label: "labelHome",
    street: "12 Park Ave",
    suburb: "Sydney",
    state: "NSW",
    postcode: "2000",
    isDefault: true,
  },
  {
    id: "a2",
    label: "labelMum",
    street: "8 Mill St",
    suburb: "Sydney",
    state: "NSW",
    postcode: "2000",
    isDefault: false,
  },
];

export default async function AddressesPage({
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
  const t = await getTranslations("addresses");
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

        {items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              illustration={MapPin as never}
              title={t("empty")}
              hint={t("emptyHint")}
              cta={
                <a
                  href="?add=1"
                  className="inline-flex h-14 items-center justify-center rounded-md bg-brand px-7 text-[17px] font-bold text-white"
                >
                  {t("addNew")}
                </a>
              }
            />
          </div>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {items.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-border bg-bg-base p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand"
                  >
                    <MapPin size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[16px] font-bold">
                        {t(a.label as Parameters<typeof t>[0])}
                      </p>
                      {a.isDefault && (
                        <span className="inline-flex h-6 items-center rounded-sm bg-success-soft px-2 text-[12px] font-semibold text-success">
                          {t("default")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[14px] text-text-secondary">
                      {a.street}, {a.suburb} {a.state} {a.postcode}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex h-10 items-center gap-1.5 rounded-sm border-[1.5px] border-border-strong bg-bg-base px-3 text-[14px] font-semibold text-text-primary"
                  >
                    <Pencil size={14} aria-hidden /> {t("edit")}
                  </button>
                  {!a.isDefault && (
                    <button
                      type="button"
                      className="inline-flex h-10 items-center rounded-sm border-[1.5px] border-border-strong bg-bg-base px-3 text-[14px] font-semibold text-text-primary"
                    >
                      {t("setDefault")}
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
            <Plus size={20} aria-hidden /> {t("addNew")}
          </a>
        )}

        {adding && (
          <form
            action="/profile/addresses"
            method="get"
            className="mt-5 flex flex-col gap-4 rounded-lg border-2 border-brand bg-bg-base p-5"
          >
            <h2 className="text-h3">{t("addNew")}</h2>
            <div>
              <Label htmlFor="label">{t("label")}</Label>
              <Input id="label" name="label" defaultValue={t("labelHome")} required />
            </div>
            <div>
              <Label htmlFor="street">{t("addressLine")}</Label>
              <Input id="street" name="street" autoComplete="street-address" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="suburb">{t("suburb")}</Label>
                <Input id="suburb" name="suburb" autoComplete="address-level2" required />
              </div>
              <div>
                <Label htmlFor="state">{t("state")}</Label>
                <Input id="state" name="state" autoComplete="address-level1" required />
              </div>
            </div>
            <div>
              <Label htmlFor="postcode">{t("postcode")}</Label>
              <Input id="postcode" name="postcode" autoComplete="postal-code" inputMode="numeric" required />
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
