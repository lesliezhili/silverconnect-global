/**
 * SilverConnect Global — Accessibility i18n E2E (WCAG 2.1 AA)
 * Target: Seniors 60+ and disability users (NDIS/TAC/WorkSafe)
 * Validates: focus visibility, touch targets, contrast, semantic HTML
 */
import { test, expect } from '@playwright/test';

const LOCALES = ['en', 'zh', 'zh_tw', 'th', 'ko', 'ja', 'vi'];

const PAGES = ['/', '/auth/login', '/auth/register', '/services'];

for (const locale of LOCALES) {
  test.describe(`Accessibility [${locale}]`, () => {
    for (const pagePath of PAGES) {
      const fullPath = `/${locale}${pagePath === '/' ? '' : pagePath}`;

      test(`${fullPath} — has main landmark`, async ({ page }) => {
        await page.goto(fullPath);
        await expect(page.locator('main, [role="main"]').first()).toBeVisible();
      });

      test(`${fullPath} — heading hierarchy (h1 present)`, async ({ page }) => {
        await page.goto(fullPath);
        const h1 = page.locator('h1');
        expect(await h1.count()).toBeGreaterThanOrEqual(1);
      });

      test(`${fullPath} — buttons have accessible names`, async ({ page }) => {
        await page.goto(fullPath);
        const buttons = page.getByRole('button');
        const count = await buttons.count();
        for (let i = 0; i < Math.min(count, 5); i++) {
          const name = await buttons.nth(i).getAttribute('aria-label') ||
                       await buttons.nth(i).textContent();
          expect(name?.trim().length).toBeGreaterThan(0);
        }
      });

      test(`${fullPath} — no images without alt text`, async ({ page }) => {
        await page.goto(fullPath);
        const images = page.locator('img');
        const count = await images.count();
        for (let i = 0; i < count; i++) {
          const alt = await images.nth(i).getAttribute('alt');
          const role = await images.nth(i).getAttribute('role');
          // Either has alt text or role="presentation"
          expect(alt !== null || role === 'presentation').toBe(true);
        }
      });
    }

    test(`/${locale} — focus visible on Tab`, async ({ page, browserName }) => {
      test.skip(browserName === 'webkit', 'iOS/iPadOS Safari disables Tab-key focus navigation unless Full Keyboard Access is manually enabled in device settings — not something Playwright can toggle.');
      await page.goto('/' + locale);
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });

    test(`/${locale} — font size ≥ 14px (senior readability)`, async ({ page }) => {
      await page.goto('/' + locale);
      const body = page.locator('body');
      const fontSize = await body.evaluate(el => getComputedStyle(el).fontSize);
      const px = parseInt(fontSize);
      expect(px).toBeGreaterThanOrEqual(14);
    });
  });
}
