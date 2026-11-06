import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'https://silverconnect-global.vercel.app'

test.describe('Xero invoicing routes', () => {

  // ── connect must never crash even when XERO_CLIENT_ID is unset ─────────
  test('GET /api/xero/connect is safe with or without config', async ({ request }) => {
    const res = await request.get(`${BASE}/api/xero/connect`, { maxRedirects: 0 })
    // 500 (not configured) or a redirect to Xero's OAuth authorize screen —
    // never a 200, since there's nothing to render successfully either way.
    expect([302, 303, 307, 500]).toContain(res.status())
    if (res.status() === 500) {
      const body = await res.json()
      expect(body.error).toContain('XERO_CLIENT_ID')
    } else {
      expect(res.headers()['location']).toContain('login.xero.com')
    }
  })

  // ── connection-status check must always return well-formed JSON ────────
  test('GET /api/xero/invoice reports connection status without throwing', async ({ request }) => {
    const res = await request.get(`${BASE}/api/xero/invoice`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(typeof body.connected).toBe('boolean')
    if (!body.connected) {
      console.warn(`Xero not connected in this environment: ${body.reason}`)
    }
  })

  // ── creating an invoice without a connected Xero account must fail clearly ──
  test('POST /api/xero/invoice without a connected account returns 400 or a clear Xero error', async ({ request }) => {
    const res = await request.post(`${BASE}/api/xero/invoice`, {
      data: {
        bookingId: '00000000-0000-0000-0000-000000000000',
        customerName: 'E2E Test Customer',
        customerEmail: 'e2e-xero@example.com',
        serviceName: 'Cleaning',
        duration: 60,
        basePrice: 50,
        gstAmount: 5,
        totalPrice: 55,
      },
    })
    const body = await res.json()
    if (!body.success) {
      // Expected baseline for an environment with no Xero tokens stored yet.
      expect(res.status()).not.toBe(200)
      expect(body.error).toBeTruthy()
    } else {
      // If some prior run left a real Xero connection in place, the
      // invoice should come back with real Xero-assigned identifiers.
      expect(body.invoiceId).toBeTruthy()
    }
  })

  // ── Full connected flow (skipped -- needs a real Xero OAuth connection
  //    already established in platform_settings for this environment) ────
  test.skip('full Xero invoice creation flow (needs a connected Xero account)', async ({ request }) => {
    const res = await request.post(`${BASE}/api/xero/invoice`, {
      data: {
        bookingId: process.env.TEST_BOOKING_ID,
        customerName: 'Test Customer',
        serviceName: 'Cleaning',
        duration: 60,
        basePrice: 50,
        gstAmount: 5,
        totalPrice: 55,
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.invoiceId).toBeTruthy()
  })
})
