import type { Page } from "@playwright/test";

const DEFAULT_EMAIL = process.env.TEST_USER_EMAIL ?? "mary.e2e@example.com";
const DEFAULT_PASSWORD = process.env.TEST_USER_PASSWORD ?? "Test1234!";

/** Origin for cookie helpers (matches playwright baseURL). */
export function e2eOrigin(): string {
  return process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000";
}

/**
 * Sign in via the login page UI. Requires a seeded user in the database.
 */
export async function loginViaUi(
  page: Page,
  opts?: { email?: string; password?: string; locale?: string },
) {
  const locale = opts?.locale ?? "en";
  const email = opts?.email ?? DEFAULT_EMAIL;
  const password = opts?.password ?? DEFAULT_PASSWORD;

  await page.goto(`/${locale}/auth/login`);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in|登录/i }).click();
  await page.waitForURL(new RegExp(`/${locale}/home`));
}
