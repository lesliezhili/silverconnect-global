import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getCurrentUser } from "@/lib/auth/server";
import { registerOrganization } from "@/lib/organizations/actions";
import { COUNTRIES } from "@/lib/regions/config";

export const dynamic = "force-dynamic";

const AU_REGIONS = COUNTRIES.AU.regions;

async function requireSignedInUser(locale: string) {
  const user = await getCurrentUser();
  if (!user) {
    nextRedirect(`/${locale}/auth/login?next=/${locale}/register/day-care-centre`);
  }
  return user;
}

async function submitOrganization(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const me = await requireSignedInUser(locale);

  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const result = await registerOrganization({
    ownerUserId: me.id,
    name: String(formData.get("name") ?? ""),
    abn: String(formData.get("abn") ?? ""),
    addressLine: String(formData.get("addressLine") ?? ""),
    region: String(formData.get("region") ?? ""),
    contactPhone: String(formData.get("contactPhone") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    capacity: capacityRaw ? Number(capacityRaw) : undefined,
    operatingHours: String(formData.get("operatingHours") ?? ""),
    description: String(formData.get("description") ?? ""),
  });

  if (!result.success) {
    nextRedirect(
      `/${locale}/register/day-care-centre?error=${encodeURIComponent(result.error || "unknown")}`,
    );
  }
  nextRedirect(`/${locale}/register/day-care-centre?submitted=1`);
}

export default async function DayCareCentreRegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { submitted, error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("organization");
  const me = await requireSignedInUser(locale);

  return (
    <>
      <Header signedIn back />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-5 sm:pb-12"
      >
        <h1 className="text-elder-heading font-extrabold">{t("registerTitle")}</h1>
        <p className="mt-2 text-body text-text-secondary">{t("registerSubtitle")}</p>

        {submitted === "1" ? (
          <div className="mt-8 rounded-xl border border-border bg-bg-base p-6 text-center">
            <p className="text-h3 font-bold text-brand">{t("submittedTitle")}</p>
            <p className="mt-2 text-body text-text-secondary">{t("submittedBody")}</p>
          </div>
        ) : (
          <form action={submitOrganization} className="mt-6 flex flex-col gap-5">
            <input type="hidden" name="locale" value={locale} />

            {error && (
              <p className="rounded-md border border-danger bg-danger/10 px-4 py-3 text-body text-danger">
                {error}
              </p>
            )}

            <div>
              <Label htmlFor="name">{t("fieldName")}</Label>
              <Input id="name" name="name" required />
            </div>

            <div>
              <Label htmlFor="abn">{t("fieldAbn")}</Label>
              <Input id="abn" name="abn" required placeholder="11 digits" />
            </div>

            <div>
              <Label htmlFor="addressLine">{t("fieldAddress")}</Label>
              <Input id="addressLine" name="addressLine" required />
            </div>

            <div>
              <Label htmlFor="region">{t("fieldRegion")}</Label>
              <select
                id="region"
                name="region"
                required
                className="block w-full min-h-touch-btn rounded-md bg-bg-base px-4 text-body text-text-primary border-[1.5px] border-border focus:border-brand focus:outline-none"
              >
                <option value="">{t("fieldRegionPlaceholder")}</option>
                {AU_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="contactPhone">{t("fieldContactPhone")}</Label>
              <Input id="contactPhone" name="contactPhone" type="tel" required />
            </div>

            <div>
              <Label htmlFor="contactEmail">{t("fieldContactEmail")}</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                required
                defaultValue={me?.email}
              />
            </div>

            <div>
              <Label htmlFor="capacity">{t("fieldCapacity")}</Label>
              <Input id="capacity" name="capacity" type="number" min={1} />
            </div>

            <div>
              <Label htmlFor="operatingHours">{t("fieldOperatingHours")}</Label>
              <Input
                id="operatingHours"
                name="operatingHours"
                placeholder="Mon–Fri 9am–5pm"
              />
            </div>

            <div>
              <Label htmlFor="description">{t("fieldDescription")}</Label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="block w-full rounded-md bg-bg-base px-4 py-3 text-body text-text-primary border-[1.5px] border-border focus:border-brand focus:outline-none"
              />
            </div>

            <label className="flex items-start gap-3 text-body text-text-secondary">
              <input type="checkbox" name="agreeTerms" required className="mt-1" />
              {t("fieldAgreeTerms")}
            </label>

            <Button type="submit" size="lg" block>
              {t("submitButton")}
            </Button>
          </form>
        )}
      </main>
    </>
  );
}
