import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'

export async function POST(req: NextRequest) {
  const session = await getCurrentUser()
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const { qualifications = [], checkDates = {}, checkConfirmed = {}, schemes = [], notes = '' } = body

  // Validate mandatory checks confirmed
  const MANDATORY = ['ndis_screening', 'police_check', 'wwvp', 'ndis_orientation', 'first_aid', 'cpr']
  const missing = MANDATORY.filter(id => !checkConfirmed[id])
  if (missing.length > 0) {
    return NextResponse.json(
      { error: 'Missing mandatory checks', missing },
      { status: 400 }
    )
  }

  // TODO: persist to provider_certifications table via Drizzle ORM
  // Example:
  // await db.insert(providerCertifications).values({
  //   providerId: session.userId,
  //   qualifications: JSON.stringify(qualifications),
  //   schemes: JSON.stringify(schemes),
  //   checkDates: JSON.stringify(checkDates),
  //   notes,
  //   status: 'pending_review',
  //   submittedAt: new Date(),
  // })

  console.log('[certification] provider', session.userId, 'submitted:', {
    qualifications: qualifications.length,
    schemes: schemes.length,
    mandatoryChecksConfirmed: MANDATORY.length,
  })

  return NextResponse.json({
    success: true,
    message: 'Registration received. Our team will review your documents within 2 business days.',
    ref: 'SC-CERT-' + Date.now().toString(36).toUpperCase(),
  })
}
