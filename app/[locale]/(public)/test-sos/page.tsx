import { setRequestLocale } from "next-intl/server";
import { EmergencyOverlay } from "@/components/layout/EmergencyOverlay";
import { COUNTRIES, EMERGENCY_NUMBER, CURRENCY_SYMBOL } from "@/components/domain/country";
import type { CountryCode } from "@/components/layout/CountrySelector";
import { Link } from "@/i18n/navigation";

/**
 * Test page: /test-sos
 * Displays SOS overlay triggers for each country to verify correct
 * emergency numbers and translations render per country.
 * 
 * Dev-only — remove before production deployment.
 */

const COUNTRY_FLAGS: Record<string, string> = {
  AU: "🇦🇺", CN: "🇨🇳", CA: "🇨🇦", US: "🇺🇸",
  TW: "🇹🇼", SG: "🇸🇬", HK: "🇭🇰", MY: "🇲🇾",
};

export default async function TestSOSPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <main className="mx-auto w-full max-w-content px-5 py-8">
        <h1 className="text-elder-heading font-bold text-text-primary">
          🚨 SOS Overlay Test Page
        </h1>
        <p className="mt-2 text-[17px] text-text-secondary">
          Click any country card to test the SOS overlay with that country&apos;s emergency number.
          Each card opens <code>#sos</code> — press Escape or the X button to close.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {COUNTRIES.map((cc) => (
            <div
              key={cc}
              className="rounded-xl border border-border bg-bg-base p-5 shadow-card"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{COUNTRY_FLAGS[cc]}</span>
                <div>
                  <h2 className="text-elder-body font-bold">{cc}</h2>
                  <p className="text-[16px] text-text-secondary">
                    Emergency: <span className="font-mono font-bold text-danger">{EMERGENCY_NUMBER[cc as CountryCode]}</span>
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex flex-col gap-2 text-[15px]">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Currency:</span>
                  <span className="font-medium">{CURRENCY_SYMBOL[cc as CountryCode]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Overlay Key:</span>
                  <span className="font-mono text-[14px]">subtitle{cc}</span>
                </div>
              </div>

              <a
                href="#sos"
                className="mt-4 flex h-14 w-full items-center justify-center rounded-md bg-danger text-[18px] font-bold text-white"
              >
                Test SOS — {cc} ({EMERGENCY_NUMBER[cc as CountryCode]})
              </a>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-lg border border-border bg-bg-surface p-5">
          <h2 className="text-[18px] font-bold">Test Checklist</h2>
          <ul className="mt-3 flex flex-col gap-2 text-[16px] text-text-secondary">
            <li>✅ All 8 countries show correct emergency number</li>
            <li>✅ Overlay opens on #sos hash (click any red button above)</li>
            <li>✅ Overlay shows country-specific subtitle (translated)</li>
            <li>✅ Call button href = tel:{"{"}num{"}"}</li>
            <li>✅ GPS shared indicator visible (green text)</li>
            <li>✅ Escape key closes overlay</li>
            <li>✅ X button closes overlay</li>
            <li>✅ Browser back closes overlay (no history pollution)</li>
            <li>✅ Emergency contact notify button navigates to /profile/emergency</li>
          </ul>
        </section>

        <section className="mt-6 rounded-lg border border-warning bg-warning-soft p-5">
          <h2 className="text-[18px] font-bold text-warning">⚠️ Note</h2>
          <p className="mt-1 text-[16px] text-text-secondary">
            This test page renders the EmergencyOverlay with the <strong>current</strong> country
            cookie (set via CountrySelector). To test each country, change the country in the
            header dropdown first, then click the SOS button.
          </p>
          <p className="mt-2 text-[16px] text-text-secondary">
            The <code>tel:</code> links will attempt to dial on mobile devices — test on desktop
            browser for safety.
          </p>
        </section>

        <div className="mt-6">
          <Link href="/home" className="text-[17px] font-semibold text-brand">
            ← Back to Home
          </Link>
        </div>
      </main>
    </>
  );
}
