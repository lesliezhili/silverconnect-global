import { setRequestLocale } from 'next-intl/server'
import ProviderCertificationChecklist from '@/components/domain/ProviderCertificationChecklist'
import { getCurrentUser } from '@/lib/auth/server'
import { hasGovtFundingAccess } from '@/lib/auth/govtFundingAccess'
import { redirect } from '@/i18n/navigation'

export default async function CertificationPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const me = await getCurrentUser()
  if (!hasGovtFundingAccess(me?.email)) {
    redirect({ href: '/provider/register', locale })
  }
  return (
    <main className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-3xl mx-auto px-4'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
             Provider Registration
          </h1>
          <p className='text-gray-500 text-lg'>
            Complete your qualification checklist to start accepting bookings
          </p>
          <p className='text-sm text-gray-400 mt-1'>
            All NDIS + government agency registrations managed by SilverConnect
          </p>
        </div>
        <ProviderCertificationChecklist />
      </div>
    </main>
  )
}
