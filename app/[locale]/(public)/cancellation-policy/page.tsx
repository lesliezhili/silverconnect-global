import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";

export const dynamic = "force-dynamic";

export default async function CancellationPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-8">
        <h1 className="text-[28px] font-bold text-text-primary">
          Booking Agreement & Cancellation Policy
        </h1>
        <p className="mt-2 text-[17px] text-text-secondary">
          Fair to both customers and helpers. Transparent funding accepted.
        </p>

        {/* Cancellation Tiers */}
        <section className="mt-8">
          <h2 className="text-[22px] font-bold text-text-primary">Cancellation & Refund</h2>
          <div className="mt-4 flex flex-col gap-3">
            <PolicyTier window="7+ days before" refund="100%" color="bg-green-50 border-green-200" textColor="text-green-700" />
            <PolicyTier window="48h – 7 days before" refund="100%" color="bg-green-50 border-green-200" textColor="text-green-700" />
            <PolicyTier window="24 – 48 hours before" refund="50%" color="bg-yellow-50 border-yellow-200" textColor="text-yellow-700" />
            <PolicyTier window="Less than 24 hours" refund="0%" color="bg-red-50 border-red-200" textColor="text-red-700" />
            <PolicyTier window="No-show" refund="0%" color="bg-red-50 border-red-200" textColor="text-red-700" />
          </div>
        </section>

        {/* Exceptions */}
        <section className="mt-8">
          <h2 className="text-[22px] font-bold text-text-primary">Exceptions</h2>
          <ul className="mt-3 flex flex-col gap-2">
            <li className="flex gap-2 text-[17px] text-text-secondary">
              <span className="shrink-0">🏥</span>
              <span>Emergency/medical: Contact us within 24h for full refund review</span>
            </li>
            <li className="flex gap-2 text-[17px] text-text-secondary">
              <span className="shrink-0">⛈️</span>
              <span>Severe weather: Automatic full refund if government warning active</span>
            </li>
            <li className="flex gap-2 text-[17px] text-text-secondary">
              <span className="shrink-0">🔄</span>
              <span>Provider cancels: Always 100% refund + priority rebooking</span>
            </li>
          </ul>
        </section>

        {/* Government Funding Schemes */}
        <section className="mt-8">
          <h2 className="text-[22px] font-bold text-text-primary">Government Funding Accepted</h2>
          <p className="mt-2 text-[17px] text-text-secondary">
            If your service is funded by a government scheme, provide your details when booking.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <FundingCard
              name="TAC"
              full="Transport Accident Commission (VIC)"
              requires="TAC Claim Number + Approval Letter (PDF) + Service Scope"
              example="e.g. TAC-2026-123456"
            />
            <FundingCard
              name="WorkSafe"
              full="WorkSafe Victoria (WorkCover)"
              requires="WorkSafe Claim Number + Approval Letter (PDF) + Service Scope"
              example="e.g. WS-2026-789012"
            />
            <FundingCard
              name="NDIS"
              full="National Disability Insurance Scheme"
              requires="NDIS Number + Participant Ref + Plan Number + Plan PDF + Support Category + Budget"
              example="e.g. 430 000 0000"
            />
            <FundingCard
              name="My Aged Care"
              full="Home Care Package (Level 1-4)"
              requires="Client ID + Package Level + Assignment Letter (PDF) + Approved Services"
              example="e.g. MAC-XXXXXXXX"
            />
            <FundingCard
              name="DVA"
              full="Department of Veterans\' Affairs"
              requires="DVA File Number + Approval Letter (PDF) + Service Type"
              example="e.g. QX123456"
            />
          </div>
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-[17px] font-semibold text-yellow-800">Important</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-[16px] text-yellow-700">
              <li>• Gap payments (amount not covered by funding) charged to your card on file</li>
              <li>• All claims verified within 24-48 hours before first service</li>
              <li>• Ensure your approval has not expired before booking</li>
              <li>• Your claim info is encrypted and only shared with your assigned helper</li>
            </ul>
          </div>
        </section>

        {/* Booking Agreement */}
        <section className="mt-8">
          <h2 className="text-[22px] font-bold text-text-primary">Booking Agreement</h2>
          <div className="mt-3 rounded-lg border border-border bg-bg-base p-5">
            <ul className="flex flex-col gap-3">
              <AgreementItem text="100% payment upfront — held securely until service complete" />
              <AgreementItem text="Payment released to helper after you confirm satisfaction" />
              <AgreementItem text="Customer must have valid payment card before booking" />
              <AgreementItem text="Service provider must have BSB/account number to receive payments" />
              <AgreementItem text="Government-funded bookings require claim number + approval letter (PDF)" />
              <AgreementItem text="Reminders sent at 24h, 12h, 8h, and 4h before service" />
              <AgreementItem text="Before & after photo/video evidence required from helper" />
              <AgreementItem text="Two-way feedback (rating) after service completion" />
              <AgreementItem text="15% platform fee on completed bookings (or as per funding agreement)" />
              <AgreementItem text="Disputes must be raised within 48 hours" />
            </ul>
          </div>
        </section>

        {/* Provider Policy */}
        <section className="mt-8">
          <h2 className="text-[22px] font-bold text-text-primary">For Service Providers</h2>
          <div className="mt-3 rounded-lg border border-border bg-bg-base p-4">
            <ul className="flex flex-col gap-2 text-[17px] text-text-secondary">
              <li>• Must give at least <strong>24 hours notice</strong> to cancel</li>
              <li>• 3+ cancellations in 30 days may result in temporary suspension</li>
              <li>• Must have BSB + Account Number registered before accepting jobs</li>
              <li>• Must upload before/after photo evidence for every job</li>
              <li>• Government-funded jobs: invoice submitted to funder on your behalf</li>
            </ul>
          </div>
        </section>

        <p className="mt-6 text-[15px] text-text-tertiary">
          Last updated: 28 May 2026. This policy applies to all bookings on SilverConnect Australia.
        </p>
      </main>
    </>
  );
}

function PolicyTier({ window, refund, color, textColor }: {
  window: string; refund: string; color: string; textColor: string;
}) {
  return (
    <div className={`flex items-center justify-between rounded-lg border p-4 ${color}`}>
      <span className="text-[17px] font-semibold text-text-primary">{window}</span>
      <span className={`text-[20px] font-bold ${textColor}`}>{refund} refund</span>
    </div>
  );
}

function FundingCard({ name, full, requires, example }: {
  name: string; full: string; requires: string; example: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-base p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[18px] font-bold text-text-primary">{name}</p>
          <p className="text-[15px] text-text-tertiary">{full}</p>
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-[14px] font-semibold text-green-700">
          Accepted
        </span>
      </div>
      <p className="mt-2 text-[16px] text-text-secondary">
        <strong>Required:</strong> {requires}
      </p>
      <p className="mt-1 text-[15px] text-text-tertiary italic">{example}</p>
    </div>
  );
}

function AgreementItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-[17px] text-text-secondary">
      <span className="mt-0.5 shrink-0 text-green-600 font-bold">✓</span>
      <span>{text}</span>
    </li>
  );
}
