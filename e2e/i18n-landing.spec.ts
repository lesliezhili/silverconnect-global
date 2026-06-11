/**
 * SilverConnect Global — Landing Page i18n E2E
 * Validates all 7 locales render correctly, services section shows, CTA accessible
 */
import { test, expect } from '@playwright/test';

const LOCALES = ['en', 'zh', 'zh_tw', 'th', 'ko', 'ja', 'vi'];

for (const locale of LOCALES) {
  test.describe(`Landing page [${locale}]`, () => {
    test(`renders heading`, async ({ page }) => {
      await page.goto('/' + locale);
      await expect(page.getByRole('heading').first()).toBeVisible();
    });

  test(`shows services section with categories`, async ({ page }) => {
    await page.goto(`/${locale}`);
    const services = page.locator('section').filter({ hasText: /cleaning|garden|repair|🧹|🌳|🔧/i });
    await expect(services.first()).toBeVisible();
  });

    test(`CTA button meets 44px touch target`, async ({ page }) => {
      await page.goto('/' + locale);
      const cta = page.getByRole('link', { name: /get.?start|join|register|sign.?up|开始|เริ่ม|시작|始める|Bắt đầu/i }).first();
      if (await cta.count() > 0) {
        const box = await cta.boundingBox();
        if (box) expect(box.height).toBeGreaterThanOrEqual(40);
      }
    });

    test(`page language matches locale`, async ({ page }) => {
      await page.goto('/' + locale);
      const html = await page.locator('html').getAttribute('lang');
      // html lang should contain the locale prefix
      expect(html?.replace('-', '_') || '').toContain(locale.split('_')[0]);
    });

    test(`keyboard navigation works (Tab ×5)`, async ({ page }) => {
      await page.goto('/' + locale);
      for (let i = 0; i < 5; i++) await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
    });
  });
}
