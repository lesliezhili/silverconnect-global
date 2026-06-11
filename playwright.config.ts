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
    // Pixel 5 — large Android phone
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],

  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
