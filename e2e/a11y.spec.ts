import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://47.236.169.73";

const PAGES = [
  // Public
  { name: "home zh", url: "/zh/home" },
  { name: "home en", url: "/en/home" },
  { name: "auth login", url: "/zh/auth/login" },
  { name: "auth register", url: "/zh/auth/register" },
  { name: "services list", url: "/zh/services" },
  { name: "services category", url: "/zh/services/cleaning" },
  { name: "help", url: "/zh/help" },
  { name: "search empty", url: "/zh/search" },
  { name: "oops", url: "/zh/oops" },
  // Customer (signed-in via cookie)
  { name: "customer profile", url: "/zh/profile", cookie: "customer" as const },
  { name: "customer family", url: "/zh/profile/family", cookie: "customer" as const },
  { name: "bookings recurring", url: "/zh/bookings/recurring", cookie: "customer" as const },
  { name: "settings privacy", url: "/zh/settings/privacy", cookie: "customer" as const },
  { name: "safety report", url: "/zh/safety/report", cookie: "customer" as const },
  // Provider
  { name: "provider workbench", url: "/zh/provider", cookie: "customer" as const },
  { name: "provider jobs", url: "/zh/provider/jobs", cookie: "customer" as const },
  { name: "provider job detail", url: "/zh/provider/jobs/J-1042", cookie: "customer" as const },
  { name: "provider register", url: "/zh/provider/register" },
  { name: "provider compliance", url: "/zh/provider/compliance", cookie: "customer" as const },
  // Admin
  { name: "admin login", url: "/zh/admin/login" },
  { name: "admin overview", url: "/zh/admin", cookie: "admin" as const },
  { name: "admin disputes", url: "/zh/admin/disputes", cookie: "admin" as const },
  { name: "admin dispute drawer", url: "/zh/admin/disputes?id=D-2031", cookie: "admin" as const },
  { name: "admin reports", url: "/zh/admin/reports", cookie: "admin" as const },
  { name: "admin customers", url: "/zh/admin/customers", cookie: "admin" as const },
  { name: "admin analytics", url: "/zh/admin/analytics", cookie: "admin" as const },
  { name: "admin ai conversations", url: "/zh/admin/ai/conversations", cookie: "admin" as const },
  { name: "admin settings", url: "/zh/admin/settings", cookie: "admin" as const },
];

async function setCookie(page: Page, kind: "customer" | "admin") {
  const name = kind === "customer" ? "sc-session" : "sc-admin";
  const value = kind === "customer" ? "Demo|D" : encodeURIComponent("admin@silverconnect.com");
  await page.context().addCookies([{ name, value, url: BASE }]);
}

for (const p of PAGES) {
  test(`a11y: ${p.name}`, async ({ page }) => {
    if (p.cookie) await setCookie(page, p.cookie);
    await page.goto(BASE + p.url);
    await page.waitForLoadState("networkidle").catch(() => {});
    const results = await new AxeBuilder({ page })
      // Restrict to serious + critical to avoid info-level noise.
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // Exclude known third-party widgets we can't fix.
      .exclude("#__next-route-announcer__")
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    if (serious.length) {
      console.error(
        `[${p.name}] ${serious.length} serious/critical:`,
        serious
          .map((v) => `${v.id} (${v.nodes.length}): ${v.help}`)
          .join("\n  ")
      );
    }
    expect(serious, JSON.stringify(serious.map((v) => ({ id: v.id, count: v.nodes.length, help: v.help, sample: v.nodes[0]?.html?.slice(0, 200) })), null, 2)).toEqual([]);
  });
}
