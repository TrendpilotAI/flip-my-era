import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero section with CTA', async ({ page }) => {
    // Main heading should be visible
    await expect(page.locator('h1').first()).toBeVisible();
    // Should have a primary CTA button
    const cta = page.getByRole('button').or(page.getByRole('link')).filter({ hasText: /get started|create|start|begin|try/i }).first();
    await expect(cta).toBeVisible();
  });

  test('has navigation links', async ({ page }) => {
    // Should have nav links to key pages
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
  });

  test('displays Taylor Swift era theming', async ({ page }) => {
    // Look for era-related content
    const body = await page.textContent('body');
    const hasEraContent = /era|taylor|swift|folklore|midnights|lover|reputation|1989/i.test(body || '');
    expect(hasEraContent).toBe(true);
  });

  test('links to pricing/plans page', async ({ page }) => {
    const plansLink = page.getByRole('link', { name: /plan|pricing|price/i }).first();
    if (await plansLink.isVisible()) {
      await plansLink.click();
      await expect(page).toHaveURL(/\/plans/);
    }
  });

  test('links to FAQ page', async ({ page }) => {
    const faqLink = page.getByRole('link', { name: /faq|question|help/i }).first();
    if (await faqLink.isVisible()) {
      await faqLink.click();
      await expect(page).toHaveURL(/\/faq/);
    }
  });

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    // Page should still render without horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
  });

  test('loads within performance budget', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;
    // Should load DOM within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
