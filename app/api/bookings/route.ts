import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, date, message, service } = body

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const ref = `BK-${Date.now().toString(36).toUpperCase()}`
    console.log('[booking-request]', { ref, service, name, email, phone, date, message,
                                       ts: new Date().toISOString() })
    // TODO: persist to xinyuzhe_sessions or booking_requests table
    // TODO: send confirmation email via SMTP/Resend

    return NextResponse.json({ success: true, ref })
  } catch (err) {
    console.error('[booking-api]', err)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
  }
}
