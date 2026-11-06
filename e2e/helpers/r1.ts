/**
 * Shared helpers for the Release 1 E2E suites (r1-journey, r1-trust).
 * Talk to the ISOLATED local database only — see scripts/e2e-local.sh.
 */
import { test, expect, type Browser, type Page, type Locator } from '@playwright/test'
import postgres from 'postgres'

const DB_URL = process.env.SC_E2E_DB_URL ?? ''
export const LOCAL = /^postgres(ql)?:\/\/[^@]+@(localhost|127\.0\.0\.1):/.test(DB_URL)

/** Call at the top of every spec that writes data. */
export function requireLocalDb() {
  test.skip(!LOCAL, 'Set SC_E2E_DB_URL to the local E2E database (scripts/e2e-local.sh)')
  test.describe.configure({ mode: 'serial' })
}

export const PW = 'E2e-pass-123!'
// idle_timeout lets the shared client close on its own between spec files.
export const sql = LOCAL ? postgres(DB_URL, { max: 2, idle_timeout: 2 }) : (null as unknown as ReturnType<typeof postgres>)

export const GOOD = '00000000-0000-4000-c000-000000000011'
export const STANDBY = '00000000-0000-4000-c000-000000000015' // emergency cover team
export const NEW_PROV = '00000000-0000-4000-c000-000000000016' // not yet background-checked

// 1×1 PNG — compressed and uploaded like a phone photo.
const PHOTO = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)
export const photo = (name: string) => ({ name: `${name}.png`, mimeType: 'image/png', buffer: PHOTO })
export const pdf = (name: string) => ({ name: `${name}.pdf`, mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 e2e') })

/** Selects a visually hidden (sr-only) radio reliably and confirms it stuck. */
export async function choose(radio: Locator) {
  await radio.waitFor({ state: 'attached' })
  await expect(async () => {
    await radio.evaluate((el) => (el as HTMLInputElement).click())
    expect(await radio.isChecked()).toBe(true)
  }).toPass()
}

export async function signIn(browser: Browser, email: string): Promise<Page> {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  const res = await page.request.post('/api/auth/login', { data: { email, password: PW } })
  expect(res.ok(), `login ${email}`).toBeTruthy()
  return page
}

export async function status(id: string): Promise<string> {
  const [b] = await sql`SELECT status FROM bookings WHERE id = ${id}`
  return b.status
}

export function inDays(days: number, hour = 10): string {
  const d = new Date(Date.now() + days * 86400000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(hour)}:00`
}

/** Customer books through the UI and lands on the payment page; returns the booking id. */
export async function book(
  page: Page,
  o: { cat: 'cleaning' | 'garden' | 'repair'; tier?: 'regular' | 'medium' | 'high'; provider: string; days?: number; jobType?: string; expectPrice?: string },
): Promise<string> {
  await page.goto(`/en/bookings/new?step=1&cat=${o.cat}`)
  if (o.tier) await page.locator(`input[name="choice"][value="${o.cat}:${o.tier}"]`).check()
  if (o.jobType) await page.locator('#jobType').selectOption(o.jobType)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.waitForURL(/step=2/)
  await page.getByRole('radio', { name: new RegExp(o.provider) }).check()
  await page.locator('#scheduledAt').fill(inDays(o.days ?? 10))
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.waitForURL(/step=3/)
  await page.locator('input[name="addressId"]:not([disabled])').first().check()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.waitForURL(/step=4/)
  if (o.expectPrice) await expect(page.getByText(o.expectPrice)).toBeVisible()
  await page.getByRole('button', { name: /Confirm & pay/ }).click()
  await page.waitForURL(/\/en\/pay\//)
  return page.url().split('/pay/')[1].split(/[?#]/)[0]
}

export async function pay(page: Page, id: string) {
  await page.goto(`/en/pay/${id}`)
  await page.getByRole('button', { name: /Pay securely/ }).click()
  await page.waitForURL(new RegExp(`/bookings/${id}/success`))
  expect(await status(id)).toBe('confirmed')
}

/** Provider uploads a photo for every QC area (and ticks the checklist) through the modal. */
export async function evidence(page: Page, id: string, trigger: 'On the way' | 'Mark complete', tickAll = true) {
  await page.goto(`/en/provider/jobs/${id}`)
  await page.getByRole('button', { name: trigger }).first().click()
  const dialog = page.getByRole('dialog')
  const inputs = dialog.locator('input[type="file"]')
  const n = await inputs.count()
  expect(n).toBeGreaterThan(0)
  for (let i = 0; i < n; i++) await inputs.nth(i).setInputFiles(photo(`area${i}`))
  if (tickAll) for (const box of await dialog.locator('input[type="checkbox"]').all()) await box.check()
  await dialog.getByRole('button', { name: trigger }).click()
}

/** Full provider job: start with before photos, ~on time, complete with after photos + checklist. */
export async function doJob(prov: Page, id: string, onSiteHours = 2) {
  await evidence(prov, id, 'On the way')
  await expect.poll(() => status(id)).toBe('in_progress')
  await sql`UPDATE bookings SET started_at = NOW() - make_interval(hours => ${onSiteHours}) WHERE id = ${id}`
  await evidence(prov, id, 'Mark complete')
  await expect.poll(() => status(id)).toBe('completed')
}

export async function rate(page: Page, id: string, stars: number) {
  await page.goto(`/en/bookings/${id}/feedback`)
  await choose(page.locator(`input[name="rating"][value="${stars}"]`))
  await page.getByRole('button', { name: 'Submit & release payment' }).click()
}

export async function wallet(providerId: string) {
  const [w] = await sql`SELECT balance_available::float AS a, balance_pending::float AS p FROM wallets WHERE provider_id = ${providerId}`
  return w ?? { a: 0, p: 0 }
}

/** Provider declines / cancels through the modal, picking the first reason. */
export async function withdraw(page: Page, id: string, trigger: 'Decline' | 'Cancel booking') {
  await page.goto(`/en/provider/jobs/${id}`)
  // dispatchEvent: the Next.js dev-mode badge overlaps the bottom-left button in `next dev`.
  await page.getByRole('button', { name: trigger }).first().dispatchEvent('click')
  const dialog = page.getByRole('dialog')
  await choose(dialog.locator('input[name="reason"]').first())
  await dialog.getByRole('button', { name: trigger }).click()
}

/** Customer cancels from the booking page. */
export async function customerCancel(page: Page, id: string) {
  await page.goto(`/en/bookings/${id}`)
  // dispatchEvent: the Next.js dev-mode badge overlaps this corner in `next dev`.
  await page.getByRole('button', { name: 'Cancel', exact: true }).dispatchEvent('click')
  await expect.poll(() => status(id)).toBe('cancelled')
}
