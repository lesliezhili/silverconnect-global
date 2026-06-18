import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { xinyuzheFeedback, xinyuzheSessions } from '@/lib/db/schema/xinyuzhe'
import { getCurrentUser } from '@/lib/auth/session'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: '\u8bf7\u5148\u767b\u5f55' }, { status: 401 })

    const body = await req.json()
    const {
      sessionId, providerId,
      clientSatisfaction, emotionalConnection, professionalism,
      wouldRecommend, clientComment, providerNotes,
    } = body

    if (!providerId || !clientSatisfaction) {
      return NextResponse.json({ error: '\u7f3a\u5c11\u5fc5\u8981\u53c2\u6570' }, { status: 400 })
    }

    const [record] = await db
      .insert(xinyuzheFeedback)
      .values({
        sessionId: sessionId ?? null,
        providerId,
        clientSatisfaction:  Number(clientSatisfaction),
        emotionalConnection: Number(emotionalConnection ?? 0),
        professionalism:     Number(professionalism ?? 0),
        wouldRecommend:      Boolean(wouldRecommend),
        clientComment:       clientComment ?? null,
        providerNotes:       providerNotes ?? null,
      })
      .returning()

    // Mark session as completed if sessionId provided
    if (sessionId) {
      await db
        .update(xinyuzheSessions)
        .set({ status: 'completed' })
        .where(eq(xinyuzheSessions.id, sessionId))
    }

    return NextResponse.json({ success: true, id: record.id }, { status: 201 })
  } catch (err) {
    console.error('[xinyuzhe/feedback POST]', err)
    return NextResponse.json({ error: '\u63d0\u4ea4\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const providerId = searchParams.get('providerId')
    if (!providerId) return NextResponse.json({ error: 'Missing providerId' }, { status: 400 })
    const records = await db
      .select()
      .from(xinyuzheFeedback)
      .where(eq(xinyuzheFeedback.providerId, providerId))
    return NextResponse.json({ records })
  } catch (err) {
    console.error('[xinyuzhe/feedback GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
