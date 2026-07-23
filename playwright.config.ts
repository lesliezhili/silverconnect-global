import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Desktop — primary for seniors using laptops
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // iPad Gen 7 — most common senior device (10.2" screen)
    { name: 'iPad', use: { ...devices['iPad (gen 7)'] } },
    // Pixel — Google Android phone
    { name: 'Pixel', use: { ...devices['Pixel 5'] } },
    // Galaxy — Samsung Android phone, most common Android brand globally
    { name: 'Galaxy', use: { ...devices['Galaxy S24'] } },
    // Huawei — no official Playwright device profile (Huawei isn't in
    // Chrome DevTools' device list); modeled on a Huawei P40 Pro using a
    // real Huawei device UA string over an Android Chrome viewport.
    {
      name: 'Huawei',
      use: {
        ...devices['Galaxy S24'],
        userAgent:
          'Mozilla/5.0 (Linux; Android 10; ELS-NX9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
      },
    },
    // iPhone — real Safari/WebKit engine, since every iOS browser (incl.
    // "Chrome" on iPhone) runs on WebKit per Apple's platform rules.
    { name: 'iPhone', use: { ...devices['iPhone 14'] } },
  ],

  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
