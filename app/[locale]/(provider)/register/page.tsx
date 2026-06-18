import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function ProviderRegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Government Scheme Registration
          </h1>
          <p className="text-gray-500 text-lg">
            SilverConnect guides you through registration as an approved government scheme provider
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Select a pathway to begin your compliance checklist
          </p>
        </div>
        <div className="grid gap-4">

          <Link href="/register/certification"
            className="flex items-center gap-4 p-5 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow group">
            <span className="text-3xl w-14 h-14 flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: '#E0F2FE' }}>
              🪦
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base leading-tight" style={{ color: '#0369A1' }}>NDIS Sole Trader Setup</p>
              <p className="text-sm text-gray-500 mt-0.5">
                ABN, insurance, NDIS Worker Screening, police check &amp; policies — start taking self/plan-managed clients fast
              </p>
            </div>
            <span className="text-gray-400 text-xl group-hover:text-gray-600 flex-shrink-0">›</span>
          </Link>

          <Link href="/register/certification"
            className="flex items-center gap-4 p-5 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow group">
            <span className="text-3xl w-14 h-14 flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: '#DBEAFE' }}>
              📋
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base leading-tight" style={{ color: '#1D4ED8' }}>NDIS Registered Provider</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Full registration with the NDIS Commission: registration groups, key personnel, self-assessment &amp; audit prep
              </p>
            </div>
            <span className="text-gray-400 text-xl group-hover:text-gray-600 flex-shrink-0">›</span>
          </Link>

          <Link href="/register/certification"
            className="flex items-center gap-4 p-5 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow group">
            <span className="text-3xl w-14 h-14 flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: '#FEF3C7' }}>
              🏡
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base leading-tight" style={{ color: '#B45309' }}>Aged Care Provider Pathway</p>
              <p className="text-sm text-gray-500 mt-0.5">
                My Aged Care &amp; GPMS guidance, Aged Care Quality Commission compliance, home-care provider setup
              </p>
            </div>
            <span className="text-gray-400 text-xl group-hover:text-gray-600 flex-shrink-0">›</span>
          </Link>

          <Link href="/register/certification"
            className="flex items-center gap-4 p-5 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow group">
            <span className="text-3xl w-14 h-14 flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: '#ECFCCB' }}>
              🎖️
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base leading-tight" style={{ color: '#4D7C0F' }}>DVA Provider Onboarding</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Veterans’ community nursing, personal &amp; domestic care — join or subcontract with approved DVA providers
              </p>
            </div>
            <span className="text-gray-400 text-xl group-hover:text-gray-600 flex-shrink-0">›</span>
          </Link>

          <Link href="/register/certification"
            className="flex items-center gap-4 p-5 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow group">
            <span className="text-3xl w-14 h-14 flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: '#FEE2E2' }}>
              🚑
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base leading-tight" style={{ color: '#B91C1C' }}>TAC &amp; WorkSafe Provider Setup</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Attendant &amp; personal care for road-accident and workplace-injury clients — meet TAC/WorkSafe Victoria claiming rules
              </p>
            </div>
            <span className="text-gray-400 text-xl group-hover:text-gray-600 flex-shrink-0">›</span>
          </Link>

        </div>
        <p className="text-center text-sm text-gray-400 mt-8">
          All NDIS + government agency registrations managed by SilverConnect
        </p>
      </div>
    </main>
  )
}
