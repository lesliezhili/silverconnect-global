/**
 * Release 1 — public journey (safe against production: read-only).
 * Chinese seniors · cleaning / garden / handyman · Melbourne + Vancouver.
 */
import { test, expect } from '@playwright/test'

for (const L of ['en', 'zh'] as const) {
  const zh = L === 'zh'

  test.describe(`Release 1 public pages [${L}] @critical`, () => {
    test('landing shows the 3 services and both live cities', async ({ page }) => {
      await page.goto(`/${L}`)
      const main = page.locator('main')
      await expect(main.getByText(zh ? '墨尔本 · 已开通' : 'Melbourne · Now open')).toBeVisible()
      await expect(main.getByText(zh ? '温哥华 · 已开通' : 'Vancouver · Now open')).toBeVisible()
      for (const cat of ['cleaning', 'garden', 'repair']) {
        await expect(main.locator(`a[href$="/services/${cat}"]`).first()).toBeVisible()
      }
      // Nothing outside Release 1 on the landing page
      await expect(main.locator('a[href*="/book-service"]')).toHaveCount(0)
      await expect(main.locator('a[href*="/services/personalCare"]')).toHaveCount(0)
    })

    test('services list is exactly cleaning, garden, handyman', async ({ page }) => {
      await page.goto(`/${L}/services`)
      const cards = page.locator('main a[href*="/services/"]')
      await expect(cards).toHaveCount(3)
    })

    test('category page shows the 3 standard price tiers and a Book button', async ({ page }) => {
      await page.goto(`/${L}/services/cleaning`)
      const prices = page.getByRole('heading', { name: zh ? '标准价格' : 'Standard prices' })
      await expect(prices).toBeVisible()
      await expect(page.locator('main section li')).toHaveCount(3)
      await expect(page.getByRole('link', { name: zh ? '立即预约' : 'Book now', exact: true })).toHaveAttribute('href', /bookings\/new\?step=1&cat=cleaning/)
    })

    test('categories outside Release 1 are 404', async ({ page }) => {
      const res = await page.goto(`/${L}/services/personalCare`)
      expect(res?.status()).toBe(404)
    })

    for (const path of ['/book-service', '/book', '/xinyuzhe', '/devotional', '/donate', '/family', '/provider/licenses']) {
      test(`future route ${path} → coming-soon`, async ({ page }) => {
        await page.goto(`/${L}${path}`)
        await expect(page).toHaveURL(new RegExp(`/${L}/coming-soon$`))
        await expect(page.getByRole('link', { name: zh ? '查看服务' : 'See services' })).toBeVisible()
      })
    }

    test('booking requires sign-in', async ({ page }) => {
      await page.goto(`/${L}/bookings/new?step=1&cat=garden`)
      await expect(page).toHaveURL(/auth\/login/)
    })

    test('cancellation policy covers Canada', async ({ page }) => {
      await page.goto(`/${L}/cancellation-policy`)
      await expect(page.getByRole('heading', { name: 'Canada' })).toBeVisible()
    })
  })
}

/**
 * Signed-in booking journey up to payment. Writes data, so it only runs
 * against a staging database with Stripe TEST keys:
 *   SC_E2E_WRITE=1 SC_E2E_CUSTOMER_EMAIL=… SC_E2E_CUSTOMER_PASSWORD=…
 * The customer needs a saved address in a live area (e.g. postcode 3128).
 */
test.describe('Release 1 booking journey (staging only)', () => {
  test.skip(process.env.SC_E2E_WRITE !== '1', 'Set SC_E2E_WRITE=1 against staging with Stripe test keys')

  test('regular cleaning: tier → provider → address → pay page', async ({ page }) => {
    await page.goto('/en/auth/login')
    await page.getByLabel(/email/i).fill(process.env.SC_E2E_CUSTOMER_EMAIL!)
    await page.getByLabel(/password/i).fill(process.env.SC_E2E_CUSTOMER_PASSWORD!)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await page.waitForURL(/\/en\/(home|dashboard)/)

    await page.goto('/en/bookings/new?step=1&cat=cleaning')
    await page.locator('input[name="choice"][value="cleaning:regular"]').check()
    await page.getByRole('button', { name: /next/i }).click()

    await page.waitForURL(/step=2/)
    await page.locator('input[name="providerId"]').first().check()
    const when = new Date(Date.now() + 3 * 24 * 3600 * 1000)
    when.setHours(10, 0, 0, 0)
    const pad = (n: number) => String(n).padStart(2, '0')
    await page.locator('#scheduledAt').fill(
      `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}T10:00`,
    )
    await page.getByRole('button', { name: /next/i }).click()

    await page.waitForURL(/step=3/)
    await page.locator('input[name="addressId"]:not([disabled])').first().check()
    await page.getByRole('button', { name: /next/i }).click()

    await page.waitForURL(/step=4/)
    // Regular cleaning = fixed 2h package at the standard rate (A$55/h ex GST)
    await expect(page.getByText('2h × A$55')).toBeVisible()
    await page.getByRole('button', { name: /confirm & pay/i }).click()
    await page.waitForURL(/\/en\/pay\//)
  })
})
