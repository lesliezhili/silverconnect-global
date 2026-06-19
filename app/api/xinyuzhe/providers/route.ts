import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { xinyuzheProviders } from '@/lib/db/schema/xinyuzhe'
import { eq, desc } from 'drizzle-orm'
import { getAdmin } from '@/components/domain/adminCookie'

// GET /api/xinyuzhe/providers?status=pending|approved|all
export async function GET(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin.signedIn) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const status = new URL(req.url).searchParams.get('status') || 'pending'
  const rows = status === 'all'
    ? await db.select().from(xinyuzheProviders).orderBy(desc(xinyuzheProviders.createdAt))
    : await db.select().from(xinyuzheProviders)
        .where(eq(xinyuzheProviders.status, status))
        .orderBy(desc(xinyuzheProviders.createdAt))
  return NextResponse.json({ providers: rows })
}

// PATCH /api/xinyuzhe/providers  { id, status: 'approved'|'rejected'|'suspended' }
export async function PATCH(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin.signedIn) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { id, status } = await req.json()
  const VALID = ['pending', 'approved', 'rejected', 'suspended']
  if (!id || !VALID.includes(status))
    return NextResponse.json({ error: '参数错误' }, { status: 400 })

  const [updated] = await db
    .update(xinyuzheProviders)
    .set({ status, updatedAt: new Date() })
    .where(eq(xinyuzheProviders.id, id))
    .returning()
  return NextResponse.json({ success: true, provider: updated })
}
