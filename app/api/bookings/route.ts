import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bookingRequests } from '@/lib/db/schema/booking-requests'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, date, message, service } = body

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const ref = `BK-${Date.now().toString(36).toUpperCase()}`

    await db.insert(bookingRequests).values({
      ref,
      service:       service || 'xinyuzhe',
      name:          name.trim(),
      email:         email.trim().toLowerCase(),
      phone:         phone?.trim()    || null,
      preferredDate: date             || null,
      message:       message?.trim()  || null,
    })

    console.log('[booking-created]', { ref, service, email: email.trim().toLowerCase() })
    // Fire-and-forget email notifications
    const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://silverconnect-global.vercel.app'
    const ADMIN = process.env.ADMIN_NOTIFICATION_EMAIL || 'lesliezhi.li@gmail.com'
    const mkPayload = (to: string, type: string) => ({
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, type, data: {
        name: name.trim(), email: email.trim(), phone: phone?.trim() || null,
        service: service || 'xinyuzhe', date: date || null,
        message: message?.trim() || null, ref,
      } }),
    })
    fetch(`${BASE}/api/notifications/email`, mkPayload(ADMIN, 'xinyuzhe_booking_admin')).catch(() => {})
    fetch(`${BASE}/api/notifications/email`, mkPayload(email.trim().toLowerCase(), 'xinyuzhe_booking_confirmed')).catch(() => {})
    return NextResponse.json({ success: true, ref })
  } catch (err) {
    console.error('[booking-api]', err)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
  }
}
