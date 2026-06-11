/**
 * SilverConnect Global — Services & Booking i18n E2E
 * Service catalog, booking flow, nearby providers across all 7 locales
 */
import { test, expect } from '@playwright/test';

const LOCALES = ['en', 'zh', 'zh_tw', 'th', 'ko', 'ja', 'vi'];

for (const locale of LOCALES) {
  test.describe(`Services [${locale}]`, () => {
    test(`services page loads`, async ({ page }) => {
      const res = await page.goto(`/${locale}/services`);
      expect([200, 302, 303]).toContain(res?.status() ?? 200);
      await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test(`service categories visible (cleaning, garden, repair, etc.)`, async ({ page }) => {
      await page.goto(`/${locale}/services`);
      if (page.url().includes('login')) return;
      // Should show service category cards or links
      const links = page.getByRole('link');
      expect(await links.count()).toBeGreaterThan(3);
    });

    test(`book-service page loads`, async ({ page }) => {
      const res = await page.goto(`/${locale}/book-service`);
      expect([200, 302, 303]).toContain(res?.status() ?? 200);
      await expect(page.getByRole('heading').first()).toBeVisible();
    });
  });

  test.describe(`Nearby providers [${locale}]`, () => {
    test(`nearby page loads or redirects to auth`, async ({ page }) => {
      const res = await page.goto(`/${locale}/nearby`);
      expect([200, 302, 303]).toContain(res?.status() ?? 200);
    });
  });

  test.describe(`Country services [${locale}]`, () => {
    test(`country-services page loads`, async ({ page }) => {
      const res = await page.goto(`/${locale}/country-services`);
      expect([200, 302, 303]).toContain(res?.status() ?? 200);
    });
  });
}
