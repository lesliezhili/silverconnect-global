import { setRequestLocale } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { CheckCircle2, Plus, Trash2, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { getCountry } from "@/components/domain/countryCookie";
import { CURRENCY_SYMBOL } from "@/components/domain/country";
import { db } from "@/lib/db";
import { serviceCategories, services, servicePrices } from "@/lib/db/schema/services";
import { providerProfiles, providerCategories } from "@/lib/db/schema/providers";
import { getCurrentUser } from "@/lib/auth/server";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

const CAT_EMOJI: Record<string, string> = {
  cleaning: "✨", companion: "❤️", garden: "🌿",
  personalCare: "🧴", repair: "🔧",
};

async function addCatAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const cat = String(formData.get("category") ?? "");
  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);
  const [profile] = await db.select({ id: providerProfiles.id }).from(providerProfiles)
    .where(eq(providerProfiles.userId, me.id)).limit(1);
  if (!profile) nextRedirect(`/${locale}/provider/register`);
  await db.insert(providerCategories).values({ providerId: profile.id, category: cat as never }).onConflictDoNothing();
  nextRedirect(`/${locale}/provider/services?added=1`);
}

async function removeCatAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const cat = String(formData.get("category") ?? "");
  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);
  const [profile] = await db.select({ id: providerProfiles.id }).from(providerProfiles)
    .where(eq(providerProfiles.userId, me.id)).limit(1);
  if (!profile) nextRedirect(`/${locale}/provider/services`);
  await db.delete(providerCategories).where(
    and(eq(providerCategories.providerId, profile.id), eq(providerCategories.category, cat as never))
  );
  nextRedirect(`/${locale}/provider/services?removed=1`);
}

export default async function ProviderServicesPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);
  const country = await getCountry();
  const sym = CURRENCY_SYMBOL[country];

  const [profile] = await db.select({ id: providerProfiles.id }).from(providerProfiles)
    .where(eq(providerProfiles.userId, me.id)).limit(1);
  if (!profile) nextRedirect(`/${locale}/provider/register`);

  // My active categories
  const myCats = await db.select({ category: providerCategories.category }).from(providerCategories)
    .where(eq(providerCategories.providerId, profile.id));
  const myCodes = myCats.map((c) => c.category);

  // All available categories
  const allCats = await db.select({ code: serviceCategories.code }).from(serviceCategories)
    .where(eq(serviceCategories.enabled, true));

  // Service pricing for display
  const allSvcPrices = await db
    .select({ code: services.code, categoryCode: services.categoryCode, basePrice: servicePrices.basePrice, durationMin: services.durationMin })
    .from(services)
    .innerJoin(servicePrices, eq(servicePrices.serviceId, services.id))
    .where(and(eq(services.enabled, true), eq(servicePrices.country, country as never)));

  const added = sp.added === "1";
  const removed = sp.removed === "1";

  return (
    <>
      <Header country={country} back signedIn initials={me.initials} />
      <main id="main-content" className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12">
        <h1 className="text-[26px] font-extrabold">My Services</h1>
        <p className="mt-1 text-[16px] text-text-secondary">Select the service categories you offer</p>

        {(added || removed) && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-success bg-success-soft px-4 py-3 text-[16px] font-semibold text-success">
            <CheckCircle2 size={20} /> {added ? "Service added!" : "Service removed"}
          </div>
        )}

        {/* Active services */}
        <section className="mt-6">
          <h2 className="text-[18px] font-bold mb-3">Active ({myCodes.length})</h2>
          {myCodes.length === 0 ? (
            <p className="text-[16px] text-text-secondary py-6 text-center border border-dashed border-border rounded-xl">
              No services yet. Add categories below to start receiving bookings.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {myCodes.map((code) => {
                const catPrices = allSvcPrices.filter((s) => s.categoryCode === code);
                const minP = catPrices.length > 0 ? Math.min(...catPrices.map((s) => Number(s.basePrice))) : 0;
                return (
                  <li key={code} className="flex items-center justify-between rounded-xl border border-brand/30 bg-brand-soft/30 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{CAT_EMOJI[code] || "⭐"}</span>
                      <div>
                        <p className="text-[17px] font-bold capitalize">{code.replace(/([A-Z])/g, " $1")}</p>
                        <p className="text-[14px] text-text-secondary">{catPrices.length} templates · from {sym}{minP.toFixed(0)}</p>
                      </div>
                    </div>
                    <form action={removeCatAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="category" value={code} />
                      <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-full text-danger hover:bg-danger-soft">
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Available to add */}
        <section className="mt-8">
          <h2 className="text-[18px] font-bold mb-3">Available Categories</h2>
          <ul className="flex flex-col gap-3">
            {allCats.filter((c) => !myCodes.includes(c.code as never)).map((cat) => {
              const catPrices = allSvcPrices.filter((s) => s.categoryCode === cat.code);
              const minP = catPrices.length > 0 ? Math.min(...catPrices.map((s) => Number(s.basePrice))) : 0;
              return (
                <li key={cat.code} className="flex items-center justify-between rounded-xl border border-border bg-bg-surface px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CAT_EMOJI[cat.code] || "⭐"}</span>
                    <div>
                      <p className="text-[17px] font-bold capitalize">{cat.code.replace(/([A-Z])/g, " $1")}</p>
                      <p className="text-[14px] text-text-secondary">{catPrices.length} templates · from {sym}{minP.toFixed(0)}</p>
                    </div>
                  </div>
                  <form action={addCatAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="category" value={cat.code} />
                    <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-hover">
                      <Plus size={16} />
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Smart Pricing Info */}
        <section className="mt-8 rounded-xl border border-border bg-bg-surface p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-brand" />
            <h3 className="text-[17px] font-bold">Smart Pricing</h3>
          </div>
          <p className="text-[14px] text-text-secondary mb-3">
            Rates are set by market demand, location, and your quality score. Higher ratings unlock premium pricing.
          </p>
          <div className="grid grid-cols-1 gap-2">
            {allSvcPrices.slice(0, 6).map((svc) => (
              <div key={svc.code} className="flex justify-between text-[14px] py-1 border-b border-border/50 last:border-0">
                <span className="text-text-secondary capitalize">{svc.code.replace(/_/g, " ")}</span>
                <span className="font-semibold">{sym}{Number(svc.basePrice).toFixed(0)} · {svc.durationMin}min</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
