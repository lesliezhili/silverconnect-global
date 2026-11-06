/**
 * Release 1 — trust & quality, test-first:
 *  - background check lifecycle: upload → admin verify → matched → expiry
 *  - two-way feedback becomes booking preference (tier + preferred helpers)
 *  - customer cancellation tiers (refund / provider compensation)
 *  - evidence upload permissions
 * Isolated local database only (scripts/e2e-local.sh).
 */
import { test, expect, type Page } from '@playwright/test'
import {
  requireLocalDb, sql, signIn, book, pay, doJob, rate, wallet, customerCancel, choose, pdf, photo, inDays,
  GOOD, STANDBY, NEW_PROV,
} from './helpers/r1'

requireLocalDb()

const yesterday = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10)
const inYears = (y: number) => new Date(Date.now() + y * 365 * 86400000).toISOString().slice(0, 10)

async function helpersOffered(cust: Page, cat: 'cleaning' | 'garden' | 'repair'): Promise<string[]> {
  await cust.goto(`/en/bookings/new?step=1&cat=${cat}`)
  await cust.getByRole('button', { name: 'Next', exact: true }).click()
  await cust.waitForURL(/step=2/)
  return cust.locator('input[name="providerId"]').evaluateAll((els) =>
    els.map((el) => (el.closest('label')?.textContent ?? '').replace(/\s+/g, ' ').trim()),
  )
}

async function adminVerify(admin: Page, documentId: string) {
  return admin.request.post('/api/admin/verify-document', { data: { documentId, action: 'verify' } })
}

test.describe('background check', () => {
  test('a police check or ID must come with an uploaded file', async ({ browser }) => {
    const prov = await signIn(browser, 'prov-new@e2e.test')
    const res = await prov.request.post('/api/provider/wwvp-upload', { data: { documentType: 'police_check' } })
    expect(res.status()).toBe(400)
  })

  test('an already-expired police check is refused at upload', async ({ browser }) => {
    const prov = await signIn(browser, 'prov-new@e2e.test')
    const res = await prov.request.post('/api/provider/wwvp-upload', {
      multipart: { file: pdf('police'), documentType: 'police_check', expiryDate: yesterday() },
    })
    expect(res.status()).toBe(400)
  })

  test('documents page asks for police check and photo ID; WWC optional', async ({ browser }) => {
    const prov = await signIn(browser, 'prov-new@e2e.test')
    await prov.goto('/en/provider/documents')
    await expect(prov.getByText('Photo ID (driver licence or passport)')).toBeVisible()
    await expect(prov.getByText(/Working With Children .*\(optional\)/)).toBeVisible()
  })

  test('upload → not matched while pending → admin verifies → matched', async ({ browser }) => {
    const prov = await signIn(browser, 'prov-new@e2e.test')
    for (const [type, extra] of [['police_check', { expiryDate: inYears(2) }], ['identity', {}]] as const) {
      const res = await prov.request.post('/api/provider/wwvp-upload', {
        multipart: { file: pdf(type), documentType: type, ...extra },
      })
      expect(res.ok(), type).toBeTruthy()
    }
    const docs = await sql`SELECT id, type, status FROM provider_documents WHERE provider_id = ${NEW_PROV} ORDER BY type`
    expect(docs.map((d) => `${d.type}:${d.status}`).sort()).toEqual(['identity:pending', 'police_check:pending'])

    const cust = await signIn(browser, 'cust-au@e2e.test')
    expect((await helpersOffered(cust, 'garden')).join('|')).not.toContain('New Helper')

    const admin = await signIn(browser, 'admin@e2e.test')
    for (const d of docs) expect((await adminVerify(admin, d.id)).ok()).toBeTruthy()
    const [p] = await sql`SELECT onboarding_status FROM provider_profiles WHERE id = ${NEW_PROV}`
    expect(p.onboarding_status).toBe('approved')
    expect((await helpersOffered(cust, 'garden')).join('|')).toContain('New Helper')
  })

  test('admin cannot approve an expired document', async ({ browser }) => {
    const [d] = await sql`UPDATE provider_documents SET status = 'pending', expires_at = NOW() - INTERVAL '1 day'
      WHERE provider_id = ${NEW_PROV} AND type = 'police_check' RETURNING id`
    const admin = await signIn(browser, 'admin@e2e.test')
    const res = await adminVerify(admin, d.id)
    expect(res.status()).toBe(400)
    const [after] = await sql`SELECT status FROM provider_documents WHERE id = ${d.id}`
    expect(after.status).toBe('pending')
  })

  test('an expired police check removes the provider from matching and flags it for admin', async ({ browser }) => {
    await sql`UPDATE provider_documents SET status = 'approved', expires_at = NOW() - INTERVAL '1 day'
      WHERE provider_id = ${NEW_PROV} AND type = 'police_check'`
    const cust = await signIn(browser, 'cust-au@e2e.test')
    expect((await helpersOffered(cust, 'garden')).join('|')).not.toContain('New Helper')
    const admin = await browser.newContext().then((c) => c.newPage())
    await admin.goto('/en/admin/login')
    await admin.locator('input[name="email"]').fill('admin@e2e.test')
    await admin.locator('input[name="password"]').fill('E2e-pass-123!')
    await admin.locator('form').getByRole('button').click()
    await admin.waitForURL(/\/en\/admin$/)
    await admin.goto('/en/admin/quality')
    await expect(
      admin.locator('li', { hasText: 'New Helper' }).filter({ hasText: 'police check / ID missing or expired' }),
    ).toBeVisible()
  })
})

test.describe('two-way feedback → booking preferences', () => {
  test('provider rates the customer by aspect and suggests the next tier', async ({ browser }) => {
    const cust = await signIn(browser, 'cust-au@e2e.test')
    const id = await book(cust, { cat: 'garden', tier: 'regular', provider: 'Good Helper', days: 20 })
    await pay(cust, id)
    const prov = await signIn(browser, 'prov-good@e2e.test')
    await doJob(prov, id)

    await prov.goto(`/en/provider/jobs/${id}`)
    const form = prov.locator('[data-testid="rate-customer"]')
    await form.getByRole('radio', { name: '5 stars' }).click()
    await form.getByLabel('Easy access to the home').selectOption('5')
    await form.getByLabel('Job matched the booking').selectOption('2')
    await form.getByLabel('Respectful and safe').selectOption('5')
    await form.getByLabel('Next visit should be').selectOption('high')
    await form.getByRole('button', { name: /Submit/ }).click()
    await expect(form.getByText(/Thanks/)).toBeVisible()

    const [r] = await sql`SELECT rating, aspects, suggested_tier FROM reviews
      WHERE booking_id = ${id} AND direction = 'provider_to_customer'`
    expect(r).toMatchObject({ rating: 5, suggested_tier: 'high', aspects: { access: 5, accurate_description: 2, respect: 5 } })
  })

  test("the helper's tier suggestion preselects the next booking, with who recommended it", async ({ browser }) => {
    const cust = await signIn(browser, 'cust-au@e2e.test')
    await cust.goto('/en/bookings/new?step=1&cat=garden')
    await expect(cust.locator('input[name="choice"][value="garden:high"]')).toBeChecked()
    await expect(cust.getByText('Recommended by Good Helper after your last visit')).toBeVisible()
    // Other categories are unaffected.
    await cust.goto('/en/bookings/new?step=1&cat=repair')
    await expect(cust.locator('input[name="choice"][value="repair:regular"]')).toBeChecked()
  })

  test('helpers the customer rated highly or favourited are offered first', async ({ browser }) => {
    const cust = await signIn(browser, 'cust-au@e2e.test')
    const [b] = await sql`SELECT b.id FROM bookings b JOIN services s ON s.id = b.service_id
      WHERE b.customer_id = '00000000-0000-4000-a000-000000000001' AND s.category_code = 'garden'
        AND b.status = 'completed' ORDER BY b.created_at DESC LIMIT 1`
    await cust.goto(`/en/bookings/${b.id}/feedback`)
    await choose(cust.locator('input[name="rating"][value="5"]'))
    await cust.locator('select[name="aspect_quality"]').selectOption('5')
    await cust.getByRole('button', { name: 'Submit & release payment' }).click()
    await cust.waitForURL(/sent=1/)

    const fav = await cust.request.post('/api/favourites', { data: { providerId: STANDBY } })
    expect(fav.ok()).toBeTruthy()

    const offered = await helpersOffered(cust, 'garden')
    expect(offered[0]).toContain('Good Helper')
    expect(offered[0]).toContain('You rated ★5')
    expect(offered[1]).toContain('Standby Helper')
    expect(offered[1]).toContain('Your favourite')
  })
})

test.describe('customer cancellation tiers (Australia)', () => {
  async function paidBooking(browser: import('@playwright/test').Browser, hoursAhead: number) {
    const cust = await signIn(browser, 'cust-au@e2e.test')
    const id = await book(cust, { cat: 'repair', tier: 'regular', provider: 'Good Helper', days: 25, jobType: 'door' })
    await pay(cust, id)
    await sql`UPDATE bookings SET scheduled_at = NOW() + make_interval(hours => ${hoursAhead}) WHERE id = ${id}`
    const [t] = await sql`SELECT total_price::float AS total FROM bookings WHERE id = ${id}`
    return { cust, id, total: t.total as number }
  }

  test('24–48 h before: 50% refund, 50% to the provider for the held slot', async ({ browser }) => {
    const before = await wallet(GOOD)
    const { cust, id, total } = await paidBooking(browser, 30)
    await customerCancel(cust, id)
    const [c] = await sql`SELECT refund_amount::float AS refund, provider_compensation::float AS comp FROM cancellations WHERE booking_id = ${id}`
    expect(c.refund).toBeCloseTo(total * 0.5, 2)
    expect(c.comp).toBeCloseTo(total * 0.5, 2)
    expect((await wallet(GOOD)).a).toBeCloseTo(before.a + total * 0.5, 2)
  })

  test('under 24 h before: no refund, 90% to the provider', async ({ browser }) => {
    const { cust, id, total } = await paidBooking(browser, 10)
    await customerCancel(cust, id)
    const [c] = await sql`SELECT refund_amount::float AS refund, provider_compensation::float AS comp FROM cancellations WHERE booking_id = ${id}`
    expect(c.refund).toBe(0)
    expect(c.comp).toBeCloseTo(total * 0.9, 2)
  })
})

test.describe('evidence permissions', () => {
  test('only the assigned provider can add before/after photos; customers only feedback photos after completion', async ({ browser }) => {
    const cust = await signIn(browser, 'cust-au@e2e.test')
    const id = await book(cust, { cat: 'garden', tier: 'regular', provider: 'Good Helper', days: 26 })
    await pay(cust, id)
    const other = await signIn(browser, 'prov-standby@e2e.test')
    const asOther = await other.request.post('/api/upload/evidence', { multipart: { file: photo('x'), bookingId: id, type: 'before', area: 'front' } })
    expect(asOther.status()).toBe(403)
    const asCustomerBefore = await cust.request.post('/api/upload/evidence', { multipart: { file: photo('x'), bookingId: id, type: 'before', area: 'front' } })
    expect(asCustomerBefore.status()).toBe(403)
    const feedbackTooEarly = await cust.request.post('/api/upload/evidence', { multipart: { file: photo('x'), bookingId: id, type: 'feedback' } })
    expect(feedbackTooEarly.status()).toBe(403)
  })
})
