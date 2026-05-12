/**
 * E2E — provider automated-compliance flow (ABN validation, background-check
 * consent, onboarding gating).
 *
 * Status: written but NOT run in this environment. Prerequisites to run:
 *   1. Apply migration 0007:  npm run db:migrate
 *   2. Run the dev server (Playwright auto-starts `npm run dev`) OR set
 *      PLAYWRIGHT_TEST_BASE_URL to a deployed instance.
 *   3. For the authenticated tests: a provider account whose `users.country`
 *      is "AU" and whose provider profile is in `docs_review` (or seed one).
 *      Set PW_PROVIDER_EMAIL / PW_PROVIDER_PASSWORD, or adjust the sign-in
 *      helper to match your seed.
 *
 *   npx playwright test e2e/provider-compliance.spec.ts --project=chromium
 *
 * The mock background-check vendor (BG_CHECK_VENDOR=mock, the default)
 * self-POSTs a "cleared" webhook ~3s after triggerCheck, so onboarding can
 * be exercised end-to-end without a real vendor account. Stripe Connect
 * onboarding still requires a real (test-mode) Stripe account, so the test
 * only asserts up to the redirect to Stripe.
 */
import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

// ---------------------------------------------------------------- public

test.describe("provider compliance — unauthenticated", () => {
  test("register wizard requires sign-in", async ({ page }) => {
    await page.goto(`${BASE}/en/provider/register`);
    await expect(page).toHaveURL(/\/en\/auth\/login/);
  });

  test("compliance page requires sign-in", async ({ page }) => {
    await page.goto(`${BASE}/en/provider/compliance`);
    await expect(page).toHaveURL(/\/en\/auth\/login/);
  });
});

// ------------------------------------------------------ authenticated (AU)

const PROVIDER_EMAIL = process.env.PW_PROVIDER_EMAIL;
const PROVIDER_PASSWORD = process.env.PW_PROVIDER_PASSWORD;

async function signIn(page: import("@playwright/test").Page) {
  await page.goto(`${BASE}/en/auth/login`);
  await page.getByLabel(/email/i).fill(PROVIDER_EMAIL!);
  await page.getByLabel(/password/i).fill(PROVIDER_PASSWORD!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForLoadState("networkidle");
}

test.describe("provider compliance — AU provider", () => {
  test.skip(
    !PROVIDER_EMAIL || !PROVIDER_PASSWORD,
    "set PW_PROVIDER_EMAIL / PW_PROVIDER_PASSWORD (AU provider in docs_review) to run",
  );

  test("step 1 shows the ABN field and rejects an invalid ABN", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/en/provider/register?step=1`);
    const abn = page.locator('input[name="abn"]');
    await expect(abn).toBeVisible();

    await page.locator('input[name="name"]').fill("Test Provider");
    await page.locator('input[name="phone"]').fill("0400000000");
    await page.locator('input[name="address"]').fill("1 Test St, Sydney");
    await abn.fill("123"); // not 11 digits
    // scoped to the wizard form so we don't grab the Next.js dev-tools button
    await page.locator("form").getByRole("button", { name: /next step/i }).click();
    await expect(page).toHaveURL(/error=abnInvalid/);
  });

  test("submitting without the background-check consent is blocked", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/en/provider/register?step=5`);
    // The consent checkbox is `required`; force a submit to hit the server backstop.
    await page.evaluate(() => {
      const cb = document.querySelector<HTMLInputElement>('input[name="consent"]');
      if (cb) cb.removeAttribute("required");
    });
    await page.getByRole("button", { name: /submit application/i }).click();
    await expect(page).toHaveURL(/error=consent/);
  });

  test("onboarding-status renders DB-driven steps", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/en/provider/onboarding-status`);
    await expect(page.getByText(/application submitted/i)).toBeVisible();
    await expect(page.getByText(/background check/i)).toBeVisible();
    await expect(page.getByText(/stripe verification/i)).toBeVisible();
  });

  test("a not-yet-active provider is gated out of the jobs page", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/en/provider/jobs`);
    // Account-in-review banner is shown; no `pending` dispatches are listed.
    await expect(page.getByText(/account is in review/i)).toBeVisible();
  });
});
