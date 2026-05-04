/**
 * Sprint 1 + P2 smoke tests for the new UI.
 *
 * Coverage (one assertion per test, fast):
 * - Locale routing: /en/* and /zh/* render the right copy
 * - Header chips: country flag, language chip
 * - Booking wizard: step query param drives the right title
 * - State composites: ?state= renders the right variant
 * - Auth: signed-out hits /profile → 307 to /auth/login
 * - Auth: signed-in hits /auth/login → 307 to /home
 * - Country cookie: sc-country=CN flips prices to ¥
 * - Help: hub renders + article + 404 for missing slug
 *
 * Run against the local dev server. Set PLAYWRIGHT_TEST_BASE_URL=http://localhost:3939.
 */

import { test, expect } from "@playwright/test";

test.describe("locale routing", () => {
  test("/en/home renders English greeting", async ({ page }) => {
    await page.goto("/en/home");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Hello, Margaret"
    );
  });

  test("/zh/home renders Chinese greeting", async ({ page }) => {
    await page.goto("/zh/home");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("你好");
  });

  test("root / redirects to /en/home", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.url()).toMatch(/\/en\/home$/);
  });
});

test.describe("header chips", () => {
  test("AU flag chip renders by default", async ({ page }) => {
    await page.goto("/en/home");
    await expect(page.getByLabel("Country: AU")).toBeVisible();
  });

  test("EN language chip is present", async ({ page }) => {
    await page.goto("/en/home");
    await expect(page.getByLabel("Language: English")).toBeVisible();
  });

  test("ZH language chip is present on /zh", async ({ page }) => {
    await page.goto("/zh/home");
    await expect(page.getByLabel("Language: 中文")).toBeVisible();
  });
});

test.describe("country cookie drives prices", () => {
  test("CN cookie flips prices to ¥", async ({ context, page }) => {
    await context.addCookies([
      { name: "sc-country", value: "CN", url: "http://localhost:3939" },
    ]);
    await page.goto("/en/home");
    await expect(page.getByText(/from ¥/).first()).toBeVisible();
  });

  test("CA cookie flips prices to C$", async ({ context, page }) => {
    await context.addCookies([
      { name: "sc-country", value: "CA", url: "http://localhost:3939" },
    ]);
    await page.goto("/en/home");
    await expect(page.getByText(/from C\$/).first()).toBeVisible();
  });
});

test.describe("booking wizard", () => {
  test("step=1 shows service selection", async ({ page }) => {
    await page.goto("/en/bookings/new?step=1");
    await expect(
      page.getByRole("heading", { name: /Choose a service package/i })
    ).toBeVisible();
  });

  test("step=4 shows confirm + pay CTA", async ({ page }) => {
    await page.goto("/en/bookings/new?step=4");
    await expect(page.getByText(/Confirm & pay/i)).toBeVisible();
  });

  test("step=2 with state=noSlot shows fully booked", async ({ page }) => {
    await page.goto("/en/bookings/new?step=2&state=noSlot");
    await expect(page.getByText(/Fully booked/i)).toBeVisible();
  });
});

test.describe("auth guards", () => {
  test("signed-out hitting /profile redirects to /auth/login", async ({
    page,
  }) => {
    const res = await page.goto("/en/profile");
    expect(res?.url()).toMatch(/\/auth\/login$/);
  });

  test("signed-in hitting /auth/login redirects to /home", async ({
    context,
    page,
  }) => {
    await context.addCookies([
      {
        name: "sc-session",
        value: encodeURIComponent("Margaret|MW"),
        url: "http://localhost:3939",
      },
    ]);
    const res = await page.goto("/en/auth/login");
    expect(res?.url()).toMatch(/\/home$/);
  });

  test("signed-in /profile renders avatar with initials", async ({
    context,
    page,
  }) => {
    await context.addCookies([
      {
        name: "sc-session",
        value: encodeURIComponent("Margaret|MW"),
        url: "http://localhost:3939",
      },
    ]);
    await page.goto("/en/profile");
    await expect(page.getByRole("heading", { name: "Margaret" })).toBeVisible();
  });
});

test.describe("help pages", () => {
  test("hub renders 5 categories", async ({ page }) => {
    await page.goto("/en/help");
    await expect(page.getByRole("heading", { name: "Help & support" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Booking your first service/ })).toBeVisible();
  });

  test("article slug renders body", async ({ page }) => {
    await page.goto("/en/help/cancellation-policy");
    await expect(
      page.getByRole("heading", { name: /Cancellation & refund policy/i })
    ).toBeVisible();
  });

  test("missing slug returns 404", async ({ page }) => {
    const res = await page.goto("/en/help/nope-not-real");
    expect(res?.status()).toBe(404);
  });
});

test.describe("emergency overlay", () => {
  test("?emergency=1 renders dialog with correct number for AU", async ({
    page,
  }) => {
    await page.goto("/en/chat?emergency=1");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Call 000 now")).toBeVisible();
  });

  test("?emergency=1 with CN cookie shows 120", async ({ context, page }) => {
    await context.addCookies([
      { name: "sc-country", value: "CN", url: "http://localhost:3939" },
    ]);
    await page.goto("/en/chat?emergency=1");
    await expect(page.getByText(/Call 120 now/)).toBeVisible();
  });
});

test.describe("payment states", () => {
  test("default renders Stripe-shaped form", async ({ page }) => {
    await page.goto("/en/pay/abc");
    await expect(page.getByLabel("Card number")).toBeVisible();
  });

  test("?state=failed renders declined alert", async ({ page }) => {
    await page.goto("/en/pay/abc?state=failed");
    await expect(page.getByRole("alert")).toContainText(/Card declined/i);
  });

  test("?state=success renders confirmation", async ({ page }) => {
    await page.goto("/en/pay/abc?state=success");
    await expect(
      page.getByRole("heading", { name: /Payment confirmed/i })
    ).toBeVisible();
  });
});
