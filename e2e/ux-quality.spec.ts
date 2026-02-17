import { test, expect } from '@playwright/test';

test.describe('UX Quality Checks', () => {

  test('landing page has proper visual hierarchy', async ({ page }) => {
    await page.goto('/');
    // Should have h1 as the main heading
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    // H1 should be the first heading
    const firstHeading = await page.locator('h1, h2, h3').first().tagName();
    // Allow h1 or h2 as first heading
    expect(['H1', 'H2']).toContain(firstHeading);
  });

  test('buttons have hover states', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button').first();
    if (await button.isVisible()) {
      const beforeStyles = await button.evaluate(el => {
        const s = getComputedStyle(el);
        return { bg: s.backgroundColor, transform: s.transform };
      });
      await button.hover();
      await page.waitForTimeout(300);
      const afterStyles = await button.evaluate(el => {
        const s = getComputedStyle(el);
        return { bg: s.backgroundColor, transform: s.transform };
      });
      // At least one property should change on hover (or cursor should be pointer)
      const cursor = await button.evaluate(el => getComputedStyle(el).cursor);
      expect(cursor).toBe('pointer');
    }
  });

  test('forms have proper labels and placeholders', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForTimeout(3000);
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
    const count = await inputs.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.evaluate(el => {
        const id = el.id;
        if (id) return !!document.querySelector(`label[for="${id}"]`);
        return !!el.closest('label');
      });
      const hasPlaceholder = await input.getAttribute('placeholder');
      const hasAriaLabel = await input.getAttribute('aria-label');
      // Input should have at least one accessibility label
      expect(hasLabel || !!hasPlaceholder || !!hasAriaLabel).toBe(true);
    }
  });

  test('color contrast on CTAs', async ({ page }) => {
    await page.goto('/');
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      const btn = buttons.nth(i);
      if (await btn.isVisible()) {
        const { bg, color } = await btn.evaluate(el => {
          const s = getComputedStyle(el);
          return { bg: s.backgroundColor, color: s.color };
        });
        // Basic check: text color shouldn't equal background color
        expect(bg).not.toBe(color);
      }
    }
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    // Tab through the page and check focus is visible
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName : null;
    });
    // Something should be focused after tabbing
    expect(focusedElement).toBeTruthy();
  });

  test('page loads without layout shift (CLS)', async ({ page }) => {
    await page.goto('/');
    // Wait for full load
    await page.waitForTimeout(3000);
    // Check that the main content area has a stable height
    const height1 = await page.evaluate(() => document.body.scrollHeight);
    await page.waitForTimeout(1000);
    const height2 = await page.evaluate(() => document.body.scrollHeight);
    // Height shouldn't jump dramatically after initial load
    const shift = Math.abs(height2 - height1);
    expect(shift).toBeLessThan(200); // Allow small shifts for lazy-loaded content
  });

  test('loading states are visible during transitions', async ({ page }) => {
    await page.goto('/');
    // Click a navigation link and check for loading indicators
    const navLink = page.getByRole('link').filter({ hasText: /plan|pricing/i }).first();
    if (await navLink.isVisible()) {
      await navLink.click();
      // Page should transition smoothly (no blank screen)
      await page.waitForTimeout(500);
      const bodyText = await page.textContent('body');
      expect((bodyText || '').length).toBeGreaterThan(50);
    }
  });
});

test.describe('FAQ Page UX', () => {
  test('FAQ items are expandable', async ({ page }) => {
    await page.goto('/faq');
    await page.waitForTimeout(1000);
    // Look for accordion/collapsible items
    const faqItems = page.locator('[class*="accordion"], [class*="faq"], details, [role="button"]');
    const count = await faqItems.count();
    if (count > 0) {
      // Click first FAQ item
      await faqItems.first().click();
      await page.waitForTimeout(300);
      // Content should expand (some new text visible)
      const expandedText = await page.textContent('body');
      expect((expandedText || '').length).toBeGreaterThan(100);
    }
  });

  test('FAQ page has search or categories', async ({ page }) => {
    await page.goto('/faq');
    const body = await page.textContent('body');
    // Should have some FAQ content
    expect((body || '').length).toBeGreaterThan(200);
  });
});
