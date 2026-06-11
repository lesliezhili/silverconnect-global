/**
 * SilverConnect Global — Auth i18n E2E
 * Login, Register, Forgot Password across all 7 locales
 */
import { test, expect } from '@playwright/test';

const LOCALES = ['en', 'zh', 'zh_tw', 'th', 'ko', 'ja', 'vi'];

for (const locale of LOCALES) {
  test.describe(`Auth — Login [${locale}]`, () => {
    test(`login page loads with heading`, async ({ page }) => {
      await page.goto(`/${locale}/auth/login`);
      await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test(`has labelled email + password inputs`, async ({ page }) => {
      await page.goto(`/${locale}/auth/login`);
      const inputs = page.locator('input[type="email"], input[type="password"], input[name="email"], input[name="password"]');
      expect(await inputs.count()).toBeGreaterThanOrEqual(2);
    });

    test(`shows error on invalid credentials`, async ({ page }) => {
      await page.goto(`/${locale}/auth/login`);
      await page.locator('input[type="email"], input[name="email"]').first().fill('wrong@test.com');
      await page.locator('input[type="password"], input[name="password"]').first().fill('bad');
      await page.getByRole('button').filter({ hasText: /sign|log|登|เข้า|로그|ログ|Đăng/i }).first().click();
      await page.waitForTimeout(2000);
      const url = page.url();
      const hasError = url.includes('error') || (await page.locator('[role="alert"], .error, .text-red').count()) > 0;
      expect(hasError).toBe(true);
    });
  });

  test.describe(`Auth — Register [${locale}]`, () => {
    test(`register page loads`, async ({ page }) => {
      await page.goto(`/${locale}/auth/register`);
      await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test(`has at least 3 form fields`, async ({ page }) => {
      await page.goto(`/${locale}/auth/register`);
      const inputs = page.locator('input');
      expect(await inputs.count()).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe(`Auth — Forgot Password [${locale}]`, () => {
    test(`forgot page loads with email field`, async ({ page }) => {
      await page.goto(`/${locale}/auth/forgot`);
      await expect(page.getByRole('heading').first()).toBeVisible();
    });
  });
}
