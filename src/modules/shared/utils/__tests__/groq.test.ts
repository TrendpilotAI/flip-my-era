import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock groq module to test the real implementation
vi.unmock('@/modules/shared/utils/groq');

import { generateWithGroq } from '../groq';
import { __testSupabaseMocks__ } from '@/test/setup';

describe('generateWithGroq', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: { content: 'Generated story content' },
      error: null,
    });
  });

  it('should generate content via Edge Function', async () => {
    const result = await generateWithGroq('Test prompt', 'mock-token');

    expect(result).toBe('Generated story content');
    expect(__testSupabaseMocks__.supabase.functions.invoke).toHaveBeenCalledWith(
      'groq-api',
      expect.objectContaining({
        body: expect.objectContaining({ prompt: 'Test prompt' }),
        headers: expect.objectContaining({ Authorization: 'Bearer mock-token' }),
      }),
    );
  });

  it('should throw UNAUTHORIZED when no token', async () => {
    await expect(generateWithGroq('Test prompt', null)).rejects.toThrow('UNAUTHORIZED');
  });

  it('should pass custom options', async () => {
    await generateWithGroq('Test prompt', 'mock-token', {
      model: 'custom-model',
      temperature: 0.5,
      maxTokens: 2048,
      systemPrompt: 'custom system prompt',
    });

    expect(__testSupabaseMocks__.supabase.functions.invoke).toHaveBeenCalledWith(
      'groq-api',
      expect.objectContaining({
        body: expect.objectContaining({
          model: 'custom-model',
          temperature: 0.5,
          maxTokens: 2048,
          systemPrompt: 'custom system prompt',
        }),
      }),
    );
  });

  it('should throw on Edge Function error', async () => {
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Internal server error' },
    });

    await expect(generateWithGroq('Test prompt', 'mock-token')).rejects.toThrow('Internal server error');
  });

  it('should throw UNAUTHORIZED on 401 error', async () => {
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'UNAUTHORIZED' },
    });

    await expect(generateWithGroq('Test prompt', 'mock-token')).rejects.toThrow('UNAUTHORIZED');
  });

  it('should throw RATE_LIMIT_EXCEEDED on 429 error', async () => {
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: '429 rate limit' },
    });

    await expect(generateWithGroq('Test prompt', 'mock-token')).rejects.toThrow('RATE_LIMIT_EXCEEDED');
  });

  it('should throw on empty data response', async () => {
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(generateWithGroq('Test prompt', 'mock-token')).rejects.toThrow('Failed to generate with Groq');
  });

  it('should throw on data with error field', async () => {
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: { error: 'Processing failed', message: 'Bad request' },
      error: null,
    });

    await expect(generateWithGroq('Test prompt', 'mock-token')).rejects.toThrow('Bad request');
  });

  it('should use default parameters', async () => {
    await generateWithGroq('Test prompt', 'mock-token');

    expect(__testSupabaseMocks__.supabase.functions.invoke).toHaveBeenCalledWith(
      'groq-api',
      expect.objectContaining({
        body: expect.objectContaining({
          model: 'openai/gpt-oss-120b',
          temperature: 0.7,
          maxTokens: 4096,
        }),
      }),
    );
  });
});
