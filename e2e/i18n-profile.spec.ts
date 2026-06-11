/**
 * SilverConnect Global — Profile & Funding i18n E2E
 * NDIS/TAC/WorkSafe funding, emergency contacts, profile editing
 * All require auth — should redirect to login when unauthenticated
 */
import { test, expect } from '@playwright/test';

const LOCALES = ['en', 'zh', 'zh_tw', 'th', 'ko', 'ja', 'vi'];

const AUTH_ROUTES = [
  '/profile/funding',     // NDIS/TAC/WorkSafe
  '/profile/emergency',   // Emergency contacts
  '/profile/edit',        // Edit profile
  '/profile/payment',     // Payment methods
  '/profile/security',    // Security settings
  '/bookings',            // Booking history
  '/home',                // Customer dashboard
];

for (const locale of LOCALES) {
  test.describe(`Protected routes [${locale}] — redirect to login`, () => {
    for (const route of AUTH_ROUTES) {
      test(`${route} requires auth`, async ({ page }) => {
        await page.goto(`/${locale}${route}`);
        // Must redirect to login or show login form
        const url = page.url();
        const isAuthRedirect = url.includes('login') || url.includes('auth');
        const hasLoginForm = (await page.locator('input[type="email"], input[name="email"]').count()) > 0;
        expect(isAuthRedirect || hasLoginForm).toBe(true);
      });
    }
  });
}
