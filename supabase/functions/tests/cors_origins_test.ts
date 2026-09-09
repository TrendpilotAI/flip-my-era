import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

import {
  getCorsHeaders,
  isAllowedOrigin,
  rejectUntrustedOrigin,
} from '../_shared/utils.ts';

Deno.test('allows the stable FlipMyEra origins', () => {
  for (const origin of [
    'https://flipmyera.com',
    'https://www.flipmyera.com',
    'https://flip-my-era.vercel.app',
    'https://flip-my-era-trendpilotais-projects.vercel.app',
    'https://flip-my-era-preview.vercel.app',
  ]) {
    assertEquals(isAllowedOrigin(origin), true);
  }
});

Deno.test('does not trust arbitrary Vercel preview deployments', () => {
  const previewOrigin = 'https://flip-my-era-git-feature-123-trendpilotais-projects.vercel.app';
  const headers = getCorsHeaders(new Request('https://example.test', {
    headers: { Origin: previewOrigin },
  }));

  assertEquals(isAllowedOrigin(previewOrigin, 'production'), false);
  assertEquals(headers['Access-Control-Allow-Origin'], undefined);
});

Deno.test('allows local origins only in development', () => {
  const localOrigin = 'http://gallery-hybrid.localhost:1355';

  assertEquals(isAllowedOrigin(localOrigin, 'production'), false);
  assertEquals(isAllowedOrigin(localOrigin, 'development'), true);
});

Deno.test('rejects lookalike and malformed Vercel origins', () => {
  for (const origin of [
    'https://flip-my-era-attacker.vercel.app',
    'https://flip-my-era-trendpilotais-projects.vercel.app.attacker.invalid',
    'http://flip-my-era-trendpilotais-projects.vercel.app',
    'https://flip-my-era-trendpilotais-projects.vercel.app/path',
  ]) {
    assertEquals(isAllowedOrigin(origin), false);
    assertEquals(
      rejectUntrustedOrigin(new Request('https://example.test', {
        headers: { Origin: origin },
      }))?.status,
      403,
    );
  }
});
