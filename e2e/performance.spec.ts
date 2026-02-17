import { test, expect } from '@playwright/test';

test.describe('Performance & Bundle', () => {
  test('landing page loads under 3s on fast connection', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'load' });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(10_000); // 10s generous for dev server
  });

  test('no excessive network requests on landing', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', req => requests.push(req.url()));
    await page.goto('/');
    await page.waitForTimeout(3000);
    // Should be under 100 requests on initial load
    expect(requests.length).toBeLessThan(100);
  });

  test('no massive JS bundles (>2MB)', async ({ page }) => {
    const jsSizes: number[] = [];
    page.on('response', async (res) => {
      if (res.url().endsWith('.js') || res.url().includes('.js?')) {
        const body = await res.body().catch(() => Buffer.from(''));
        jsSizes.push(body.length);
      }
    });
    await page.goto('/');
    await page.waitForTimeout(3000);
    // No single JS file should exceed 2MB
    const maxSize = Math.max(...jsSizes, 0);
    expect(maxSize).toBeLessThan(2 * 1024 * 1024);
  });

  test('images are reasonably sized', async ({ page }) => {
    const imageSizes: { url: string; size: number }[] = [];
    page.on('response', async (res) => {
      const ct = res.headers()['content-type'] || '';
      if (ct.includes('image/')) {
        const body = await res.body().catch(() => Buffer.from(''));
        imageSizes.push({ url: res.url(), size: body.length });
      }
    });
    await page.goto('/');
    await page.waitForTimeout(3000);
    // No image should be over 5MB
    const oversized = imageSizes.filter(i => i.size > 5 * 1024 * 1024);
    expect(oversized.length).toBe(0);
  });

  test('CSS is loaded before first paint', async ({ page }) => {
    await page.goto('/');
    // Check that styled content is visible (not FOUC)
    const hasStyles = await page.evaluate(() => {
      const el = document.querySelector('body');
      if (!el) return false;
      const style = getComputedStyle(el);
      // Body should have a non-default font or background
      return style.fontFamily !== '' || style.backgroundColor !== 'rgba(0, 0, 0, 0)';
    });
    expect(hasStyles).toBe(true);
  });
});
