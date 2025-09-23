import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateWithGroq } from '../groq';

const originalProcessEnv = { ...process.env } as any;

describe('generateWithGroq', () => {
  beforeEach(() => {
    process.env = { ...originalProcessEnv } as any;
    (globalThis as any).fetch = vi.fn();
  });

  it('throws when API key missing', async () => {
    process.env.VITE_GROQ_API_KEY = '' as any;
    await expect(generateWithGroq('test')).rejects.toThrow('GROQ_API_KEY_MISSING');
  });

  it('throws when API key has invalid format', async () => {
    process.env.VITE_GROQ_API_KEY = 'invalid' as any;
    await expect(generateWithGroq('test')).rejects.toThrow('INVALID_API_KEY_FORMAT');
  });

  it('handles 401 invalid key response', async () => {
    process.env.VITE_GROQ_API_KEY = 'gsk_test_key' as any;
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Unauthorized' } }),
    }));

    await expect(generateWithGroq('hello')).rejects.toThrow('INVALID_API_KEY');
  });

  it('handles 429 rate limit response', async () => {
    process.env.VITE_GROQ_API_KEY = 'gsk_test_key' as any;
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: 'Rate limited' } }),
    }));

    await expect(generateWithGroq('hello')).rejects.toThrow('RATE_LIMIT_EXCEEDED');
  });

  it('returns generated content on success', async () => {
    process.env.VITE_GROQ_API_KEY = 'gsk_test_key' as any;
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [
          { message: { role: 'assistant', content: 'generated text' } }
        ]
      }),
    }));

    const result = await generateWithGroq('hello');
    expect(result).toBe('generated text');
  });
});

