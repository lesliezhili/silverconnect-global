import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { xinyuzheProviders } from '@/lib/db/schema/xinyuzhe'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate required fields
    const required = ['name', 'phone', 'email', 'city', 'serviceTypes']
    for (const field of required) {
      if (!body[field] || (Array.isArray(body[field]) && body[field].length === 0)) {
        return NextResponse.json(
          { error: `缺少必填字段: ${field}` },
          { status: 400 }
        )
      }
    }
    if (!body.agreeTerms || !body.agreeBackground) {
      return NextResponse.json(
        { error: '请同意服务协议和背景调查' },
        { status: 400 }
      )
    }

    const [provider] = await db
      .insert(xinyuzheProviders)
      .values({
        fullName:        body.name,
        phone:           body.phone,
        email:           body.email,
        city:            body.city        || null,
        education:       body.education   || null,
        major:           body.major       || null,
        university:      body.university  || null,
        licenseType:     body.licenseType || null,
        licenseNumber:   body.licenseNumber || null,
        yearsExperience: Number(body.yearsExperience) || 0,
        serviceTypes:    Array.isArray(body.serviceTypes) ? body.serviceTypes : [],
        bio:             body.bio         || null,
        agreeTerms:      Boolean(body.agreeTerms),
        agreeBackground: Boolean(body.agreeBackground),
        status:          'pending',
      })
      .returning()

    // Fire-and-forget email notifications (don't block the response)
    const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://silverconnect-global.vercel.app'
    const ADMIN = process.env.ADMIN_NOTIFICATION_EMAIL || 'lesliezhi.li@gmail.com'
    const emailPayload = (to: string, type: string) => ({
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to, type,
        data: {
          name: body.name, phone: body.phone, email: body.email,
          city: body.city, education: body.education,
          serviceTypes: body.serviceTypes, refId: provider.id,
        },
      }),
    })
    fetch(`${BASE}/api/notifications/email`, emailPayload(ADMIN, 'xinyuzhe_provider_registered')).catch(() => {})
    fetch(`${BASE}/api/notifications/email`, emailPayload(body.email, 'xinyuzhe_registration_confirmed')).catch(() => {})

    return NextResponse.json({
      success: true,
      message: '申请已收到，我们将在3～5工作日内审核并通知您。',
      refId:   provider.id,
    })
  } catch (err) {
    console.error('[XinyuzheRegistration] error:', err)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
