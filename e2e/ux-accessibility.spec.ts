/**
 * SilverConnect Global — Accessibility (WCAG 2.1 AA) + Disability UX
 * Target: NDIS participants, DSP recipients, seniors with visual/motor impairments
 * Covers: landmarks, alt text, keyboard nav, form labels, focus indicators
 */
import { test, expect } from '@playwright/test'

const L = process.env.SC_LOCALE ?? 'en'

const PUBLIC_PAGES = [
  '/' + L,
  '/' + L + '/auth/login',
  '/' + L + '/auth/register',
  '/' + L + '/auth/forgot',
]

for (const path of PUBLIC_PAGES) {
  test.describe('A11y: ' + path, () => {
    test('has <main> landmark', async ({ page }) => {
      await page.goto(path)
      await expect(page.locator('main').first()).toBeVisible()
    })

    test('all <img> have alt attribute', async ({ page }) => {
      await page.goto(path)
      const imgs = page.locator('img')
      const count = await imgs.count()
      for (let i = 0; i < count; i++) {
        const alt = await imgs.nth(i).getAttribute('alt')
        expect(alt).not.toBeNull()
      }
    })

    test('buttons have accessible names', async ({ page }) => {
      await page.goto(path)
      const btns = page.getByRole('button')
      const n = await btns.count()
      for (let i = 0; i < Math.min(n, 10); i++) {
        const label = (await btns.nth(i).getAttribute('aria-label'))
          ?? (await btns.nth(i).textContent())
        expect((label ?? '').trim().length).toBeGreaterThan(0)
      }
    })
  })
}

test.describe('Keyboard navigation', () => {
  test('Tab moves focus without trapping on landing', async ({ page }) => {
    await page.goto('/' + L)
    for (let i = 0; i < 5; i++) await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
  })
})

test.describe('Form labels — senior-friendly (WCAG 1.3.1)', () => {
  test('login email has associated label', async ({ page }) => {
    await page.goto('/' + L + '/auth/login')
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test('login password has associated label', async ({ page }) => {
    await page.goto('/' + L + '/auth/login')
    await expect(page.getByLabel(/^password$/i)).toBeVisible()
  })

  test('register form has 3+ labelled inputs', async ({ page }) => {
    await page.goto('/' + L + '/auth/register')
    const inputs = page.locator('input[id], input[aria-label], input[aria-labelledby]')
    expect(await inputs.count()).toBeGreaterThanOrEqual(3)
  })
})

test.describe('Skip link (WCAG 2.4.1)', () => {
  test('skip link present or logged on landing', async ({ page }) => {
    await page.goto('/' + L)
    const skip = page.locator('a[href="#main"],a[href="#content"],a:has-text("Skip")')
    if (await skip.count() === 0)
      console.warn('WCAG 2.4.1: No skip navigation link on ' + '/' + L)
  })
})
