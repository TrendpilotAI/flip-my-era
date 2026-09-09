import { describe, expect, it } from 'vitest';

import { getBetterAuthTrustedOrigins, getBetterAuthUrl } from './deployment-url';

describe('getBetterAuthUrl', () => {
  it('prefers an explicit Better Auth URL', () => {
    expect(getBetterAuthUrl({
      BETTER_AUTH_URL: 'http://localhost:3000/',
      VERCEL_URL: 'preview.example.vercel.app',
    })).toBe('http://localhost:3000');
  });

  it('normalizes the deployment-specific Vercel URL', () => {
    expect(getBetterAuthUrl({
      VERCEL_URL: 'flip-my-era-git-preview.example.vercel.app',
      VERCEL_PROJECT_PRODUCTION_URL: 'flip-my-era.vercel.app',
    })).toBe('https://flip-my-era-git-preview.example.vercel.app');
  });

  it('uses the stable project URL for a production deployment', () => {
    expect(getBetterAuthUrl({
      VERCEL_ENV: 'production',
      VERCEL_URL: 'flip-my-era-random-deployment.example.vercel.app',
      VERCEL_PROJECT_PRODUCTION_URL: 'flip-my-era.vercel.app',
    })).toBe('https://flip-my-era.vercel.app');
  });

  it('uses the stable Vercel production URL when no deployment URL is present', () => {
    expect(getBetterAuthUrl({
      VERCEL_PROJECT_PRODUCTION_URL: 'flip-my-era.vercel.app',
    })).toBe('https://flip-my-era.vercel.app');
  });

  it('retains the current production origin as a final fallback', () => {
    expect(getBetterAuthUrl({})).toBe('https://flipmyera.com');
  });
});

describe('getBetterAuthTrustedOrigins', () => {
  it('trusts the active deployment and stable application aliases', () => {
    const origins = getBetterAuthTrustedOrigins('https://flip-my-example-team.vercel.app/');

    expect(origins).toContain('https://flip-my-example-team.vercel.app');
    expect(origins).toContain('https://flip-my-era-preview.vercel.app');
    expect(origins).toContain('https://flip-my-era.vercel.app');
    expect(origins).toContain('https://flipmyera.com');
  });
});
