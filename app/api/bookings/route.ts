import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bookingRequests } from '@/lib/db/schema/bookings'

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
    return NextResponse.json({ success: true, ref })
  } catch (err) {
    console.error('[booking-api]', err)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
  }
}
