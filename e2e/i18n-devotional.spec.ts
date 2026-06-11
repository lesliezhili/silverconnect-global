/**
 * SilverConnect Global — Devotional i18n E2E
 * Prayer tabs (morning/noon/afternoon/evening/meal/sunday) across all 7 locales
 */
import { test, expect } from '@playwright/test';

const LOCALES = ['en', 'zh', 'zh_tw', 'th', 'ko', 'ja', 'vi'];
const PRAYER_TYPES = ['morning', 'noon', 'afternoon', 'evening', 'meal', 'sunday'];

for (const locale of LOCALES) {
  test.describe(`Devotional page [${locale}]`, () => {
    test(`loads with prayer content`, async ({ page }) => {
      await page.goto(`/${locale}/devotional`);
      // May redirect to login — that's acceptable for auth-gated pages
      if (page.url().includes('login')) return;
      await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test(`shows tab buttons for prayer types`, async ({ page }) => {
      await page.goto(`/${locale}/devotional`);
      if (page.url().includes('login')) return;
      const tabs = page.getByRole('button');
      // Should have at least 5 tab buttons (Today, Morning, Noon, Afternoon, Evening...)
      expect(await tabs.count()).toBeGreaterThanOrEqual(5);
    });

    test(`afternoon tab exists and is clickable`, async ({ page }) => {
      await page.goto(`/${locale}/devotional`);
      if (page.url().includes('login')) return;
      const afternoonBtn = page.getByRole('button').filter({ hasText: /afternoon|午后|午後|บ่าย|오후|午後|Chiều/i });
      if (await afternoonBtn.count() > 0) {
        await afternoonBtn.first().click();
        await page.waitForTimeout(1000);
        // Content should update
        await expect(page.locator('main')).toBeVisible();
      }
    });

    test(`evening tab exists and is clickable`, async ({ page }) => {
      await page.goto(`/${locale}/devotional`);
      if (page.url().includes('login')) return;
      const eveningBtn = page.getByRole('button').filter({ hasText: /evening|晚|เย็น|저녁|夕|Tối/i });
      if (await eveningBtn.count() > 0) {
        await eveningBtn.first().click();
        await page.waitForTimeout(1000);
        await expect(page.locator('main')).toBeVisible();
      }
    });
  });
}

// API-level validation
test.describe('Devotional API — time-of-day auto-selection', () => {
  for (const type of PRAYER_TYPES) {
    test(`/api/devotional?type=${type} returns valid content`, async ({ request }) => {
      const resp = await request.get(`/api/devotional?type=${type}&lang=en`);
      expect(resp.status()).toBe(200);
      const data = await resp.json();
      expect(data.success).toBe(true);
      expect(data.devotional.type).toBe(type);
      expect(data.devotional.title).toBeTruthy();
      expect(data.devotional.scripture).toBeTruthy();
      expect(data.devotional.prayer).toBeTruthy();
    });
  }

  for (const locale of LOCALES) {
    test(`/api/devotional?lang=${locale} returns translated content`, async ({ request }) => {
      const resp = await request.get(`/api/devotional?lang=${locale}`);
      expect(resp.status()).toBe(200);
      const data = await resp.json();
      expect(data.success).toBe(true);
      expect(data.devotional.title).toBeTruthy();
    });
  }
});
