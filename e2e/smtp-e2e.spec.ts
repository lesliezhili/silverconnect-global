import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://47.236.169.73";
const TEST_TO = process.env.SMTP_TEST_TO || "xinxinsoft.cn@gmail.com";

test("register flow sends a real verification email", async ({ page }) => {
  // Random email-able local part to keep server-side code store key unique
  const stamp = Date.now();
  const target = TEST_TO.replace(/^([^@]+)@/, `$1+sc${stamp}@`);

  await page.context().clearCookies();
  await page.goto(BASE + "/en/auth/register");
  await page.fill('input[name="email"]', target);
  await page.fill('input[name="password"]', "password123");

  // The Server Action redirect after a successful send drops us at
  // /en/auth/verify?email=...&sent=1. Asserts:
  //   1. URL transition completed (no error= flag)
  //   2. Verify page rendered with a 6-digit code input
  await Promise.all([
    page.waitForURL(/\/auth\/verify\?email=/, { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
  expect(page.url()).not.toContain("error=");
  await expect(page.locator('input[name="code"]')).toBeVisible();

  // Print the recipient so the human tester knows where to look.
  // The "+sc<ts>" tag means Gmail will deliver to xinxinsoft.cn@gmail.com
  // and surface as a sub-address in the inbox / search.
  // eslint-disable-next-line no-console
  console.log("[smtp-e2e] sent verification email to:", target);
});
