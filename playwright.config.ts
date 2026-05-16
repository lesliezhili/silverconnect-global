import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const chromiumCache = path.join(
  process.env.HOME ?? '',
  'Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium',
);
const chromiumExecutable = fs.existsSync(chromiumCache) ? chromiumCache : undefined;

/**
 * Playwright Configuration
 * https://playwright.dev/docs/intro
 */
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3000';
const useLocalWebServer = /localhost|127\.0\.0\.1/.test(baseURL);

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  testIgnore: ['**/archive/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['github'],
  ],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumExecutable
          ? { launchOptions: { executablePath: chromiumExecutable } }
          : {}),
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  ...(useLocalWebServer
    ? {
        webServer: {
          command: 'HOSTNAME=127.0.0.1 npm run dev',
          url: 'http://127.0.0.1:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
      }
    : {}),
});
