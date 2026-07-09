/**
 * SilverConnect Global — Auth E2E
 * Routes: /{locale}/auth/login, /{locale}/auth/register, /{locale}/auth/forgot
 * Test email: lesliezhi.li@gmail.com
 */
import { test, expect } from '@playwright/test'

const L = process.env.SC_LOCALE ?? 'en'
const TEST_EMAIL = 'lesliezhi.li@gmail.com'
const TEST_PASS  = process.env.SC_TEST_PASSWORD ?? 'TestPass#2026!'

test.describe('Landing page (/{locale})', () => {
  test('loads and shows SilverConnect heading', async ({ page }) => {
    await page.goto('/' + L)
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('redirects logged-out user to landing (not /home)', async ({ page }) => {
    const res = await page.goto('/' + L + '/home')
    // Should redirect to login or landing
    await expect(page).not.toHaveURL(new RegExp('/' + L + '/home'))
  })
})

test.describe('Login page (/{locale}/auth/login)', () => {
  test('loads with accessible heading', async ({ page }) => {
    await page.goto('/' + L + '/auth/login')
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('has labelled email + password inputs', async ({ page }) => {
    await page.goto('/' + L + '/auth/login')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/^password$/i)).toBeVisible()
  })

  test('shows error for wrong credentials', async ({ page }) => {
    await page.goto('/' + L + '/auth/login')
    await page.getByLabel(/email/i).fill('wrong@example.com')
    await page.getByLabel(/^password$/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign.?in|log.?in/i }).click()
    // LoginForm is a client component that POSTs to /api/auth/login and
    // shows the error inline (role="alert") rather than via a URL redirect
    // — see the comment at the top of components/domain/LoginForm.tsx.
    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('forgot password link navigates to /auth/forgot', async ({ page }) => {
    await page.goto('/' + L + '/auth/login')
    const forgotLink = page.getByRole('link', { name: /forgot/i })
    if (await forgotLink.count() > 0) {
      await forgotLink.click()
      await expect(page).toHaveURL(new RegExp('auth/forgot'))
    }
  })
})

test.describe('Register page (/{locale}/auth/register)', () => {
  test('loads with accessible heading', async ({ page }) => {
    await page.goto('/' + L + '/auth/register')
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('form has at least 3 labelled fields', async ({ page }) => {
    await page.goto('/' + L + '/auth/register')
    const inputs = page.locator('input[id], input[aria-label], input[aria-labelledby]')
    expect(await inputs.count()).toBeGreaterThanOrEqual(3)
  })

  test('shows validation on empty submit', async ({ page }) => {
    await page.goto('/' + L + '/auth/register')
    await page.getByRole('button', { name: /register|sign.?up|create/i }).click()
    const errors = page.locator('[role=alert], .error, [data-error], [aria-invalid="true"]')
    if (await errors.count() === 0) {
      // Server-action redirect with ?error=
      await expect(page).toHaveURL(/error=/)
    }
  })
})

test.describe('Forgot password (/{locale}/auth/forgot)', () => {
  test('loads forgot password page', async ({ page }) => {
    await page.goto('/' + L + '/auth/forgot')
    await expect(page.getByRole('heading').first()).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })
})
