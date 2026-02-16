import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads within 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(3000);
    await expect(page).toHaveTitle(/FlipMyEra/i);
  });

  test('homepage renders main content', async ({ page }) => {
    await page.goto('/');

    // Should have the main wizard or landing content
    await expect(page.locator('body')).toBeVisible();
    // Check that the page is not blank
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(0);
  });

  test('navigation links are functional', async ({ page }) => {
    await page.goto('/');

    // FAQ page should be accessible
    await page.goto('/faq');
    await expect(page.locator('body')).toBeVisible();

    // Plans page should be accessible
    await page.goto('/plans');
    await expect(page.locator('body')).toBeVisible();
  });

  test('404 page renders for unknown routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.locator('body')).toContainText(/not found|404/i);
  });

  test('auth page loads', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('body')).toBeVisible();
  });
});
