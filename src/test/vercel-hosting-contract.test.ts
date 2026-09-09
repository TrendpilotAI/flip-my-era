import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

describe('Vercel hosting contract', () => {
  it('mounts Better Auth through its native Node adapter', () => {
    const handlerPath = resolve(repoRoot, 'api/auth/[...path].ts');
    const handler = readFileSync(handlerPath, 'utf8');

    expect(handler).toContain("from 'better-auth/node'");
    expect(handler).toContain('toNodeHandler(auth)');
  });

  it('builds the Vite app, preserves SPA deep links, and applies security headers', () => {
    const config = JSON.parse(
      readFileSync(resolve(repoRoot, 'vercel.json'), 'utf8'),
    ) as {
      buildCommand?: string;
      outputDirectory?: string;
      routes?: Array<{
        continue?: boolean;
        handle?: string;
        src?: string;
        dest?: string;
        headers?: Record<string, string>;
      }>;
    };

    expect(config.buildCommand).toBe('bun run build');
    expect(config.outputDirectory).toBe('dist');
    expect(config.routes?.[0]?.src).toBe('/(.*)');
    expect(config.routes?.[0]?.continue).toBe(true);
    expect(config.routes?.[1]).toMatchObject({
      src: '/assets/(.*)',
      continue: true,
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
    expect(config.routes?.[2]).toEqual({
      src: '/api/auth/(.*)',
      dest: '/api/auth/[...path]',
    });
    expect(config.routes?.[3]).toEqual({
      handle: 'filesystem',
    });
    expect(config.routes?.[4]).toEqual({
      src: '/(.*)',
      dest: '/index.html',
    });

    const headerNames = new Set(Object.keys(config.routes?.[0]?.headers ?? {}));
    for (const expectedHeader of [
      'Content-Security-Policy',
      'Permissions-Policy',
      'Referrer-Policy',
      'X-Content-Type-Options',
      'X-Frame-Options',
    ]) {
      expect(headerNames.has(expectedHeader)).toBe(true);
    }
  });

  it('does not retain the Netlify deployment adapter', () => {
    expect(existsSync(resolve(repoRoot, 'netlify.toml'))).toBe(false);
    expect(existsSync(resolve(repoRoot, 'netlify/functions/auth.ts'))).toBe(false);
  });

  it('excludes local credentials and provider caches from deployment uploads', () => {
    const ignored = readFileSync(resolve(repoRoot, '.vercelignore'), 'utf8').split('\n');

    expect(ignored).toContain('.env.*');
    expect(ignored).toContain('.netlify');
    expect(ignored).toContain('.vercel');
    expect(ignored).toContain('node_modules');
  });
});
