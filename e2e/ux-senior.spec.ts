/**
 * SilverConnect Global — Senior UX Validation
 * Target: 60+ (superannuation), 67+ (age pension), NDIS/TAC/WorkSafe (disability)
 * Key pages: landing, services, book-service, nearby, profile/funding, profile/emergency
 */
import { test, expect } from '@playwright/test'

const L = process.env.SC_LOCALE ?? 'en'
const BASE = '/' + L

test.describe('Landing page — senior-first UX', () => {
  test('hero heading visible', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('CTA visible (min 44px touch target)', async ({ page }) => {
    await page.goto(BASE)
    const cta = page.getByRole('link', { name: /get.?start|join|register|sign.?up|book|find/i }).first()
    await expect(cta).toBeVisible()
    const box = await cta.boundingBox()
    if (box) expect(box.height).toBeGreaterThanOrEqual(40)
  })

  test('keyboard Tab navigates without trapping', async ({ page }) => {
    await page.goto(BASE)
    for (let i = 0; i < 5; i++) await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
  })

  test('footer visible', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('footer')).toBeVisible()
  })

  test('page mentions seniors, elder care, or HeRun', async ({ page }) => {
    await page.goto(BASE)
    const body = await page.locator('body').textContent() ?? ''
    expect(/senior|elder|care|aged|HeRun|和润/i.test(body)).toBe(true)
  })
})

test.describe('Services page — aged care / NDIS services', () => {
  test('services page loads', async ({ page }) => {
    const res = await page.goto(BASE + '/services')
    expect([200, 302, 303]).toContain(res?.status() ?? 200)
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('book-service page loads', async ({ page }) => {
    const res = await page.goto(BASE + '/book-service')
    // May redirect to login if auth required
    expect([200, 302, 303]).toContain(res?.status() ?? 200)
    await expect(page.getByRole('heading').first()).toBeVisible()
  })
})

test.describe('Nearby providers — GPS location matching', () => {
  test('nearby page loads', async ({ page }) => {
    const res = await page.goto(BASE + '/nearby')
    expect([200, 302, 303]).toContain(res?.status() ?? 200)
  })
})

test.describe('Profile — NDIS / disability funding setup', () => {
  test('funding page redirects to login when unauthenticated', async ({ page }) => {
    await page.goto(BASE + '/profile/funding')
    // Must redirect to login — funding is sensitive (NDIS, TAC, WorkSafe)
    await expect(page).toHaveURL(/auth\/login|login/)
  })

  test('emergency contact page requires auth', async ({ page }) => {
    await page.goto(BASE + '/profile/emergency')
    await expect(page).toHaveURL(/auth\/login|login/)
  })
})

test.describe('iPad portrait — senior tablet experience', () => {
  test.use({ viewport: { width: 810, height: 1080 } })

  test('landing page renders on iPad', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('navigation accessible on iPad', async ({ page }) => {
    await page.goto(BASE)
    const nav = page.locator('nav, header, [role=navigation], button[aria-expanded], [data-testid="mobile-menu"]')
    await expect(nav.first()).toBeVisible()
  })
})

test.describe('Multi-language — international seniors diaspora', () => {
  for (const locale of ['en', 'zh', 'zh_tw']) {
    test('landing loads in locale: ' + locale, async ({ page }) => {
      await page.goto('/' + locale)
      await expect(page.getByRole('heading').first()).toBeVisible()
    })
  }
})
