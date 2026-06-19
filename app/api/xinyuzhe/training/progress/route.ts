import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { xinyuzheTrainingProgress } from '@/lib/db/schema/xinyuzhe'
import { getOptionalAuthSession } from '@/lib/auth/session'
import { eq, and } from 'drizzle-orm'

// POST /api/xinyuzhe/training/progress
// Body: { lessonId, moduleId }
// Saves to DB if authenticated; always returns 200 (fire-and-forget from client)
export async function POST(req: NextRequest) {
  try {
    const { lessonId, moduleId } = await req.json()
    if (!lessonId || !moduleId) {
      return NextResponse.json({ saved: false, reason: 'missing fields' })
    }
    const session = await getOptionalAuthSession()
    if (!session?.userId) {
      // Not logged in: localStorage is source of truth, no DB write needed
      return NextResponse.json({ saved: false, reason: 'not authenticated' })
    }
    await db
      .insert(xinyuzheTrainingProgress)
      .values({ providerId: session.userId, moduleId, lessonId })
      .onConflictDoNothing()
    return NextResponse.json({ saved: true })
  } catch (err) {
    console.error('[TrainingProgress] POST error:', err)
    return NextResponse.json({ saved: false, reason: 'server error' })
  }
}

// GET /api/xinyuzhe/training/progress
// Returns completed lesson IDs for the authenticated user
export async function GET() {
  try {
    const session = await getOptionalAuthSession()
    if (!session?.userId) {
      return NextResponse.json({ lessonIds: [] })
    }
    const rows = await db
      .select({ lessonId: xinyuzheTrainingProgress.lessonId })
      .from(xinyuzheTrainingProgress)
      .where(eq(xinyuzheTrainingProgress.providerId, session.userId))
    return NextResponse.json({ lessonIds: rows.map(r => r.lessonId) })
  } catch (err) {
    console.error('[TrainingProgress] GET error:', err)
    return NextResponse.json({ lessonIds: [] })
  }
}
