import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'https://silverconnect-global.vercel.app'
const EMAIL_EP = `${BASE}/api/notifications/email`
const PROV_EP  = `${BASE}/api/xinyuzhe/providers`

async function postEmail(request: any, type: string, extra: object = {}) {
  return request.post(EMAIL_EP, {
    data: { to: `e2e-${type}@example.com`, type, data: { name: '测试', ...extra } },
    timeout: 10_000,
  })
}

test.describe('心语者审核邮件通知', () => {

  // ── All 6 xinyuzhe email types must return 200 ────────────────────────────────────────
  for (const [type, extra] of [
    ['xinyuzhe_provider_approved',     {}],
    ['xinyuzhe_provider_rejected',     {}],
    ['xinyuzhe_provider_registered',   {}],
    ['xinyuzhe_registration_confirmed',{ refId: 'R-TEST', serviceTypes: ['ai_companion'] }],
    ['xinyuzhe_booking_admin',         { ref: 'BK-TEST', service: 'xinyuzhe', date: '2026-08-01' }],
    ['xinyuzhe_booking_confirmed',     { ref: 'BK-TEST', date: '2026-08-01' }],
  ] as [string, object][]) {
    test(`${type} returns 200`, async ({ request }) => {
      const res = await postEmail(request, type, extra)
      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(typeof body.sent).toBe('boolean')   // true=SMTP live, false=SMTP not configured
      if (!body.sent) console.warn(`${type}: SMTP not configured (sent=false) -- check SMTP_USER in Vercel env`)
    })
  }

  // ── Unknown type must return 400 ──────────────────────────────────────────────────
  test('unknown email type returns 400', async ({ request }) => {
    const res = await request.post(EMAIL_EP, {
      data: { to: 'x@y.com', type: 'not_a_real_type', data: {} },
    })
    expect(res.status()).toBe(400)
    expect((await res.json()).error).toBeTruthy()
  })

  test('missing `to` field returns 400', async ({ request }) => {
    const res = await request.post(EMAIL_EP, {
      data: { type: 'xinyuzhe_provider_approved' },
    })
    expect(res.status()).toBe(400)
  })

  // ── Providers API must require admin auth ──────────────────────────────────────────
  test('GET /api/xinyuzhe/providers without admin cookie returns 401', async ({ request }) => {
    const res = await request.get(`${PROV_EP}?status=pending`)
    expect(res.status()).toBe(401)
  })

  test('PATCH /api/xinyuzhe/providers without admin cookie returns 401', async ({ request }) => {
    const res = await request.patch(PROV_EP, {
      data: { id: 'fake-id', status: 'approved' },
    })
    expect(res.status()).toBe(401)
  })

  // ── Full approval flow (skipped -- enable by setting TEST_ADMIN_COOKIE + TEST_PROVIDER_ID) ───
  test.skip('full approval flow (needs TEST_ADMIN_COOKIE + TEST_PROVIDER_ID)', async ({ request }) => {
    const adminCookie = process.env.TEST_ADMIN_COOKIE!
    const providerId  = process.env.TEST_PROVIDER_ID!
    // Approve
    const res = await request.patch(PROV_EP, {
      headers: { Cookie: `sc-admin=${adminCookie}` },
      data: { id: providerId, status: 'approved' },
    })
    expect(res.status()).toBe(200)
    expect((await res.json()).provider.status).toBe('approved')
    // Verify hub now accessible (session required -- skipping hub page check)
  })
})
