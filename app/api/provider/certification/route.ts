import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { providerProfiles } from '@/lib/db/schema/providers'

export async function POST(req: NextRequest) {
  const session = await getCurrentUser()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const { ndisPath = '', qualifications = [], checkDates = {}, checkConfirmed = {}, schemes = [], notes = '' } = body

  // Validate mandatory checks confirmed
  const MANDATORY = ['ndis_screening', 'police_check', 'wwvp', 'ndis_orientation', 'first_aid', 'cpr']
  const missing = MANDATORY.filter(id => !checkConfirmed[id])
  if (missing.length > 0) {
    return NextResponse.json(
      { error: 'Missing mandatory checks', missing },
      { status: 400 }
    )
  }

  const [existing] = await db
    .select({ id: providerProfiles.id })
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, session.id))
    .limit(1)

  if (existing) {
    await db
      .update(providerProfiles)
      .set({
        ndisPath: ndisPath || null,
        govtSchemes: schemes,
        updatedAt: new Date(),
      })
      .where(eq(providerProfiles.id, existing.id))
  } else {
    await db.insert(providerProfiles).values({
      userId: session.id,
      ndisPath: ndisPath || null,
      govtSchemes: schemes,
      onboardingStatus: 'pending',
    })
  }

  console.log('[certification] provider', session.id, 'submitted:', {
    ndisPath,
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
