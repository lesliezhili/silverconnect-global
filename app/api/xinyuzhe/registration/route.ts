import { NextRequest, NextResponse } from 'next/server'

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

    // In production: insert into xinyuzhe_providers table
    // For now: log and return success (migration Cell 23b will create the table)
    console.log('[XinyuzheRegistration]', {
      name: body.name,
      phone: body.phone,
      email: body.email,
      city: body.city,
      education: body.education,
      serviceTypes: body.serviceTypes,
      submittedAt: new Date().toISOString(),
    })

    // TODO: send confirmation email via Resend/Gmail
    // TODO: notify admin via WeChat Work webhook

    return NextResponse.json({
      success: true,
      message: '申请已收到，我们将在 3～5 工作日内审核并通知您。',
      refId: `XYZ-${Date.now()}`,
    })
  } catch (err) {
    console.error('[XinyuzheRegistration] error:', err)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
