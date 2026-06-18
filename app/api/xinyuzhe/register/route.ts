import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { xinyuzheProviders } from '@/lib/db/schema/xinyuzhe'
import { getCurrentUser } from '@/lib/auth/session'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: '\u8bf7\u5148\u767b\u5f55' }, { status: 401 })

    const body = await req.json()
    const {
      fullName, phone, email, university, department,
      yearOfStudy, specializations, backgroundCheckConsent,
    } = body

    if (!fullName || !phone || !email || !university || !department) {
      return NextResponse.json({ error: '\u8bf7\u586b\u5199\u5fc5\u586b\u9879' }, { status: 400 })
    }
    if (!backgroundCheckConsent) {
      return NextResponse.json({ error: '\u8bf7\u540c\u610f\u80cc\u666f\u8c03\u67e5' }, { status: 400 })
    }

    const [record] = await db
      .insert(xinyuzheProviders)
      .values({
        userId: user.id,
        fullName, phone, email, university, department,
        yearOfStudy: yearOfStudy ? Number(yearOfStudy) : null,
        specializations: specializations ?? [],
        backgroundCheckConsent: true,
        status: 'pending',
      })
      .returning()

    return NextResponse.json({ success: true, id: record.id }, { status: 201 })
  } catch (err) {
    console.error('[xinyuzhe/register]', err)
    return NextResponse.json({ error: '\u670d\u52a1\u5668\u9519\u8bef\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const records = await db
      .select()
      .from(xinyuzheProviders)
      .where(/* userId eq */ undefined as never)
    return NextResponse.json({ records })
  } catch (err) {
    console.error('[xinyuzhe/register GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
