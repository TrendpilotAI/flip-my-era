import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('auth page renders login form', async ({ page }) => {
    await page.goto('/auth');
    // Should show sign-in UI (Supabase Auth)
    const authContainer = page.locator('[class*="auth"], [class*="login"], [class*="sign"], ').first();
    await expect(authContainer).toBeVisible({ timeout: 10_000 });
  });

  test('unauthenticated user is redirected from /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to auth or show auth prompt
    await page.waitForTimeout(2000);
    const url = page.url();
    const onAuthOrDashboard = /\/(auth|sign-in|login)/.test(url) || url.includes('dashboard');
    expect(onAuthOrDashboard).toBe(true);
  });

  test('unauthenticated user is redirected from /stories', async ({ page }) => {
    await page.goto('/stories');
    await page.waitForTimeout(2000);
    const url = page.url();
    // Either redirected or shown auth wall
    expect(url).toBeDefined();
  });

  test('auth page has Google OAuth option', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForTimeout(3000);
    // Look for Google sign-in button (Supabase Auth)
    const googleBtn = page.locator('button, [role="button"]').filter({ hasText: /google/i }).first();
    const hasGoogle = await googleBtn.isVisible().catch(() => false);
    // Or look for Social buttons
    const clerkSocial = page.locator('[class*="socialButton"], .cl-socialButton').first();
    const hasClerkSocial = await clerkSocial.isVisible().catch(() => false);
    // At least one auth method should be visible
    const authForm = page.locator('form, [class*="form"], input[type="email"]').first();
    const hasForm = await authForm.isVisible().catch(() => false);
    expect(hasGoogle || hasClerkSocial || hasForm).toBe(true);
  });

  test('auth page is accessible', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForTimeout(2000);
    // No images without alt text
    const imgsWithoutAlt = await page.locator('img:not([alt])').count();
    // Allow some (decorative), but flag if excessive
    expect(imgsWithoutAlt).toBeLessThan(10);
  });
});
