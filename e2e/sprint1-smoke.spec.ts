/**
 * Sprint 1 smoke — fast checks that do not require legacy modal auth or Stripe.
 * Tagged @critical for release gate (chromium only).
 */

import { test, expect } from "@playwright/test";
import { e2eOrigin } from "./_helpers/auth";

const origin = () => e2eOrigin();

test.describe("locale routing @critical", () => {
  test("/en/home renders English guest greeting", async ({ page }) => {
    await page.goto("/en/home");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Hello,\s*Guest/i,
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

test.describe("header chips @critical", () => {
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

test.describe("country cookie drives prices @critical", () => {
  test("CN cookie flips prices to ¥", async ({ context, page }) => {
    await context.addCookies([
      { name: "sc-country", value: "CN", url: origin() },
    ]);
    await page.goto("/en/home");
    await expect(page.getByText(/from ¥|¥.*\/h|\/小时/).first()).toBeVisible();
  });

  test("CA cookie flips prices to C$", async ({ context, page }) => {
    await context.addCookies([
      { name: "sc-country", value: "CA", url: origin() },
    ]);
    await page.goto("/en/home");
    await expect(page.getByText(/from C\$|C\$.*/).first()).toBeVisible();
  });
});

test.describe("auth guards @critical", () => {
  test("signed-out hitting /profile redirects to /auth/login", async ({
    page,
  }) => {
    const res = await page.goto("/en/profile");
    expect(res?.url()).toMatch(/\/auth\/login$/);
  });
});

test.describe("help pages @critical", () => {
  test("hub renders categories", async ({ page }) => {
    await page.goto("/en/help");
    await expect(
      page.getByRole("heading", { name: "Help & support" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Booking your first service/ }),
    ).toBeVisible();
  });

  test("article slug renders body", async ({ page }) => {
    await page.goto("/en/help/cancellation-policy");
    await expect(
      page.getByRole("heading", { name: /Cancellation & refund policy/i }),
    ).toBeVisible();
  });

  test("missing slug returns 404", async ({ page }) => {
    const res = await page.goto("/en/help/nope-not-real");
    expect(res?.status()).toBe(404);
  });
});

// Booking, payment, and iron-session flows are covered in full-flow-ui.spec.ts (DB-backed).
