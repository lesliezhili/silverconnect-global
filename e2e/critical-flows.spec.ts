/**
 * Critical E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Critical User Journeys', () => {
  test('should complete home page to payment flow', async ({ page }) => {
    // Home -> Services -> Booking -> Payment
    await page.goto('/');
    await expect(page).toHaveURL('/');

    await page.click('text=Get Started');
    await expect(page).toHaveURL('/services');

    const service = page.locator('[data-testid="service-card"]').first();
    await service.click();

    await page.fill('[data-testid="booking-date"]', '2024-12-25');
    await page.selectOption('[data-testid="booking-time"]', '10:00');
    await page.click('text=Proceed to Payment');

    await expect(page).toHaveURL(/\/payment/);
  });

  test('should handle payment processing', async ({ page }) => {
    await page.goto('/payment');
    await page.waitForLoadState('networkidle');

    // Wait for Stripe to load
    const stripeFrame = page.frameLocator('iframe[title="Stripe"]').first();
    const cardInput = stripeFrame.locator('[placeholder="Card number"]');

    await cardInput.fill('4242424242424242');

    // Submit form
    await page.click('text=Pay Now');

    // Should show success
    await expect(page.locator('text=Payment successful')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should allow booking cancellation', async ({ page }) => {
    await page.goto('/dashboard/bookings');
    await page.waitForLoadState('networkidle');

    const bookingCard = page.locator('[data-testid="booking-card"]').first();
    await bookingCard.click();

    await page.click('text=Cancel Booking');
    await page.fill('[data-testid="cancellation-reason"]', 'Need to reschedule');
    await page.click('text=Confirm Cancellation');

    await expect(page.locator('text=Booking cancelled')).toBeVisible();
  });
});

test.describe('Performance Critical Paths', () => {
  test('should load homepage within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(3000);
  });

  test('should display services within 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/services');
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(2000);
  });
});
