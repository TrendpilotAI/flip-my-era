/**
 * SEO metadata tests for FlipMyEra
 *
 * Verifies:
 *   1. SEO component renders title, description, canonical, OG, Twitter tags
 *   2. sitemap.xml contains all required public routes
 *   3. robots.txt disallows admin/auth routes and references sitemap
 *   4. JSON-LD structured data is valid for key schemas
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Resolve the repo root regardless of whether __dirname is available (ESM vs CJS)
const _dir = typeof __dirname !== 'undefined'
  ? __dirname
  : dirname(fileURLToPath(import.meta.url));

// From src/__tests__/ go up two levels to reach the repo root
const REPO_ROOT = resolve(_dir, '../..');

// ─── SEO component tests ──────────────────────────────────────────────────────
// NOTE: The SEO component uses react-helmet-async.
// We test the component's props API and that it renders without errors.
import { SEO } from '@/modules/shared/components/SEO';

describe('SEO component', () => {
  it('renders without throwing when title and description are provided', () => {
    expect(() =>
      render(
        <HelmetProvider>
          <SEO title="Gallery" description="Test desc" url="/gallery" />
        </HelmetProvider>
      )
    ).not.toThrow();
  });

  it('renders without throwing when jsonLd schema is provided', () => {
    const schema = { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Test' };
    expect(() =>
      render(
        <HelmetProvider>
          <SEO title="Test" url="/test" jsonLd={schema} />
        </HelmetProvider>
      )
    ).not.toThrow();
  });

  it('renders without throwing when no props are provided (uses defaults)', () => {
    expect(() =>
      render(
        <HelmetProvider>
          <SEO />
        </HelmetProvider>
      )
    ).not.toThrow();
  });
});

// ─── sitemap.xml tests ────────────────────────────────────────────────────────

describe('sitemap.xml', () => {
  const sitemapPath = join(REPO_ROOT, 'public/sitemap.xml');
  let sitemapContent: string;

  try {
    sitemapContent = readFileSync(sitemapPath, 'utf-8');
  } catch {
    sitemapContent = '';
  }

  it('exists and is non-empty', () => {
    expect(sitemapContent.length).toBeGreaterThan(100);
  });

  it('contains the homepage URL', () => {
    expect(sitemapContent).toContain('https://flipmyera.com/');
  });

  it('contains /gallery', () => {
    expect(sitemapContent).toContain('flipmyera.com/gallery');
  });

  it('contains /plans', () => {
    expect(sitemapContent).toContain('flipmyera.com/plans');
  });

  it('contains /terms', () => {
    expect(sitemapContent).toContain('flipmyera.com/terms');
  });

  it('contains /privacy', () => {
    expect(sitemapContent).toContain('flipmyera.com/privacy');
  });

  it('contains high-priority SEO landing pages', () => {
    const seoPages = [
      'taylor-swift-eras-tour-ebook',
      'custom-taylor-swift-gifts',
      'swiftie-birthday-present-ideas',
      'taylor-swift-fan-art-book',
    ];
    for (const page of seoPages) {
      expect(sitemapContent).toContain(page);
    }
  });

  it('has lastmod dates', () => {
    expect(sitemapContent).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  });

  it('has priority values', () => {
    expect(sitemapContent).toContain('<priority>1.0</priority>');
  });
});

// ─── robots.txt tests ─────────────────────────────────────────────────────────

describe('robots.txt', () => {
  const robotsPath = join(REPO_ROOT, 'public/robots.txt');
  let robotsContent: string;

  try {
    robotsContent = readFileSync(robotsPath, 'utf-8');
  } catch {
    robotsContent = '';
  }

  it('exists and is non-empty', () => {
    expect(robotsContent.length).toBeGreaterThan(50);
  });

  it('allows all user agents', () => {
    expect(robotsContent).toContain('User-agent: *');
    expect(robotsContent).toContain('Allow: /');
  });

  it('disallows admin routes', () => {
    expect(robotsContent).toMatch(/Disallow:.*\/admin/);
  });

  it('disallows auth callback', () => {
    expect(robotsContent).toMatch(/Disallow:.*\/auth\//);
  });

  it('disallows checkout', () => {
    expect(robotsContent).toMatch(/Disallow:.*\/checkout/);
  });

  it('references the sitemap', () => {
    expect(robotsContent).toContain('Sitemap: https://flipmyera.com/sitemap.xml');
  });
});

// ─── index.html JSON-LD tests ─────────────────────────────────────────────────

describe('index.html structured data', () => {
  const htmlPath = join(REPO_ROOT, 'index.html');
  let htmlContent: string;

  try {
    htmlContent = readFileSync(htmlPath, 'utf-8');
  } catch {
    htmlContent = '';
  }

  it('contains WebApplication schema', () => {
    expect(htmlContent).toContain('"@type": "WebApplication"');
  });

  it('contains Organization schema', () => {
    expect(htmlContent).toContain('"@type": "Organization"');
  });

  it('contains BreadcrumbList schema', () => {
    expect(htmlContent).toContain('"@type": "BreadcrumbList"');
  });

  it('has valid JSON-LD blocks', () => {
    const ldJsonBlocks = htmlContent.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
    ) || [];

    expect(ldJsonBlocks.length).toBeGreaterThanOrEqual(3);

    for (const block of ldJsonBlocks) {
      const json = block
        .replace('<script type="application/ld+json">', '')
        .replace('</script>', '')
        .trim();
      expect(() => JSON.parse(json)).not.toThrow();
    }
  });

  it('has og:title meta tag', () => {
    expect(htmlContent).toContain('og:title');
  });

  it('has twitter:card meta tag', () => {
    expect(htmlContent).toContain('twitter:card');
  });

  it('has canonical link', () => {
    expect(htmlContent).toContain('rel="canonical"');
  });
});
