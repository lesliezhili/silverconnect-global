import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'https://silverconnect-global.vercel.app'

test.describe('Stripe payment routes', () => {

  // ── create-intent must require auth ────────────────────────────────────
  test('POST /api/payments/create-intent without session returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/payments/create-intent`, {
      data: { bookingId: '00000000-0000-0000-0000-000000000000' },
    })
    expect(res.status()).toBe(401)
  })

  // ── connect-onboard must require a provider session ────────────────────
  test('POST /api/payments/connect-onboard without session returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/payments/connect-onboard`)
    expect(res.status()).toBe(401)
  })

  // ── payout must require auth ────────────────────────────────────────────
  test('POST /api/payments/payout without session returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/payments/payout`)
    expect(res.status()).toBe(401)
  })

  // ── booking cancel must validate input before touching payments ───────
  test('POST /api/bookings/[id]/cancel without cancelledBy returns 400', async ({ request }) => {
    const res = await request.post(`${BASE}/api/bookings/00000000-0000-0000-0000-000000000000/cancel`, {
      data: {},
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/bookings/[id]/cancel for a nonexistent booking returns 404', async ({ request }) => {
    const res = await request.post(`${BASE}/api/bookings/00000000-0000-0000-0000-000000000000/cancel`, {
      data: { cancelledBy: '00000000-0000-0000-0000-000000000000' },
    })
    expect(res.status()).toBe(404)
  })

  // ── webhook must never accept an unsigned/unverified body ──────────────
  // This is the exact bug fixed in task #3: previously, a missing signing
  // secret meant the endpoint accepted ANY POST body as a trusted Stripe
  // event. It must now refuse — either because the secret is unconfigured
  // (500) or because the signature doesn't match (400) — but never 200.
  test('POST /api/webhooks/stripe without stripe-signature header is rejected', async ({ request }) => {
    const res = await request.post(`${BASE}/api/webhooks/stripe`, {
      data: { type: 'payment_intent.succeeded', data: { object: { id: 'pi_fake', metadata: {} } } },
    })
    expect([400, 500]).toContain(res.status())
    const body = await res.json()
    expect(body.received).not.toBe(true)
  })

  test('POST /api/webhooks/stripe with a forged signature header is rejected', async ({ request }) => {
    const res = await request.post(`${BASE}/api/webhooks/stripe`, {
      headers: { 'stripe-signature': 't=1,v1=forged' },
      data: { type: 'payment_intent.succeeded', data: { object: { id: 'pi_fake', metadata: {} } } },
    })
    expect([400, 500]).toContain(res.status())
    const body = await res.json()
    expect(body.received).not.toBe(true)
  })

  // ── admin/disputes moves real Stripe refunds — must require isAdmin ────
  // Found via this task: this route had ZERO auth check at all (not just a
  // weak one) — anyone could list all disputes (customer/provider PII) and
  // POST to resolve them, triggering a real Stripe refund. Fixed alongside
  // ~9 other admin routes with the same gap.
  test('GET /api/admin/disputes without session returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/disputes`)
    expect(res.status()).toBe(401)
  })

  test('POST /api/admin/disputes without session returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/disputes`, {
      data: { disputeId: 'x', resolution: 'x', refundType: 'full', resolvedBy: 'x' },
    })
    expect(res.status()).toBe(401)
  })

  // ── other money/PII-adjacent admin routes fixed in the same sweep ──────
  for (const path of ['providers', 'volunteer-management', 'payment-provider', 'volunteers']) {
    test(`GET /api/admin/${path} without session returns 401`, async ({ request }) => {
      const res = await request.get(`${BASE}/api/admin/${path}`)
      expect(res.status()).toBe(401)
    })
  }

  // ── Full paid flows (skipped -- need TEST_BOOKING_ID + an authenticated
  //    session cookie against a Stripe test-mode key) ─────────────────────
  test.skip('full create-intent -> webhook -> refund flow (needs TEST_SESSION_COOKIE + TEST_BOOKING_ID)', async ({ request }) => {
    const cookie = process.env.TEST_SESSION_COOKIE!
    const bookingId = process.env.TEST_BOOKING_ID!
    const res = await request.post(`${BASE}/api/payments/create-intent`, {
      headers: { Cookie: cookie },
      data: { bookingId },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.paymentIntentId).toBeTruthy()
  })

  // ── auth gate correctly ADMITS a real signed-in user past the 401 ──────
  // Complements the "blocks unauthenticated" tests above: registers a fresh
  // customer, logs in, then confirms create-intent gets past auth (hits the
  // real "booking not found" 404, not the 401 an unauthenticated call gets).
  test('authenticated user gets past the create-intent auth gate', async ({ page }) => {
    const email = `e2e-payauth-${Date.now()}@example.com`
    const password = 'TestPass1234!'

    await page.goto(`${BASE}/en/auth/register`)
    await page.getByLabel(/your name/i).fill('Pay Auth Check')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/^password$/i).fill(password)
    await page.getByRole('button', { name: /create account|sign up|register/i }).click()
    await page.waitForURL(/auth\/login/, { timeout: 15000 })

    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/^password$/i).fill(password)
    await page.getByRole('button', { name: /sign.?in|log.?in/i }).click()
    await page.waitForURL(/\/home/, { timeout: 15000 })

    const res = await page.request.post(`${BASE}/api/payments/create-intent`, {
      data: { bookingId: '00000000-0000-0000-0000-000000000000' },
    })
    // Not 401 — the session is real and valid, so it proceeds to look up
    // the booking, which doesn't exist.
    expect(res.status()).toBe(404)
  })
})
