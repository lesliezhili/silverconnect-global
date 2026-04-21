/**
 * E2E Tests - Booking Flow
 */

import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should complete full booking flow', async ({ page }) => {
    // Step 1: Navigate to services
    await page.click('text=Browse Services');
    await expect(page).toHaveURL('/services');
    await page.waitForLoadState('networkidle');

    // Step 2: Select a service
    const firstService = page.locator('[data-testid="service-card"]').first();
    await firstService.click();
    await expect(page).toHaveURL(/\/services\/\d+/);

    // Step 3: Fill booking form
    await page.fill('[data-testid="booking-date"]', '2024-12-25');
    await page.selectOption('[data-testid="booking-time"]', '10:00');
    await page.fill('[data-testid="booking-notes"]', 'Senior person needs assistance');

    // Step 4: Proceed to payment
    await page.click('text=Proceed to Payment');

    // Step 5: Fill contact information
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="phone"]', '+61-2-1234-5678');

    // Step 6: Submit booking
    await page.click('text=Confirm Booking');

    // Verify success message
    await expect(page.locator('text=Booking confirmed')).toBeVisible();
  });

  test('should show error for invalid booking data', async ({ page }) => {
    await page.click('text=Browse Services');
    await page.waitForLoadState('networkidle');

    const firstService = page.locator('[data-testid="service-card"]').first();
    await firstService.click();

    // Try to submit without filling required fields
    await page.click('text=Proceed to Payment');

    // Expect validation errors
    await expect(page.locator('text=Date is required')).toBeVisible();
  });

  test('should display correct pricing with taxes', async ({ page }) => {
    // Select Australia as country
    const countrySelector = page.locator('[data-testid="country-selector"]');
    await countrySelector.selectOption('AU');

    await page.click('text=Browse Services');
    await page.waitForLoadState('networkidle');

    const firstService = page.locator('[data-testid="service-card"]').first();
    const priceText = await firstService.locator('[data-testid="price"]').textContent();

    // Should display base price and include GST in total
    expect(priceText).toContain('AUD');
    expect(priceText).toContain('GST');
  });
});

test.describe('User Authentication', () => {
  test('should sign up new user', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.waitForLoadState('networkidle');

    await page.fill('[data-testid="email"]', 'newuser@example.com');
    await page.fill('[data-testid="password"]', 'SecurePassword123!');
    await page.fill('[data-testid="confirm-password"]', 'SecurePassword123!');

    await page.click('text=Sign Up');

    // Verify redirect to home
    await expect(page).toHaveURL('/');
  });

  test('should sign in existing user', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'TestPassword123!');

    await page.click('text=Sign In');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'WrongPassword123!');

    await page.click('text=Sign In');

    // Expect error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verify mobile menu is visible
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();

    // Click mobile menu
    await mobileMenu.click();

    // Verify menu items are accessible
    const menuItems = page.locator('[data-testid="menu-item"]');
    await expect(menuItems.first()).toBeVisible();
  });

  test('should display buttons with large touch targets on mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const buttons = page.locator('button');
    const firstButton = buttons.first();

    // Get button size
    const boundingBox = await firstButton.boundingBox();

    // Should be at least 44x44 for accessibility
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
    expect(boundingBox?.width).toBeGreaterThanOrEqual(44);
  });
});
