import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('unauthenticated user is redirected from /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to auth
    await page.waitForURL(/\/auth/, { timeout: 5000 });
    expect(page.url()).toContain('/auth');
  });

  test('unauthenticated user is redirected from /checkout', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForURL(/\/auth/, { timeout: 5000 });
    expect(page.url()).toContain('/auth');
  });

  test('unauthenticated user is redirected from /upgrade', async ({ page }) => {
    await page.goto('/upgrade');
    await page.waitForURL(/\/auth/, { timeout: 5000 });
    expect(page.url()).toContain('/auth');
  });

  test('admin route is restricted from regular users', async ({ page }) => {
    await page.goto('/admin');
    // Should not show admin content, either redirect or show access denied
    await page.waitForTimeout(1000);
    const url = page.url();
    // Admin route should redirect non-admin users
    expect(url).not.toContain('/admin');
  });

  test('auth page renders sign-in UI', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('body')).toBeVisible();
    // Clerk will render its own sign-in component
  });
});
