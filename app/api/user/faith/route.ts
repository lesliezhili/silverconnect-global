import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { faith } = await req.json()
  const res = NextResponse.json({ ok: true })
  res.cookies.set('sc-faith', faith || '', {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,  // 1 year
    httpOnly: false,
    sameSite: 'lax',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('sc-faith')
  return res
}
