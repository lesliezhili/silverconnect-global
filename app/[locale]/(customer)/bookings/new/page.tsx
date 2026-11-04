import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { after } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { BookingProgress } from "@/components/domain/BookingProgress";
import { CURRENCY_SYMBOL } from "@/components/domain/country";
import type { CountryCode } from "@/components/domain/country";
import { getCountry } from "@/components/domain/countryCookie";
import { db } from "@/lib/db";
import { services } from "@/lib/db/schema/services";
import { providerProfiles } from "@/lib/db/schema/providers";
import { users } from "@/lib/db/schema/users";
import { addresses } from "@/lib/db/schema/customer-data";
import { bookings, bookingChanges } from "@/lib/db/schema/bookings";
import { getCurrentUser } from "@/lib/auth/server";
import { getAuthSession, type BookingDraft } from "@/lib/auth/session";
import { notify } from "@/lib/notifications/server";
import {
  RELEASE_CATEGORIES,
  RELEASE_SUBTYPES,
  findLiveArea,
  isReleaseCategory,
  isReleaseCountry,
  liveAreasFor,
  type ReleaseCategory,
  type ReleaseCountry,
} from "@/lib/release";
import {
  EFFORT_TIERS,
  TIER,
  TIER_SCOPE,
  TIER_SERVICE_CODE,
  isEffortTier,
  priceFor,
  type EffortTier,
} from "@/lib/release-pricing";
import { priceReleaseBooking } from "@/lib/bookings/release-booking";
import { customerPauseReason, eligibleProviders, isProviderEligible } from "@/lib/trust";
import { isStripeConfigured } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

/**
 * Release 1 booking — the only customer booking flow:
 *   1. service: category × effort tier (standard price model) [+ handyman job]
 *   2. provider (trust-gated) + time
 *   3. address inside a live area
 *   4. review → create pending booking → /pay/[id] (Stripe)
 * Price is always computed server-side by priceReleaseBooking().
 */

type Step = 1 | 2 | 3 | 4;

const CAT_EMOJI: Record<ReleaseCategory, string> = { cleaning: "🧹", garden: "🌿", repair: "🔧" };

const JOB_TYPES: Record<string, { en: string; zh: string }> = {
  furniture: { en: "Furniture assembly", zh: "家具组装" },
  hanging: { en: "Pictures & shelves", zh: "挂画装架" },
  door: { en: "Door handle / hinge", zh: "门把 / 合页" },
  window: { en: "Window latch / screen", zh: "窗锁 / 纱窗" },
  curtain: { en: "Curtains & blinds", zh: "窗帘和百叶" },
  small_fix: { en: "Other small fix", zh: "其他小修" },
};

function clampStep(raw: string | undefined): Step {
  const n = Number.parseInt(raw ?? "1", 10);
  return (Math.min(Math.max(Number.isNaN(n) ? 1 : n, 1), 4) as Step) || 1;
}

async function readDraft(): Promise<BookingDraft> {
  const s = await getAuthSession();
  return s.bookingDraft ?? {};
}

async function writeDraft(patch: Partial<BookingDraft>): Promise<void> {
  const s = await getAuthSession();
  s.bookingDraft = { ...(s.bookingDraft ?? {}), ...patch };
  await s.save();
}

async function clearDraft(): Promise<void> {
  const s = await getAuthSession();
  s.bookingDraft = undefined;
  await s.save();
}

async function serviceIdFor(category: ReleaseCategory, tier: EffortTier): Promise<string | null> {
  const [svc] = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.code, TIER_SERVICE_CODE[category][tier]), eq(services.enabled, true)))
    .limit(1);
  return svc?.id ?? null;
}

async function saveStep1(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);
  if (await customerPauseReason(me.id)) nextRedirect(`/${locale}/bookings/new?step=1&error=paused`);

  const [category, tier] = String(formData.get("choice") ?? "").split(":");
  if (!isReleaseCategory(category) || !isEffortTier(tier)) {
    nextRedirect(`/${locale}/bookings/new?step=1&error=pickService`);
  }
  const jobType = String(formData.get("jobType") ?? "");
  if (category === "repair" && !RELEASE_SUBTYPES.repair.includes(jobType)) {
    nextRedirect(`/${locale}/bookings/new?step=1&cat=repair&error=pickJob`);
  }
  const serviceId = await serviceIdFor(category, tier);
  if (!serviceId) nextRedirect(`/${locale}/bookings/new?step=1&error=invalid`);

  const keepProvider = String(formData.get("providerId") ?? "") || undefined;
  await writeDraft({
    serviceId,
    category,
    tier,
    jobType: category === "repair" ? jobType : undefined,
    providerId: keepProvider,
  });
  nextRedirect(`/${locale}/bookings/new?step=2`);
}

async function saveStep2(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);
  const draft = await readDraft();
  if (!draft.serviceId || !draft.category) {
    nextRedirect(`/${locale}/bookings/new?step=1&error=missingService`);
  }
  const providerId = String(formData.get("providerId") ?? "");
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "");
  const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : null;
  if (
    !providerId ||
    !scheduledAt ||
    Number.isNaN(scheduledAt.getTime()) ||
    scheduledAt.getTime() < Date.now() + 60 * 60 * 1000
  ) {
    nextRedirect(`/${locale}/bookings/new?step=2&error=pick`);
  }
  if (!(await isProviderEligible(providerId, draft.category!, me.id))) {
    nextRedirect(`/${locale}/bookings/new?step=2&error=invalid`);
  }
  await writeDraft({ providerId, scheduledAt: scheduledAt.toISOString() });
  nextRedirect(`/${locale}/bookings/new?step=3`);
}

async function saveStep3(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);
  const addressId = String(formData.get("addressId") ?? "");
  if (!addressId) {
    nextRedirect(`/${locale}/bookings/new?step=3&error=pickAddress`);
  }
  const [a] = await db
    .select({ id: addresses.id, country: addresses.country, postcode: addresses.postcode })
    .from(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, me.id)))
    .limit(1);
  if (!a) nextRedirect(`/${locale}/bookings/new?step=3&error=invalid`);
  if (!findLiveArea(a.country, a.postcode)) {
    nextRedirect(`/${locale}/bookings/new?step=3&error=outsideArea`);
  }
  await writeDraft({ addressId });
  nextRedirect(`/${locale}/bookings/new?step=4`);
}

async function finalizeBooking(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);
  if (await customerPauseReason(me.id)) nextRedirect(`/${locale}/bookings/new?step=1&error=paused`);
  const draft = await readDraft();
  if (!draft.serviceId || !draft.providerId || !draft.addressId || !draft.scheduledAt || !draft.category || !draft.tier) {
    nextRedirect(`/${locale}/bookings/new?step=1&error=incomplete`);
  }
  // Re-check everything server-side at the moment of booking.
  if (!(await isProviderEligible(draft.providerId!, draft.category!, me.id))) {
    nextRedirect(`/${locale}/bookings/new?step=2&error=invalid`);
  }
  const [addr] = await db
    .select({ country: addresses.country, postcode: addresses.postcode })
    .from(addresses)
    .where(and(eq(addresses.id, draft.addressId!), eq(addresses.userId, me.id)))
    .limit(1);
  const price = await priceReleaseBooking({
    customerId: me.id,
    providerId: draft.providerId!,
    category: draft.category,
    tier: draft.tier,
    address: addr ?? null,
  });
  if (!price) nextRedirect(`/${locale}/bookings/new?step=3&error=outsideArea`);
  const serviceId = (await serviceIdFor(draft.category as ReleaseCategory, price.tier)) ?? draft.serviceId!;

  let createdId = "";
  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(bookings)
      .values({
        customerId: me.id,
        providerId: draft.providerId!,
        serviceId,
        addressId: draft.addressId!,
        scheduledAt: new Date(draft.scheduledAt!),
        durationMin: Math.round(price.hours * 60),
        status: "pending",
        notes,
        basePrice: price.base.toFixed(2),
        taxAmount: price.tax.toFixed(2),
        totalPrice: price.total.toFixed(2),
        currency: price.currency,
        effortTier: price.tier,
        jobType: draft.jobType ?? null,
      })
      .returning({ id: bookings.id });
    createdId = created!.id;
    await tx.insert(bookingChanges).values({
      bookingId: createdId,
      type: "created",
      toStatus: "pending",
      actorId: me.id,
      note: `Customer booking submitted (${draft.category}/${price.tier}${price.quoteId ? `, quote ${price.quoteId}` : ""}), awaiting payment`,
    });
  });

  await clearDraft();

  after(async () => {
    const [p] = await db
      .select({ userId: providerProfiles.userId })
      .from(providerProfiles)
      .where(eq(providerProfiles.id, draft.providerId!))
      .limit(1);
    if (p?.userId) {
      await notify({
        userId: p.userId,
        kind: "booking_update",
        title: "New booking request",
        body: `Customer booking · awaiting payment · ${price.currency} ${price.total.toFixed(2)}`,
        link: `/${locale}/provider/jobs/${createdId}`,
        relatedBookingId: createdId,
      });
    }
  });

  // Real card payment through Stripe whenever it's configured; the
  // simulated /pay page only exists for local / E2E environments.
  nextRedirect(isStripeConfigured() ? `/${locale}/checkout/${createdId}` : `/${locale}/pay/${createdId}`);
}

export default async function BookingNewPage({
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
  if (!me) nextRedirect(`/${locale}/auth/login`);
  const cookieCountry = await getCountry();
  const country: ReleaseCountry = isReleaseCountry(cookieCountry) ? cookieCountry : "AU";
  const t = await getTranslations("booking");
  const tCommon = await getTranslations("common");
  const tCategories = await getTranslations("categories");
  const isZh = locale === "zh" || locale === "zh_tw";
  const step = clampStep(typeof sp.step === "string" ? sp.step : undefined);
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const draft = await readDraft();
  const sym = CURRENCY_SYMBOL[country];
  const catName = (c: string) => tCategories(c as Parameters<typeof tCategories>[0]);

  // ---- STEP 1: category × effort tier ----
  if (step === 1) {
    const paused = await customerPauseReason(me.id);
    const qCat = typeof sp.cat === "string" && isReleaseCategory(sp.cat) ? sp.cat : null;
    const cat: ReleaseCategory = qCat ?? (isReleaseCategory(draft.category) ? draft.category : "cleaning");
    const preProvider = typeof sp.providerId === "string" ? sp.providerId : draft.providerId;
    const taxRate = liveAreasFor(country)[0]?.tax.rate ?? 0;
    return (
      <Wizard step={step} country={country} initials={me.initials}>
        <h1 className="text-[22px] font-bold">{t("step1Title")}</h1>
        {paused && (
          <Alert>
            {isZh
              ? "您的账户暂时无法预约，我们的工作人员会尽快联系您。"
              : "Your account is paused from booking for now. Our team will contact you."}
          </Alert>
        )}
        {error === "pickService" && <Alert>{isZh ? "请选择一个服务" : "Pick a service"}</Alert>}
        {error === "pickJob" && <Alert>{isZh ? "请选择杂工项目" : "Pick the handyman job"}</Alert>}

        <nav className="mt-4 flex gap-2" aria-label={isZh ? "服务类别" : "Service category"}>
          {RELEASE_CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/bookings/new?step=1&cat=${c}${preProvider ? `&providerId=${preProvider}` : ""}`}
              aria-current={c === cat ? "page" : undefined}
              className={
                "flex h-14 flex-1 items-center justify-center gap-1 rounded-md border-2 text-[17px] font-bold " +
                (c === cat ? "border-brand bg-brand-soft text-brand" : "border-border bg-bg-base text-text-primary")
              }
            >
              <span aria-hidden>{CAT_EMOJI[c]}</span> {catName(c)}
            </Link>
          ))}
        </nav>

        <form action={saveStep1} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="locale" value={locale} />
          {preProvider && <input type="hidden" name="providerId" value={preProvider} />}
          <ul className="flex flex-col gap-3">
            {EFFORT_TIERS.map((tier) => {
              const p = priceFor({ country, category: cat, tier, taxRate });
              const value = `${cat}:${tier}`;
              const checked = draft.category === cat ? draft.tier === tier : tier === "regular";
              const scope = TIER_SCOPE[cat][tier];
              return (
                <li key={tier}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border-[1.5px] border-border bg-bg-base p-4 has-[:checked]:border-2 has-[:checked]:border-brand">
                    <input type="radio" name="choice" value={value} defaultChecked={checked} required className="mt-1 h-5 w-5 accent-[var(--brand-primary)]" />
                    <span className="flex-1">
                      <span className="block text-[18px] font-bold">
                        {tierLabel(tier, isZh)} · {p.hours}h
                      </span>
                      <span className="mt-1 block text-[16px] text-text-secondary">{isZh ? scope.zh : scope.en}</span>
                      <span className="mt-1 block text-[15px] text-text-tertiary">
                        {TIER[tier].fixed
                          ? isZh ? "固定价格" : "Fixed price"
                          : isZh
                            ? "首次按此价格；之后服务者可按实际用时报价，需您确认"
                            : "First visit at this price; after it the provider may quote later visits from the real time — you approve"}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-[18px] font-bold text-brand tabular-nums">
                        {sym}{p.base.toFixed(0)}
                      </span>
                      <span className="block text-[14px] text-text-tertiary tabular-nums">
                        {sym}{p.hourly}/{isZh ? "小时" : "h"}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          {cat === "repair" && (
            <div>
              <label htmlFor="jobType" className="block text-[17px] font-bold">
                {isZh ? "杂工项目" : "Handyman job"}
              </label>
              <select
                id="jobType"
                name="jobType"
                required
                defaultValue={draft.jobType ?? ""}
                className="mt-1.5 block h-touch-btn w-full rounded-md border-[1.5px] border-border bg-bg-base px-4 text-body"
              >
                <option value="" disabled>{isZh ? "请选择" : "Choose…"}</option>
                {RELEASE_SUBTYPES.repair.map((j) => (
                  <option key={j} value={j}>{isZh ? JOB_TYPES[j]?.zh : JOB_TYPES[j]?.en}</option>
                ))}
              </select>
              <p className="mt-2 rounded-md bg-warning-soft p-3 text-[15px] text-warning">
                {isZh
                  ? "仅限无需执照的小型杂工。电工、水管、燃气、砍树及屋顶/排水沟等高处作业不在服务范围内。"
                  : "Small no-licence jobs only. Electrical, plumbing, gas, tree felling and roof/gutter work are not offered."}
              </p>
            </div>
          )}

          <p className="text-[15px] text-text-tertiary">
            {isZh ? "价格不含" : "Prices exclude"} {liveAreasFor(country)[0]?.tax.abbr ?? "tax"}
          </p>
          {!paused && <Footer step={step} t={tCommon} backHref="/services" />}
        </form>
      </Wizard>
    );
  }

  // ---- STEP 2: provider (trust-gated) + datetime ----
  if (step === 2) {
    if (!draft.serviceId || !isReleaseCategory(draft.category)) {
      nextRedirect(`/${locale}/bookings/new?step=1`);
    }
    const providers = await eligibleProviders(draft.category!, me.id);
    const defaultDateTime = draft.scheduledAt?.slice(0, 16) ?? "";

    return (
      <Wizard step={step} country={country} initials={me.initials}>
        <h1 className="text-[22px] font-bold">{t("step2Title")}</h1>
        {error === "pick" && (
          <Alert>
            {isZh ? "请选择服务者并设置时间（至少 1 小时后）" : "Pick a provider and a time at least 1 hour from now"}
          </Alert>
        )}
        {error === "invalid" && (
          <Alert>{isZh ? "该服务者暂不可预约，请选择其他服务者" : "That provider isn't available — please pick another"}</Alert>
        )}
        {providers.length === 0 ? (
          <p className="mt-6 rounded-md border border-border bg-bg-base p-4 text-[16px] text-text-secondary">
            {isZh
              ? "目前没有可服务的服务者，请稍后再试。"
              : "No providers are available for this service yet — please try later."}
          </p>
        ) : (
          <form action={saveStep2} className="mt-4 flex flex-col gap-4">
            <input type="hidden" name="locale" value={locale} />
            <fieldset>
              <legend className="text-[17px] font-bold">{isZh ? "服务者" : "Provider"}</legend>
              <ul className="mt-2 flex flex-col gap-2">
                {providers.map((p, i) => {
                  const checked = draft.providerId ? draft.providerId === p.id : i === 0;
                  const dispName = p.providerName || (p.providerEmail?.split("@")[0] ?? "Provider");
                  return (
                    <li key={p.id}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-md border-[1.5px] border-border bg-bg-base p-3.5 has-[:checked]:border-2 has-[:checked]:border-brand">
                        <input type="radio" name="providerId" value={p.id} defaultChecked={checked} required className="h-5 w-5 accent-[var(--brand-primary)]" />
                        <span className="flex-1 text-[16px] font-semibold">{dispName}</span>
                        <span className="text-[16px] text-text-tertiary tabular-nums">
                          {p.reviewCount > 0 ? `★ ${p.avgRating.toFixed(1)} (${p.reviewCount})` : isZh ? "新服务者" : "New"}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
            <div>
              <label htmlFor="scheduledAt" className="block text-[17px] font-bold">
                {isZh ? "时间" : "When"}
              </label>
              <input
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                defaultValue={defaultDateTime}
                required
                className="mt-1.5 block h-touch-btn w-full rounded-md border-[1.5px] border-border bg-bg-base px-4 text-body text-text-primary focus:border-brand focus:outline-none"
              />
              <p className="mt-1.5 text-[17px] text-text-tertiary">
                {isZh ? "需在 1 小时之后预订。" : "Must be at least 1 hour from now."}
              </p>
            </div>
            <Footer step={step} t={tCommon} backHref="/bookings/new?step=1" />
          </form>
        )}
      </Wizard>
    );
  }

  // ---- STEP 3: address inside a live area ----
  if (step === 3) {
    if (!draft.serviceId || !draft.providerId || !draft.scheduledAt) {
      nextRedirect(`/${locale}/bookings/new?step=1`);
    }
    const myAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, me.id))
      .orderBy(asc(addresses.createdAt));
    return (
      <Wizard step={step} country={country} initials={me.initials}>
        <h1 className="text-[22px] font-bold">{t("step3Title")}</h1>
        {error === "pickAddress" && <Alert>{isZh ? "请选择一个地址" : "Pick an address"}</Alert>}
        {error === "outsideArea" && (
          <Alert>
            {isZh
              ? "该地址暂不在服务范围内。目前开通：墨尔本和温哥华的华人社区。"
              : "That address isn't in a service area yet. We're live in Melbourne's and Vancouver's Chinese communities."}
          </Alert>
        )}
        {myAddresses.length === 0 ? null : (
          <form action={saveStep3} className="mt-4 flex flex-col gap-3">
            <input type="hidden" name="locale" value={locale} />
            <ul className="flex flex-col gap-3">
              {myAddresses.map((a) => {
                const area = findLiveArea(a.country, a.postcode);
                const checked = draft.addressId === a.id || (!draft.addressId && a.isDefault && !!area);
                return (
                  <li key={a.id}>
                    <label
                      className={
                        "flex min-h-20 items-center gap-3 rounded-md border-[1.5px] border-border bg-bg-base p-4 has-[:checked]:border-2 has-[:checked]:border-brand " +
                        (area ? "cursor-pointer" : "opacity-60")
                      }
                    >
                      <input type="radio" name="addressId" value={a.id} defaultChecked={checked} disabled={!area} required className="h-5 w-5 accent-[var(--brand-primary)]" />
                      <span className="flex-1">
                        <span className="block text-[16px] font-bold">{a.label || (isZh ? "地址" : "Address")}</span>
                        <span className="block text-[16px] text-text-secondary">
                          {[a.line1, a.city, a.state, a.postcode].filter(Boolean).join(" ")}
                        </span>
                        {!area && (
                          <span className="mt-1 block text-[15px] text-warning">
                            {isZh ? "暂不在服务范围内" : "Not in a service area yet"}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <Footer step={step} t={tCommon} backHref="/bookings/new?step=2" />
          </form>
        )}
        <Link
          href="/profile/addresses?add=1"
          className="mt-4 inline-flex h-12 items-center rounded-md border-2 border-brand px-5 text-[17px] font-bold text-brand"
        >
          {isZh ? "新增地址" : "Add address"}
        </Link>
      </Wizard>
    );
  }

  // ---- STEP 4: review + pay ----
  if (!draft.serviceId || !draft.providerId || !draft.addressId || !draft.scheduledAt) {
    nextRedirect(`/${locale}/bookings/new?step=1`);
  }
  const [providerRow] = await db
    .select({ id: providerProfiles.id, name: users.name, email: users.email })
    .from(providerProfiles)
    .leftJoin(users, eq(users.id, providerProfiles.userId))
    .where(eq(providerProfiles.id, draft.providerId!))
    .limit(1);
  const [addressRow] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, draft.addressId!), eq(addresses.userId, me.id)))
    .limit(1);
  const price = await priceReleaseBooking({
    customerId: me.id,
    providerId: draft.providerId!,
    category: draft.category,
    tier: draft.tier,
    address: addressRow ?? null,
  });
  if (!price) nextRedirect(`/${locale}/bookings/new?step=3&error=outsideArea`);
  const psym = CURRENCY_SYMBOL[price.area.country];
  const sched = new Date(draft.scheduledAt!);

  return (
    <Wizard step={step} country={price.area.country} initials={me.initials}>
      <h1 className="text-[22px] font-bold">{t("step4Title")}</h1>
      <section className="mt-4 rounded-lg border border-border bg-bg-base p-4 text-[16px]">
        <Row
          label={isZh ? "服务" : "Service"}
          value={`${catName(draft.category!)} · ${tierLabel(price.tier, isZh)} · ${price.hours}h${
            draft.jobType ? ` · ${isZh ? JOB_TYPES[draft.jobType]?.zh : JOB_TYPES[draft.jobType]?.en}` : ""
          }`}
        />
        <Row label={isZh ? "服务者" : "Provider"} value={providerRow?.name || providerRow?.email?.split("@")[0] || "—"} />
        <Row
          label={isZh ? "时间" : "When"}
          value={sched.toLocaleString(isZh ? "zh-CN" : "en-AU", {
            weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        />
        <Row
          label={isZh ? "地址" : "Address"}
          value={addressRow ? [addressRow.line1, addressRow.city, addressRow.state, addressRow.postcode].filter(Boolean).join(" ") : "—"}
        />
      </section>
      {price.quoteId && (
        <p className="mt-3 rounded-md bg-brand-soft px-3.5 py-3 text-[16px] text-brand">
          {isZh ? "✅ 已按您确认的报价计价" : "✅ Priced from the quote you approved"}
        </p>
      )}
      <section className="mt-3 rounded-lg border border-border bg-bg-base p-4">
        <div className="flex justify-between text-[16px] text-text-secondary">
          <span>{price.hours}h × {psym}{price.hourly}</span>
          <span className="tabular-nums">{psym}{price.base.toFixed(2)}</span>
        </div>
        <div className="mt-1.5 flex justify-between text-[16px] text-text-secondary">
          <span>{price.taxLabel}</span>
          <span className="tabular-nums">{psym}{price.tax.toFixed(2)}</span>
        </div>
        <div className="mt-2.5 flex justify-between border-t border-border pt-2.5 text-[18px] font-extrabold">
          <span>{isZh ? "合计" : "Total"}</span>
          <span className="text-brand tabular-nums">{psym}{price.total.toFixed(2)} {price.currency}</span>
        </div>
      </section>
      <ul className="mt-3 flex flex-col gap-1.5 rounded-md bg-bg-base px-3.5 py-3 text-[15px] text-text-secondary">
        <li>📸 {isZh ? "服务者须拍摄服务前后照片/视频，您确认满意后才放款。" : "Your provider must take before & after photos/video; payment is released only after you confirm."}</li>
        <li>ℹ️ {isZh ? "取消政策：" : "Cancellation: "}<Link href="/cancellation-policy" className="underline">{isZh ? "查看详情" : "see policy"}</Link></li>
      </ul>
      <form action={finalizeBooking} className="mt-4 flex flex-col gap-3">
        <input type="hidden" name="locale" value={locale} />
        <div>
          <label htmlFor="notes" className="block text-[16px] font-bold text-text-primary">
            {isZh ? "备注（可选）：门禁、宠物、重点区域等" : "Notes (optional): access, pets, focus areas"}
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={500}
            className="mt-1.5 block w-full rounded-md border-[1.5px] border-border-strong bg-bg-base p-3 text-[17px] text-text-primary focus:border-brand focus:outline-none"
          />
        </div>
        <Footer
          step={step}
          t={tCommon}
          backHref="/bookings/new?step=3"
          finalCta={isZh ? `确认并支付 ${psym}${price.total.toFixed(2)}` : `Confirm & pay ${psym}${price.total.toFixed(2)}`}
        />
      </form>
    </Wizard>
  );
}

function tierLabel(tier: EffortTier, zh: boolean): string {
  return zh
    ? { regular: "常规", medium: "中度", high: "高强度" }[tier]
    : { regular: "Regular", medium: "Medium effort", high: "High effort" }[tier];
}

function Wizard({
  step,
  country,
  initials,
  children,
}: {
  step: Step;
  country: CountryCode;
  initials: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header country={country} back signedIn={true} initials={initials} />
      <BookingProgress step={step} />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content overflow-auto bg-bg-surface px-5 pb-[120px] pt-5 sm:pb-12"
      >
        {children}
      </main>
    </>
  );
}

function Footer({
  step,
  t,
  backHref,
  finalCta,
}: {
  step: Step;
  t: Awaited<ReturnType<typeof getTranslations<"common">>>;
  backHref: string;
  finalCta?: string;
}) {
  return (
    <div className="sticky bottom-[84px] z-10 -mx-5 mt-4 flex gap-2 border-t border-border bg-bg-base p-3 sm:bottom-0">
      <Link
        href={backHref}
        className="inline-flex h-14 flex-1 items-center justify-center rounded-md border-2 border-brand bg-bg-base text-[16px] font-semibold text-brand"
      >
        {t("back")}
      </Link>
      <button
        type="submit"
        className="inline-flex h-14 flex-1 items-center justify-center rounded-md bg-brand text-[17px] font-bold text-white hover:bg-brand-hover"
      >
        {step === 4 ? finalCta || t("next") : t("next")}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-[16px]">
      <span className="text-text-secondary">{label}</span>
      <span className="text-right font-semibold text-text-primary">
        {value}
      </span>
    </div>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="mt-3 rounded-md border-[1.5px] border-danger bg-danger-soft px-3.5 py-3 text-[16px] font-semibold text-danger"
    >
      {children}
    </div>
  );
}
