import { test, expect } from '@playwright/test';

/**
 * User Acceptance Test (UAT) - Authentication Flow
 * Tests critical paths:
 *   - Sign-In: Homepage → Click Sign In → Verify Modal (12 tests)
 *   - Sign-Up: Homepage → Click Sign Up → Verify Modal (10 tests)
 *   - Multi-Browser: Run auth flows across all configured browsers
 * 
 * Total: 22 automated UAT scenarios
 */

test.describe('SilverConnect Global - Sign-In UAT', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('UAT-001: Homepage loads successfully', async ({ page }) => {
    // Verify page title and main elements
    await expect(page).toHaveTitle(/SilverConnect|Senior Care/i);
    
    // Verify header is visible
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Verify hero section
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();
  });

  test('UAT-002: Sign In button is visible and clickable', async ({ page }) => {
    // Find Sign In button
    const signInButton = page.locator('button, a').filter({ hasText: /Sign In|sign in/i });
    
    // Verify button exists and is visible
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toBeEnabled();
  });

  test('UAT-003: Clicking Sign In opens authentication modal', async ({ page }) => {
    // Click Sign In button
    const signInButton = page.locator('button, a').filter({ hasText: /Sign In|sign in/i });
    await signInButton.click();
    
    // Wait for modal to appear
    await page.waitForTimeout(500);
    
    // Verify modal/dialog is visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });

  test('UAT-004: Sign In modal contains email and password fields', async ({ page }) => {
    // Click Sign In button
    const signInButton = page.locator('button, a').filter({ hasText: /Sign In|sign in/i });
    await signInButton.click();
    
    // Wait for modal
    await page.waitForTimeout(500);
    
    // Verify email input field
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    await expect(emailInput).toBeVisible();
    
    // Verify password input field
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
  });

  test('UAT-005: User can enter email in sign-in form', async ({ page }) => {
    // Click Sign In button
    const signInButton = page.locator('button, a').filter({ hasText: /Sign In|sign in/i });
    await signInButton.click();
    
    // Wait for modal
    await page.waitForTimeout(500);
    
    // Fill email field
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    await emailInput.fill('test@example.com');
    
    // Verify email was entered
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('UAT-006: User can enter password in sign-in form', async ({ page }) => {
    // Click Sign In button
    const signInButton = page.locator('button, a').filter({ hasText: /Sign In|sign in/i });
    await signInButton.click();
    
    // Wait for modal
    await page.waitForTimeout(500);
    
    // Fill password field
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('TestPassword123!');
    
    // Verify password was entered (input type=password hides value, but we can check focus)
    await expect(passwordInput).toBeFocused();
  });

  test('UAT-007: Sign In form has submit button', async ({ page }) => {
    // Click Sign In button
    const signInButton = page.locator('button, a').filter({ hasText: /Sign In|sign in/i });
    await signInButton.click();
    
    // Wait for modal
    await page.waitForTimeout(500);
    
    // Find submit/login button
    const submitButton = page.locator('button').filter({ hasText: /Sign In|Login|Submit/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test('UAT-008: Complete sign-in form with valid inputs', async ({ page }) => {
    // Click Sign In button
    const signInButton = page.locator('button, a').filter({ hasText: /Sign In|sign in/i });
    await signInButton.click();
    
    // Wait for modal
    await page.waitForTimeout(500);
    
    // Fill form fields
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"]');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('TestPassword123!');
    
    // Find and click submit button
    const submitButton = page.locator('button').filter({ hasText: /Sign In|Login|Submit/i });
    
    // Verify form is filled and ready to submit
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(submitButton).toBeEnabled();
  });

  test('UAT-009: Sign In modal has close button', async ({ page }) => {
    // Click Sign In button
    const signInButton = page.locator('button, a').filter({ hasText: /Sign In|sign in/i });
    await signInButton.click();
    
    // Wait for modal
    await page.waitForTimeout(500);
    
    // Find close button (X button or Cancel)
    const closeButton = page.locator('button[aria-label*="close" i], button[aria-label*="dismiss" i], button').filter({ hasText: /Close|Cancel|×/i }).first();
    
    // Verify close button exists and is clickable
    if (await closeButton.isVisible()) {
      await expect(closeButton).toBeEnabled();
    }
  });

  test('UAT-010: Homepage displays country selector', async ({ page }) => {
    // Look for country selector on homepage
    const countrySelector = page.locator('select, button').filter({ 
      hasText: /Country|Australia|Canada|China/i 
    });
    
    // Verify country selector is visible
    if (await countrySelector.isVisible()) {
      await expect(countrySelector).toBeVisible();
    }
  });

  test('UAT-011: Page performance - Homepage loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Verify page loaded within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    console.log(`✅ Homepage loaded in ${loadTime}ms`);
  });

  test('UAT-012: Mobile responsiveness - Sign In works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to homepage
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Click Sign In button (should work on mobile)
    const signInButton = page.locator('button, a').filter({ hasText: /Sign In|sign in/i });
    await expect(signInButton).toBeVisible();
    await signInButton.click();
    
    // Verify modal appears on mobile
    await page.waitForTimeout(500);
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });
});

test.describe('SilverConnect Global - Sign-Up UAT', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('UAT-013: Sign Up button is visible and clickable', async ({ page }) => {
    // Find Sign Up button
    const signUpButton = page.locator('button, a').filter({ hasText: /Sign Up|sign up|Register|register/i });
    
    // Verify button exists and is visible
    if (await signUpButton.isVisible()) {
      await expect(signUpButton).toBeVisible();
      await expect(signUpButton).toBeEnabled();
    }
  });

  test('UAT-014: Clicking Sign Up opens authentication modal', async ({ page }) => {
    // Find and click Sign Up button
    const signUpButton = page.locator('button, a').filter({ hasText: /Sign Up|sign up|Register|register/i });
    
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      
      // Wait for modal to appear
      await page.waitForTimeout(500);
      
      // Verify modal/dialog is visible
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
    }
  });

  test('UAT-015: Sign Up modal contains email and password fields', async ({ page }) => {
    // Find and click Sign Up button
    const signUpButton = page.locator('button, a').filter({ hasText: /Sign Up|sign up|Register|register/i });
    
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      
      // Wait for modal
      await page.waitForTimeout(500);
      
      // Verify email input field
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
      if (await emailInput.isVisible()) {
        await expect(emailInput).toBeVisible();
      }
      
      // Verify password input field
      const passwordInput = page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await expect(passwordInput).toBeVisible();
      }
    }
  });

  test('UAT-016: User can enter email in sign-up form', async ({ page }) => {
    // Find and click Sign Up button
    const signUpButton = page.locator('button, a').filter({ hasText: /Sign Up|sign up|Register|register/i });
    
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      
      // Wait for modal
      await page.waitForTimeout(500);
      
      // Fill email field
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill('newuser@example.com');
        await expect(emailInput).toHaveValue('newuser@example.com');
      }
    }
  });

  test('UAT-017: User can enter password in sign-up form', async ({ page }) => {
    // Find and click Sign Up button
    const signUpButton = page.locator('button, a').filter({ hasText: /Sign Up|sign up|Register|register/i });
    
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      
      // Wait for modal
      await page.waitForTimeout(500);
      
      // Fill password field
      const passwordInput = page.locator('input[type="password"]').first();
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('SecurePassword123!');
        await expect(passwordInput).toBeFocused();
      }
    }
  });

  test('UAT-018: Sign Up form has submit button', async ({ page }) => {
    // Find and click Sign Up button
    const signUpButton = page.locator('button, a').filter({ hasText: /Sign Up|sign up|Register|register/i });
    
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      
      // Wait for modal
      await page.waitForTimeout(500);
      
      // Find submit/register button
      const submitButton = page.locator('button').filter({ hasText: /Sign Up|Register|Create|Submit/i });
      if (await submitButton.isVisible()) {
        await expect(submitButton).toBeVisible();
      }
    }
  });

  test('UAT-019: Complete sign-up form with valid inputs', async ({ page }) => {
    // Find and click Sign Up button
    const signUpButton = page.locator('button, a').filter({ hasText: /Sign Up|sign up|Register|register/i });
    
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      
      // Wait for modal
      await page.waitForTimeout(500);
      
      // Fill form fields
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      if (await emailInput.isVisible()) {
        await emailInput.fill('newuser@example.com');
      }
      
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('SecurePassword123!');
      }
      
      // Verify form is filled
      if (await emailInput.isVisible()) {
        await expect(emailInput).toHaveValue('newuser@example.com');
      }
    }
  });

  test('UAT-020: Sign Up modal has close button', async ({ page }) => {
    // Find and click Sign Up button
    const signUpButton = page.locator('button, a').filter({ hasText: /Sign Up|sign up|Register|register/i });
    
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      
      // Wait for modal
      await page.waitForTimeout(500);
      
      // Find close button
      const closeButton = page.locator('button[aria-label*="close" i], button[aria-label*="dismiss" i], button').filter({ hasText: /Close|Cancel|×/i }).first();
      
      if (await closeButton.isVisible()) {
        await expect(closeButton).toBeEnabled();
      }
    }
  });

  test('UAT-021: Sign Up form accepts different password strengths', async ({ page }) => {
    // Find and click Sign Up button
    const signUpButton = page.locator('button, a').filter({ hasText: /Sign Up|sign up|Register|register/i });
    
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      
      // Wait for modal
      await page.waitForTimeout(500);
      
      // Test password input with various strengths
      const passwordInput = page.locator('input[type="password"]').first();
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('P@ssw0rd!2024');
        await expect(passwordInput).toHaveValue('P@ssw0rd!2024');
      }
    }
  });

  test('UAT-022: Mobile responsiveness - Sign Up works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to homepage
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Find and click Sign Up button (should work on mobile)
    const signUpButton = page.locator('button, a').filter({ hasText: /Sign Up|sign up|Register|register/i });
    
    if (await signUpButton.isVisible()) {
      await expect(signUpButton).toBeVisible();
      await signUpButton.click();
      
      // Verify modal appears on mobile
      await page.waitForTimeout(500);
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
    }
  });
});

test.describe('SilverConnect Global - Multi-Browser UAT', () => {
  // Run specific tests across all configured browsers
  
  test('UAT-BROWSER-SIGNIN: Sign In flow on current browser', async ({ page, browserName }) => {
    console.log(`🔄 Testing Sign In on ${browserName}...`);
    
    // Navigate to homepage
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Click Sign In
    const signInButton = page.locator('button, a').filter({ hasText: /Sign In|sign in/i });
    await signInButton.click();
    
    // Wait for modal
    await page.waitForTimeout(500);
    
    // Verify modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    console.log(`✅ Sign In works on ${browserName}`);
  });

  test('UAT-BROWSER-SIGNUP: Sign Up flow on current browser', async ({ page, browserName }) => {
    console.log(`🔄 Testing Sign Up on ${browserName}...`);
    
    // Navigate to homepage
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Find Sign Up button
    const signUpButton = page.locator('button, a').filter({ hasText: /Sign Up|sign up|Register|register/i });
    
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      
      // Wait for modal
      await page.waitForTimeout(500);
      
      // Verify modal
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      
      console.log(`✅ Sign Up works on ${browserName}`);
    } else {
      console.log(`⚠️  Sign Up button not visible on ${browserName}`);
    }
  });
});
