import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { eq, and, inArray } from "drizzle-orm";
import { Upload, MapPin, Check } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getCountry } from "@/components/domain/countryCookie";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import {
  providerProfiles,
  providerCategories,
  providerAvailability,
} from "@/lib/db/schema/providers";
import { getCurrentUser, signInUser } from "@/lib/auth/server";

const TOTAL_STEPS = 5;
const STEPS = [1, 2, 3, 4, 5] as const;
const TITLE_KEYS = [
  "registerStep1",
  "registerStep2",
  "registerStep3",
  "registerStep4",
  "registerStep5",
] as const;

const CATEGORY_KEYS = [
  "cleaning",
  "cooking",
  "garden",
  "personalCare",
  "repair",
] as const;
type CategoryKey = (typeof CATEGORY_KEYS)[number];

const SLOT_KEYS = ["morning", "afternoon", "evening"] as const;
type SlotKey = (typeof SLOT_KEYS)[number];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DAY_KEYS = {
  Mon: "weekMon",
  Tue: "weekTue",
  Wed: "weekWed",
  Thu: "weekThu",
  Fri: "weekFri",
  Sat: "weekSat",
  Sun: "weekSun",
} as const;
function dayIndex(label: (typeof DAY_LABELS)[number]): number {
  return DAY_LABELS.indexOf(label) + 1; // ISO: Mon=1..Sun=7
}

async function ensureDraft(userId: string) {
  const rows = await db
    .select()
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, userId))
    .limit(1);
  if (rows[0]) return rows[0];
  const [created] = await db
    .insert(providerProfiles)
    .values({ userId, onboardingStatus: "pending" })
    .returning();
  return created!;
}

async function requireSignedInUser(locale: string) {
  const user = await getCurrentUser();
  if (!user) {
    nextRedirect(`/${locale}/auth/login`);
  }
  return user;
}

async function saveStep1(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const me = await requireSignedInUser(locale);
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  if (!name || !phone || !address) {
    nextRedirect(`/${locale}/provider/register?step=1&error=required`);
  }
  await db
    .update(users)
    .set({ name, phone, updatedAt: new Date() })
    .where(eq(users.id, me.id));
  const draft = await ensureDraft(me.id);
  await db
    .update(providerProfiles)
    .set({ addressLine: address, bio: bio || null, updatedAt: new Date() })
    .where(eq(providerProfiles.id, draft.id));
  nextRedirect(`/${locale}/provider/register?step=2`);
}

async function saveStep2(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  await requireSignedInUser(locale);
  // Document file storage is deferred to a later phase (no Supabase
  // Storage bucket wired). Provider keeps moving through the wizard;
  // they can re-upload from /provider/compliance once Storage is live.
  nextRedirect(`/${locale}/provider/register?step=3`);
}

async function saveStep3(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const me = await requireSignedInUser(locale);
  const radiusRaw = Number(formData.get("radius") ?? 0);
  const radius =
    Number.isFinite(radiusRaw) && radiusRaw > 0 && radiusRaw <= 50
      ? Math.round(radiusRaw)
      : 10;
  const categories = formData
    .getAll("categories")
    .map(String)
    .filter((c): c is CategoryKey => CATEGORY_KEYS.includes(c as CategoryKey));
  if (categories.length === 0) {
    nextRedirect(`/${locale}/provider/register?step=3&error=noCategory`);
  }
  const draft = await ensureDraft(me.id);
  await db
    .update(providerProfiles)
    .set({ serviceRadiusKm: radius, updatedAt: new Date() })
    .where(eq(providerProfiles.id, draft.id));
  await db
    .delete(providerCategories)
    .where(eq(providerCategories.providerId, draft.id));
  if (categories.length > 0) {
    await db
      .insert(providerCategories)
      .values(categories.map((c) => ({ providerId: draft.id, category: c })));
  }
  nextRedirect(`/${locale}/provider/register?step=4`);
}

async function saveStep4(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const me = await requireSignedInUser(locale);
  const draft = await ensureDraft(me.id);

  type Row = { providerId: string; dayOfWeek: number; slot: SlotKey };
  const rows: Row[] = [];
  for (const day of DAY_LABELS) {
    const slots = formData
      .getAll(`avail_${day}`)
      .map(String)
      .filter((s): s is SlotKey => SLOT_KEYS.includes(s as SlotKey));
    for (const slot of slots) {
      rows.push({ providerId: draft.id, dayOfWeek: dayIndex(day), slot });
    }
  }

  await db
    .delete(providerAvailability)
    .where(eq(providerAvailability.providerId, draft.id));
  if (rows.length > 0) {
    await db.insert(providerAvailability).values(rows);
  }
  nextRedirect(`/${locale}/provider/register?step=5`);
}

async function finishWizard(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const me = await requireSignedInUser(locale);
  const draft = await ensureDraft(me.id);

  await db
    .update(providerProfiles)
    .set({
      onboardingStatus: "docs_review",
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(providerProfiles.id, draft.id));
  await db
    .update(users)
    .set({ role: "provider", updatedAt: new Date() })
    .where(eq(users.id, me.id));
  // Re-issue session with provider role so /provider/* unlocks immediately.
  await signInUser({
    id: me.id,
    email: me.email,
    name: me.name,
    role: "provider",
  });
  nextRedirect(`/${locale}/provider/onboarding-status`);
}

interface DraftSnapshot {
  bio: string;
  addressLine: string;
  serviceRadiusKm: number;
  categories: Set<CategoryKey>;
  availability: Set<string>; // `${day}|${slot}`
  name: string;
  phone: string;
}

async function loadDraft(userId: string): Promise<DraftSnapshot> {
  const [u] = await db
    .select({ name: users.name, phone: users.phone })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const draftRow = await db
    .select()
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, userId))
    .limit(1);
  const draft = draftRow[0];
  if (!draft) {
    return {
      bio: "",
      addressLine: "",
      serviceRadiusKm: 10,
      categories: new Set(),
      availability: new Set(),
      name: u?.name ?? "",
      phone: u?.phone ?? "",
    };
  }
  const [cats, avails] = await Promise.all([
    db
      .select({ category: providerCategories.category })
      .from(providerCategories)
      .where(eq(providerCategories.providerId, draft.id)),
    db
      .select({
        dayOfWeek: providerAvailability.dayOfWeek,
        slot: providerAvailability.slot,
      })
      .from(providerAvailability)
      .where(eq(providerAvailability.providerId, draft.id)),
  ]);
  return {
    bio: draft.bio ?? "",
    addressLine: draft.addressLine ?? "",
    serviceRadiusKm: draft.serviceRadiusKm,
    categories: new Set(cats.map((r) => r.category as CategoryKey)),
    availability: new Set(
      avails.map((a) => `${a.dayOfWeek}|${a.slot}`),
    ),
    name: u?.name ?? "",
    phone: u?.phone ?? "",
  };
}

function parseStep(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isFinite(n) && n >= 1 && n <= TOTAL_STEPS ? n : 1;
}

export default async function ProviderRegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const me = await getCurrentUser();
  if (!me) {
    nextRedirect(`/${locale}/auth/login`);
  }
  const country = await getCountry();
  const t = await getTranslations("provider");
  const tCommon = await getTranslations("common");
  const tCategories = await getTranslations("categories");
  const step = parseStep(sp.step);
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const errorMsg =
    error === "required"
      ? t("errorAllRequired")
      : error === "noCategory"
      ? t("errorPickCategory")
      : null;

  const draft = await loadDraft(me.id);

  const prevHref = step > 1 ? `?step=${step - 1}` : "/home";
  const action =
    step === 1
      ? saveStep1
      : step === 2
      ? saveStep2
      : step === 3
      ? saveStep3
      : step === 4
      ? saveStep4
      : finishWizard;

  return (
    <>
      <Header
        country={country}
        back
        signedIn={true}
        initials={me.initials}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-12 pt-6"
      >
        <h1 className="text-h2">{t("registerTitle")}</h1>
        <p className="mt-1 text-[14px] text-text-tertiary">
          {t("registerStep", { n: step })} · {t(TITLE_KEYS[step - 1])}
        </p>

        <ol
          aria-label={t("registerStep", { n: step })}
          className="mt-4 flex gap-2"
        >
          {STEPS.map((s) => (
            <li
              key={s}
              aria-current={s === step ? "step" : undefined}
              className={
                "h-1.5 flex-1 rounded-full " +
                (s < step
                  ? "bg-success"
                  : s === step
                  ? "bg-brand"
                  : "bg-border-strong")
              }
            />
          ))}
        </ol>

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 rounded-md border-[1.5px] border-danger bg-danger-soft px-3.5 py-3 text-[14px] font-semibold text-danger"
          >
            {errorMsg}
          </div>
        )}

        <form action={action} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />
          {step === 1 && <Step1 t={t} draft={draft} />}
          {step === 2 && <Step2 t={t} country={country} />}
          {step === 3 && (
            <Step3
              t={t}
              tCategories={tCategories}
              country={country}
              draft={draft}
            />
          )}
          {step === 4 && <Step4 t={t} draft={draft} />}
          {step === 5 && <Step5 t={t} />}

          <div className="mt-4 flex items-center gap-3">
            <Link
              href={prevHref}
              className="inline-flex h-12 items-center rounded-md border-[1.5px] border-border-strong bg-bg-base px-5 text-[15px] font-semibold text-text-primary"
            >
              {tCommon("back")}
            </Link>
            <div className="flex-1" />
            <Button type="submit" variant="primary" size="md">
              {step < TOTAL_STEPS ? t("registerNext") : t("registerSubmit")}
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}

type T = Awaited<ReturnType<typeof getTranslations<"provider">>>;

function Step1({ t, draft }: { t: T; draft: DraftSnapshot }) {
  return (
    <>
      <div>
        <Label htmlFor="name">{t("rName")}</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          defaultValue={draft.name}
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">{t("rPhone")}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={draft.phone}
          required
        />
      </div>
      <div>
        <Label htmlFor="address">{t("rAddress")}</Label>
        <Input
          id="address"
          name="address"
          autoComplete="street-address"
          defaultValue={draft.addressLine}
          required
        />
      </div>
      <div>
        <Label htmlFor="bio">{t("rBio")}</Label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={draft.bio}
          aria-describedby="bio-hint"
          className="block w-full rounded-md border-[1.5px] border-border-strong bg-bg-base p-3.5 text-[16px] text-text-primary focus:border-brand focus:outline-none"
        />
        <p id="bio-hint" className="mt-1.5 text-[13px] text-text-tertiary">
          {t("rBioHint")}
        </p>
      </div>
    </>
  );
}

function Step2({ t, country }: { t: T; country: string }) {
  const docs = [
    { key: "police" as const, labelKey: "docPolice" as const, optional: false },
    { key: "firstAid" as const, labelKey: "docFirstAid" as const, optional: false },
    {
      key: "insurance" as const,
      labelKey: "docInsurance" as const,
      optional: country === "CN",
    },
  ];
  return (
    <ul className="flex flex-col gap-3">
      {docs.map((d) => (
        <li
          key={d.key}
          className="flex items-center gap-3 rounded-lg border border-border bg-bg-base p-4"
        >
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand"
          >
            <Upload size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold">{t(d.labelKey)}</p>
            {d.optional && (
              <p className="mt-0.5 text-[12px] text-text-tertiary">
                {t("docOptional")}
              </p>
            )}
          </div>
          <label className="inline-flex h-10 items-center rounded-sm border-[1.5px] border-border-strong bg-bg-base px-3 text-[13px] font-semibold text-text-primary">
            {t("docUpload")}
            <input type="file" accept="image/*,application/pdf" className="sr-only" />
          </label>
        </li>
      ))}
    </ul>
  );
}

function Step3({
  t,
  tCategories,
  country,
  draft,
}: {
  t: T;
  tCategories: Awaited<ReturnType<typeof getTranslations<"categories">>>;
  country: string;
  draft: DraftSnapshot;
}) {
  const cats: readonly CategoryKey[] = CATEGORY_KEYS;
  const defaultRadius = String(
    draft.serviceRadiusKm || (country === "CN" ? 10 : 15),
  );
  return (
    <>
      <div className="rounded-lg border border-border bg-bg-base p-4">
        <p className="flex items-center gap-2 text-[15px] font-bold">
          <MapPin size={18} className="text-brand" aria-hidden />
          {t("serviceArea")}
        </p>
        <p className="mt-1 text-[13px] text-text-secondary">{t("serviceAreaHint")}</p>
        <div className="mt-3 flex h-36 items-center justify-center rounded-md bg-bg-surface-2 text-[13px] text-text-tertiary">
          {t("mapPlaceholder")}
        </div>
        <div className="mt-3">
          <Label htmlFor="radius">{t("radius")}</Label>
          <Input
            id="radius"
            name="radius"
            type="number"
            min={1}
            max={50}
            defaultValue={defaultRadius}
            inputMode="numeric"
            required
          />
        </div>
      </div>

      <fieldset>
        <legend className="text-[15px] font-bold">{t("serviceCategories")}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {cats.map((c) => (
            <label
              key={c}
              className="inline-flex cursor-pointer items-center gap-1 rounded-pill border-[1.5px] border-border-strong bg-bg-base px-4 py-2 text-[14px] font-semibold text-text-primary has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand"
            >
              <input
                type="checkbox"
                name="categories"
                value={c}
                defaultChecked={draft.categories.has(c)}
                className="sr-only"
              />
              {tCategories(c)}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}

function Step4({ t, draft }: { t: T; draft: DraftSnapshot }) {
  return (
    <>
      <p className="text-[14px] text-text-secondary">{t("availabilityHint")}</p>
      <ul className="mt-2 flex flex-col gap-2">
        {DAY_LABELS.map((d) => {
          const dIdx = dayIndex(d);
          return (
            <li
              key={d}
              className="grid grid-cols-[60px_1fr] items-center gap-3 rounded-lg border border-border bg-bg-base p-3"
            >
              <span className="text-[15px] font-bold">{t(DAY_KEYS[d])}</span>
              <div className="grid grid-cols-3 gap-2">
                {SLOT_KEYS.map((s) => (
                  <label
                    key={s}
                    className="inline-flex cursor-pointer items-center justify-center rounded-sm border-[1.5px] border-border-strong bg-bg-base px-2 py-2 text-[13px] font-semibold text-text-primary has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand"
                  >
                    <input
                      type="checkbox"
                      name={`avail_${d}`}
                      value={s}
                      defaultChecked={draft.availability.has(`${dIdx}|${s}`)}
                      className="sr-only"
                    />
                    {t(s)}
                  </label>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Step5({ t }: { t: T }) {
  return (
    <div className="rounded-lg border border-border bg-bg-base p-5">
      <p className="text-[15px] text-text-secondary">{t("stripeHint")}</p>
      <button
        type="button"
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#635BFF] px-5 text-[15px] font-bold text-white"
      >
        <Check size={18} aria-hidden />
        {t("stripeConnect")}
      </button>
    </div>
  );
}
