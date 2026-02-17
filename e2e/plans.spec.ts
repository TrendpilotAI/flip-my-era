import { test, expect } from '@playwright/test';

test.describe('Pricing & Plans Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plans');
  });

  test('renders pricing tiers', async ({ page }) => {
    await page.waitForTimeout(3000); // Wait for Clerk + React render
    const body = await page.textContent('body');
    // Check for tier names OR legacy pricing content
    const hasDebut = /debut|free/i.test(body || '');
    const hasSpeakNow = /speak now|\$4\.99/i.test(body || '');
    const hasMidnights = /midnights|\$9\.99/i.test(body || '');
    const hasLegacy = /starter|creator|studio|\$12\.99|\$25|\$49\.99/i.test(body || '');
    // Should have pricing content (new or legacy)
    const tierCount = [hasDebut, hasSpeakNow, hasMidnights, hasLegacy].filter(Boolean).length;
    expect(tierCount).toBeGreaterThanOrEqual(1);
  });

  test('shows monthly/annual toggle', async ({ page }) => {
    // Look for billing period toggle
    const toggle = page.locator('button, [role="switch"], [role="tab"]').filter({ hasText: /annual|yearly|monthly/i }).first();
    const hasToggle = await toggle.isVisible().catch(() => false);
    // Toggle may also be a Switch component
    const switchEl = page.locator('[class*="switch"], [class*="toggle"]').first();
    const hasSwitch = await switchEl.isVisible().catch(() => false);
    expect(hasToggle || hasSwitch).toBe(true);
  });

  test('displays credit pack options', async ({ page }) => {
    const body = await page.textContent('body');
    // Check for à la carte packs
    const hasSingle = /single|\$2\.99|5 credit/i.test(body || '');
    const hasAlbum = /album|\$9\.99|20 credit/i.test(body || '');
    const hasTour = /tour|\$19\.99|50 credit/i.test(body || '');
    const packCount = [hasSingle, hasAlbum, hasTour].filter(Boolean).length;
    expect(packCount).toBeGreaterThanOrEqual(1);
  });

  test('CTA buttons are clickable', async ({ page }) => {
    const ctaButtons = page.getByRole('button').filter({ hasText: /start|get|upgrade|subscribe|buy|select/i });
    const count = await ctaButtons.count();
    expect(count).toBeGreaterThan(0);
    // First CTA should be enabled
    const firstCTA = ctaButtons.first();
    await expect(firstCTA).toBeEnabled();
  });

  test('shows feature comparison', async ({ page }) => {
    const body = await page.textContent('body');
    // Features like "all eras", "watermark", "templates", "priority" should appear
    const featureKeywords = /all eras|watermark|template|priority|credit/i;
    expect(featureKeywords.test(body || '')).toBe(true);
  });

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/plans');
    await page.waitForTimeout(1000);
    // Cards should stack vertically on mobile — check no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });
});
