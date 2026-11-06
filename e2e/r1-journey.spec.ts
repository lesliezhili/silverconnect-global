/**
 * Release 1 — full journey against the ISOLATED local database
 * (scripts/e2e-local.sh): book → pay → before photos → after photos +
 * checklist → feedback → payout; quotes; low-rating hold with photo
 * evidence + admin release; short-visit QC flag; cancellations; trust gate
 * (background check, low rating, paused customer); Canada pricing.
 *
 *   ./scripts/e2e-local.sh
 *   SC_E2E_DB_URL=postgres://postgres:sc_e2e@localhost:55432/sc_e2e \
 *   PLAYWRIGHT_BASE_URL=http://localhost:3021 CI=1 \
 *   npx playwright test e2e/r1-journey.spec.ts --project=chromium
 *
 * The app server must use the same database and no Stripe keys
 * (simulated payment). Refuses to run against anything but localhost.
 */
import { test, expect } from '@playwright/test'
import {
  requireLocalDb, sql, signIn, status, inDays, book, pay, evidence, rate, wallet, withdraw, choose, photo,
  GOOD, STANDBY, PW,
} from './helpers/r1'

requireLocalDb()

test('trust gate: only background-checked, well-rated providers in the customer\'s country', async ({ browser }) => {
  const cust = await signIn(browser, 'cust-au@e2e.test')
  await cust.goto('/en/bookings/new?step=1&cat=cleaning')
  await cust.getByRole('button', { name: 'Next', exact: true }).click()
  await cust.waitForURL(/step=2/)
  await expect(cust.getByText('Good Helper')).toBeVisible()
  await expect(cust.getByText('No Check Helper')).toHaveCount(0) // no police check / ID
  await expect(cust.getByText('Low Rated Helper')).toHaveCount(0) // 2★ average
  await expect(cust.getByText('Vancouver Helper')).toHaveCount(0) // other country
})

test('paused customer cannot book', async ({ browser }) => {
  const bad = await signIn(browser, 'cust-bad@e2e.test')
  await bad.goto('/en/bookings/new?step=1&cat=cleaning')
  await expect(bad.getByText('Your account is paused from booking')).toBeVisible()
  await expect(bad.getByRole('button', { name: 'Next', exact: true })).toHaveCount(0)
})

test('address outside a live area is not selectable', async ({ browser }) => {
  const cust = await signIn(browser, 'cust-au@e2e.test')
  await cust.goto('/en/bookings/new?step=1&cat=garden')
  await cust.getByRole('button', { name: 'Next', exact: true }).click()
  await cust.getByRole('radio', { name: /Good Helper/ }).check()
  await cust.locator('#scheduledAt').fill(inDays(9))
  await cust.getByRole('button', { name: 'Next', exact: true }).click()
  await cust.waitForURL(/step=3/)
  await expect(cust.locator('input[name="addressId"][value="00000000-0000-4000-b000-000000000002"]')).toBeDisabled()
})

test('happy path: regular cleaning → pay → before/after photos → 5★ → payout once', async ({ browser }) => {
  const cust = await signIn(browser, 'cust-au@e2e.test')
  const id = await book(cust, { cat: 'cleaning', tier: 'regular', provider: 'Good Helper', expectPrice: '2h × A$55' })
  await expect(cust.getByText('A$121.00').first()).toBeVisible()
  await pay(cust, id)

  const prov = await signIn(browser, 'prov-good@e2e.test')
  // Start needs a before photo of kitchen, bathroom and living area.
  await evidence(prov, id, 'On the way')
  await expect.poll(() => status(id)).toBe('in_progress')
  const [ev] = await sql`SELECT array_agg(description ORDER BY description) AS areas FROM booking_evidence WHERE booking_id = ${id} AND phase = 'before'`
  expect(ev.areas).toEqual(['bathroom', 'kitchen', 'living'])

  // Two hours on site, then complete with after photos + checklist.
  await sql`UPDATE bookings SET started_at = NOW() - INTERVAL '2 hours' WHERE id = ${id}`
  await evidence(prov, id, 'Mark complete')
  await expect.poll(() => status(id)).toBe('completed')
  const [b] = await sql`SELECT qc_flag, qc_checklist FROM bookings WHERE id = ${id}`
  expect(b.qc_flag).toBeNull()
  expect(Object.values(b.qc_checklist as Record<string, boolean>).every(Boolean)).toBe(true)
  const before = await wallet(GOOD)

  // Customer sees before/after side by side, rates 5★ → released.
  await cust.goto(`/en/bookings/${id}/feedback`)
  await expect(cust.locator('main img')).toHaveCount(6)
  await rate(cust, id, 5)
  await cust.waitForURL(/sent=1/)
  expect(await status(id)).toBe('released')
  const after = await wallet(GOOD)
  expect(after.a - before.a).toBeCloseTo(102.85, 2) // 85% of A$121
  expect(after.p).toBeCloseTo(before.p - 102.85, 2) // moved out of pending

  // Re-submitting feedback must not pay again.
  const again = await cust.request.post(`/api/bookings/${id}/feedback`, { data: { rating: 5 } })
  expect(again.ok()).toBeTruthy()
  expect((await wallet(GOOD)).a).toBeCloseTo(after.a, 2)
})

test('completion is blocked until every area has an after photo and the checklist is ticked', async ({ browser }) => {
  const cust = await signIn(browser, 'cust-au@e2e.test')
  const id = await book(cust, { cat: 'garden', tier: 'regular', provider: 'Good Helper', days: 11 })
  await pay(cust, id)
  const prov = await signIn(browser, 'prov-good@e2e.test')
  await evidence(prov, id, 'On the way')
  await expect.poll(() => status(id)).toBe('in_progress')
  // Submit-button stays disabled with the checklist unticked.
  await prov.goto(`/en/provider/jobs/${id}`)
  await prov.getByRole('button', { name: 'Mark complete' }).first().click()
  const dialog = prov.getByRole('dialog')
  for (const input of await dialog.locator('input[type="file"]').all()) await input.setInputFiles(photo('after'))
  await expect(dialog.getByRole('button', { name: 'Mark complete' })).toBeDisabled()
  expect(await status(id)).toBe('in_progress')
})

test('short visit is flagged and the payout held; admin releases after review', async ({ browser }) => {
  const cust = await signIn(browser, 'cust-au@e2e.test')
  const id = await book(cust, { cat: 'repair', tier: 'regular', provider: 'Good Helper', days: 12, jobType: 'furniture' })
  await pay(cust, id)
  const prov = await signIn(browser, 'prov-good@e2e.test')
  await evidence(prov, id, 'On the way')
  await expect.poll(() => status(id)).toBe('in_progress')
  await evidence(prov, id, 'Mark complete') // immediately: < 60% of booked time
  await expect.poll(() => status(id)).toBe('completed')
  const [b] = await sql`SELECT qc_flag, job_type FROM bookings WHERE id = ${id}`
  expect(b).toMatchObject({ qc_flag: 'short_visit', job_type: 'furniture' })

  await rate(cust, id, 5)
  await cust.waitForURL(/held=1/)
  expect(await status(id)).toBe('completed')

  const admin = await browser.newContext().then((c) => c.newPage())
  await admin.goto('/en/admin/login')
  await admin.locator('input[name="email"]').fill('admin@e2e.test')
  await admin.locator('input[name="password"]').fill(PW)
  await admin.locator('form').getByRole('button').click()
  await admin.waitForURL(/\/en\/admin$/)
  await admin.goto('/en/admin/quality')
  const row = admin.locator('tr', { hasText: 'QC: short_visit' })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Release' }).click()
  await admin.waitForURL(/released=/)
  expect(await status(id)).toBe('released')
})

test('forged admin cookie does not open the admin panel', async ({ browser }) => {
  const ctx = await browser.newContext()
  const url = new URL(test.info().project.use.baseURL ?? 'http://localhost:3021')
  await ctx.addCookies([{ name: 'sc-admin', value: 'attacker%40example.com', domain: url.hostname, path: '/' }])
  const page = await ctx.newPage()
  await page.goto('/en/admin/quality')
  await expect(page).toHaveURL(/admin\/login/)
})

test('1★ needs photo evidence and holds the payout; the pair is never matched again', async ({ browser }) => {
  const cust = await signIn(browser, 'cust-au@e2e.test')
  const id = await book(cust, { cat: 'cleaning', tier: 'regular', provider: 'Good Helper', days: 13 })
  await pay(cust, id)
  const prov = await signIn(browser, 'prov-good@e2e.test')
  await evidence(prov, id, 'On the way')
  await expect.poll(() => status(id)).toBe('in_progress')
  await sql`UPDATE bookings SET started_at = NOW() - INTERVAL '2 hours' WHERE id = ${id}`
  await evidence(prov, id, 'Mark complete')
  await expect.poll(() => status(id)).toBe('completed')

  await rate(cust, id, 1)
  await cust.waitForURL(/error=photo_required/)
  await cust.locator('main input[type="file"]').setInputFiles([photo('stain1'), photo('stain2')])
  await expect(cust.getByText('2/3 uploaded')).toBeVisible()
  await choose(cust.locator('input[name="rating"][value="1"]'))
  await cust.getByRole('button', { name: 'Submit & release payment' }).click()
  await cust.waitForURL(/held=1/)
  expect(await status(id)).toBe('completed')
  const [n] = await sql`SELECT count(*)::int AS n FROM booking_evidence WHERE booking_id = ${id} AND phase = 'feedback'`
  expect(n.n).toBe(2)

  // Pair blocked: Good Helper is no longer offered to this customer.
  await cust.goto('/en/bookings/new?step=1&cat=cleaning')
  await cust.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(cust.getByText('Good Helper')).toHaveCount(0)
  // Undo for the following tests.
  await sql`DELETE FROM reviews WHERE booking_id = ${id}`
})

test('quote after a medium first job: real time → customer approves → next booking uses it', async ({ browser }) => {
  const cust = await signIn(browser, 'cust-au@e2e.test')
  const id = await book(cust, { cat: 'cleaning', tier: 'medium', provider: 'Good Helper', days: 14, expectPrice: '3h × A$66' })
  await pay(cust, id)
  const prov = await signIn(browser, 'prov-good@e2e.test')
  await evidence(prov, id, 'On the way')
  await expect.poll(() => status(id)).toBe('in_progress')
  await sql`UPDATE bookings SET started_at = NOW() - INTERVAL '4 hours' WHERE id = ${id}` // took 4h, booked 3h
  await evidence(prov, id, 'Mark complete')
  await expect.poll(() => status(id)).toBe('completed')

  await prov.goto(`/en/provider/jobs/${id}`)
  await expect(prov.locator('select[name="tier"]')).toHaveValue('medium')
  await expect(prov.locator('input[name="hours"]')).toHaveValue('4')
  await prov.locator('textarea[name="reason"]').fill('Heavy kitchen grease — the job took 4 hours.')
  await prov.getByRole('button', { name: 'Send quote to customer' }).click()
  await prov.waitForURL(/quote=sent/)

  await cust.goto(`/en/bookings/${id}`)
  await expect(cust.getByText('Heavy kitchen grease')).toBeVisible()
  await cust.getByRole('button', { name: 'Approve quote' }).click()
  await cust.waitForURL(/quote=approved/)

  // Next medium cleaning with the same provider is priced from the quote: 4h × A$66.
  const next = await book(cust, { cat: 'cleaning', tier: 'medium', provider: 'Good Helper', days: 21, expectPrice: '4h × A$66' })
  const [nb] = await sql`SELECT duration_min, base_price::float AS base FROM bookings WHERE id = ${next}`
  expect(nb).toMatchObject({ duration_min: 240, base: 264 })
})

test('customer cancels ≥7 days ahead: full refund; provider declines: emergency team takes it', async ({ browser }) => {
  const cust = await signIn(browser, 'cust-au@e2e.test')
  const paid = await book(cust, { cat: 'garden', tier: 'medium', provider: 'Good Helper', days: 15 })
  await pay(cust, paid)
  await cust.goto(`/en/bookings/${paid}`)
  // dispatchEvent: the Next.js dev-mode badge overlaps this corner in `next dev`.
  await cust.getByRole('button', { name: 'Cancel', exact: true }).dispatchEvent('click')
  await expect.poll(() => status(paid)).toBe('cancelled')
  const [c1] = await sql`SELECT reason, refund_amount::float AS refund, policy_applied FROM cancellations WHERE booking_id = ${paid}`
  expect(c1).toMatchObject({ reason: 'customer_request', policy_applied: '7+ days' })
  const [b1] = await sql`SELECT total_price::float AS total FROM bookings WHERE id = ${paid}`
  expect(c1.refund).toBeCloseTo(b1.total, 2)

  // Provider declines an unpaid request: free for them, and the emergency
  // team picks it up so the customer still has a helper.
  const unpaid = await book(cust, { cat: 'repair', tier: 'medium', provider: 'Good Helper', days: 16, jobType: 'hanging' })
  const prov = await signIn(browser, 'prov-good@e2e.test')
  await withdraw(prov, unpaid, 'Decline')
  await expect.poll(async () => (await sql`SELECT provider_id FROM bookings WHERE id = ${unpaid}`)[0].provider_id).toBe(STANDBY)
  expect(await status(unpaid)).toBe('pending')
  const [c2] = await sql`SELECT policy_applied, provider_penalty::float AS pen FROM cancellations WHERE booking_id = ${unpaid}`
  expect(c2).toMatchObject({ policy_applied: 'provider_declined', pen: 0 })
})

test('provider cancels <48h before: emergency team covers, provider pays 10% + strike', async ({ browser }) => {
  const cust = await signIn(browser, 'cust-au@e2e.test')
  const id = await book(cust, { cat: 'garden', tier: 'regular', provider: 'Good Helper', days: 17 })
  await pay(cust, id)
  await sql`UPDATE bookings SET scheduled_at = NOW() + INTERVAL '20 hours' WHERE id = ${id}`
  const before = await wallet(GOOD)
  const prov = await signIn(browser, 'prov-good@e2e.test')
  await withdraw(prov, id, 'Cancel booking')
  await expect.poll(async () => (await sql`SELECT provider_id FROM bookings WHERE id = ${id}`)[0].provider_id).toBe(STANDBY)
  expect(await status(id)).toBe('confirmed') // same booking, same time, same price
  const [c] = await sql`SELECT policy_applied, provider_penalty::float AS pen, refund_amount::float AS refund FROM cancellations WHERE booking_id = ${id}`
  expect(c).toMatchObject({ policy_applied: 'provider_<48h', pen: 13.2, refund: 0 }) // 10% of A$132 (2h × A$60 + GST)
  expect((await wallet(GOOD)).a).toBeCloseTo(before.a - 13.2, 2)
  const [r] = await sql`SELECT replacement_provider_id FROM emergency_reroutes WHERE booking_id = ${id}`
  expect(r.replacement_provider_id).toBe(STANDBY)
})

test('provider cancels <12h with nobody free: full refund, 25% penalty, admins alerted', async ({ browser }) => {
  await sql`UPDATE provider_profiles SET onboarding_status = 'suspended' WHERE id = ${STANDBY}`
  try {
    const cust = await signIn(browser, 'cust-au@e2e.test')
    const id = await book(cust, { cat: 'garden', tier: 'regular', provider: 'Good Helper', days: 18 })
    await pay(cust, id)
    await sql`UPDATE bookings SET scheduled_at = NOW() + INTERVAL '5 hours' WHERE id = ${id}`
    const prov = await signIn(browser, 'prov-good@e2e.test')
    await withdraw(prov, id, 'Cancel booking')
    await expect.poll(() => status(id)).toBe('cancelled')
    const [c] = await sql`SELECT policy_applied, provider_penalty::float AS pen, refund_amount::float AS refund FROM cancellations WHERE booking_id = ${id}`
    const [b] = await sql`SELECT total_price::float AS total FROM bookings WHERE id = ${id}`
    expect(c).toMatchObject({ policy_applied: 'provider_<12h' })
    expect(c.refund).toBeCloseTo(b.total, 2) // customer fully refunded
    expect(c.pen).toBeCloseTo(b.total * 0.25, 2)
    const [n] = await sql`SELECT count(*)::int AS n FROM notifications WHERE related_booking_id = ${id} AND title = 'Emergency: no cover found'`
    expect(n.n).toBeGreaterThan(0)
  } finally {
    await sql`UPDATE provider_profiles SET onboarding_status = 'approved' WHERE id = ${STANDBY}`
  }
})

test('3 late cancellations / no-shows in 90 days pause the customer', async ({ browser }) => {
  const HIST = '00000000-0000-4000-a000-000000000004'
  const rows = await sql`SELECT id FROM bookings WHERE customer_id = ${HIST} LIMIT 3`
  const policies = ['<12h', '12-24h', 'no-show_no_show']
  for (const [i, r] of rows.entries()) {
    await sql`INSERT INTO cancellations (booking_id, cancelled_by, reason, policy_applied) VALUES (${r.id}, ${HIST}, 'customer_request', ${policies[i]})`
  }
  const hist = await signIn(browser, 'cust-hist@e2e.test')
  await hist.goto('/en/bookings/new?step=1&cat=cleaning')
  await expect(hist.getByText('Your account is paused from booking')).toBeVisible()
})

test('Vancouver is on the waitlist: a Richmond BC customer cannot book yet', async ({ browser }) => {
  const ca = await signIn(browser, 'cust-ca@e2e.test')
  await ca.goto('/en/bookings/new?step=1&cat=cleaning')
  await expect(ca.locator('label', { hasText: 'Regular' }).getByText('A$110')).toBeVisible() // AU market until Canada opens
  await ca.getByRole('button', { name: 'Next', exact: true }).click()
  await ca.waitForURL(/step=2/)
  await expect(ca.getByText('Vancouver Helper')).toHaveCount(0)
  await ca.getByRole('radio', { name: /Good Helper/ }).check()
  await ca.locator('#scheduledAt').fill(inDays(10))
  await ca.getByRole('button', { name: 'Next', exact: true }).click()
  await ca.waitForURL(/step=3/)
  await expect(ca.locator('input[name="addressId"]').first()).toBeDisabled()
  await expect(ca.getByText('Not in a service area yet')).toBeVisible()
})
