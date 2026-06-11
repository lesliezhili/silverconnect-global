import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { CreditCard, Lock, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { getCountry } from "@/components/domain/countryCookie";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { paymentMethods } from "@/lib/db/schema/customer-data";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

async function addCardAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);

  const cardNumber = String(formData.get("cardNumber") ?? "").replace(/\s/g, "");
  const expMonth = Number(formData.get("expMonth") ?? 0);
  const expYear = Number(formData.get("expYear") ?? 0);
  const cvc = String(formData.get("cvc") ?? "");

  if (cardNumber.length < 13 || !expMonth || !expYear || cvc.length < 3) {
    nextRedirect(`/${locale}/profile/payment/new?error=invalid`);
    return;
  }

  let brand = "unknown";
  if (cardNumber.startsWith("4")) brand = "visa";
  else if (cardNumber.startsWith("5") || cardNumber.startsWith("2")) brand = "mastercard";
  else if (cardNumber.startsWith("3")) brand = "amex";

  const last4 = cardNumber.slice(-4);
  const pmId = `pm_sim_${randomUUID().replace(/-/g, "").slice(0, 24)}`;

  // Unset other defaults
  await db.update(paymentMethods).set({ isDefault: false }).where(eq(paymentMethods.userId, me.id));

  await db.insert(paymentMethods).values({
    userId: me.id, stripePaymentMethodId: pmId,
    brand, last4, expMonth, expYear, isDefault: true,
  });

  nextRedirect(`/${locale}/profile/payment?added=1`);
}

export default async function NewPaymentMethodPage({
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
  const error = sp.error === "invalid";

  return (
    <>
      <Header country={country} back signedIn initials={me.initials} />
      <main id="main-content" className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
            <CreditCard size={24} />
          </div>
          <div>
            <h1 className="text-[22px] font-extrabold">Add Payment Card</h1>
            <p className="text-[15px] text-text-secondary">Your card details are securely stored</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-danger bg-danger-soft px-4 py-3 text-[15px] text-danger">
            Please check your card details and try again.
          </div>
        )}

        <form action={addCardAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />

          <div>
            <label className="mb-1.5 block text-[15px] font-semibold text-text-primary">Card Number</label>
            <input
              name="cardNumber" type="text" inputMode="numeric" maxLength={19}
              placeholder="4242 4242 4242 4242" required
              className="h-12 w-full rounded-xl border border-border bg-bg-base px-4 text-[17px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-[15px] font-semibold">Month</label>
              <input
                name="expMonth" type="number" min={1} max={12} placeholder="MM" required
                className="h-12 w-full rounded-xl border border-border bg-bg-base px-4 text-[17px] outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[15px] font-semibold">Year</label>
              <input
                name="expYear" type="number" min={2024} max={2040} placeholder="YYYY" required
                className="h-12 w-full rounded-xl border border-border bg-bg-base px-4 text-[17px] outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[15px] font-semibold">CVC</label>
              <input
                name="cvc" type="text" inputMode="numeric" maxLength={4} placeholder="123" required
                className="h-12 w-full rounded-xl border border-border bg-bg-base px-4 text-[17px] outline-none focus:border-brand"
              />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-[14px] text-text-secondary">
            <Lock size={14} /> Secured with 256-bit encryption
          </div>

          <button
            type="submit"
            className="mt-4 h-14 w-full rounded-xl bg-brand text-[17px] font-bold text-white shadow-md hover:bg-brand-hover active:scale-[0.98] transition-all"
          >
            Save Card
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-border bg-bg-surface p-4">
          <p className="text-[14px] text-text-secondary">
            <strong>Test cards:</strong> Use 4242424242424242 (Visa) or 5555555555554444 (Mastercard) with any future date and any 3-digit CVC.
          </p>
        </div>
      </main>
    </>
  );
}
