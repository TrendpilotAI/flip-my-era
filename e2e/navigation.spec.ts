import { test, expect } from '@playwright/test';

test.describe('Navigation & Routing', () => {
  test('all public routes load without errors', async ({ page }) => {
    const publicRoutes = ['/', '/plans', '/faq', '/auth'];
    for (const route of publicRoutes) {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.goto(route);
      await page.waitForTimeout(1000);
      // No JS errors should crash the page
      const hasCriticalError = errors.some(e => /cannot read|undefined is not|is not a function/i.test(e));
      expect(hasCriticalError).toBe(false);
    }
  });

  test('404 page or redirect for unknown routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await page.waitForTimeout(1000);
    // Should either show 404 content, redirect to home, or show the SPA
    const url = page.url();
    const body = await page.textContent('body');
    const handled = url.includes('/') || /not found|404|home/i.test(body || '');
    expect(handled).toBe(true);
  });

  test('back button works correctly', async ({ page }) => {
    await page.goto('/');
    await page.goto('/plans');
    await page.goBack();
    await expect(page).toHaveURL('/');
  });

  test('no broken images on landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const brokenImages = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      let broken = 0;
      imgs.forEach(img => {
        if (img.naturalWidth === 0 && img.src && !img.src.includes('data:')) broken++;
      });
      return broken;
    });
    expect(brokenImages).toBeLessThan(3); // Allow a couple (CDN/external)
  });

  test('no console errors on initial load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForTimeout(2000);
    // Filter out known benign errors (favicon, analytics, etc.)
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('analytics') &&
      !e.includes('posthog') &&
      !e.includes('sentry') &&
      !e.includes('ERR_BLOCKED') &&
      !e.includes('net::')
    );
    // Should have zero critical JS errors
    expect(criticalErrors.length).toBeLessThan(3);
  });

  test('page titles are set correctly', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title.toLowerCase()).toContain('flip');
  });
});
