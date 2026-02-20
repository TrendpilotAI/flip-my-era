/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.unmock('@/modules/story/services/storylineGeneration');

import { generateStoryline, type GenerateStorylineParams, type Storyline } from '../storylineGeneration';
import { __testSupabaseMocks__ } from '@/test/setup';

vi.mock('../../utils/promptLoader', () => ({
  getCombinedSystemPrompt: vi.fn().mockReturnValue('Mock system prompt for testing'),
}));

vi.mock('@/core/integrations/sentry', () => ({
  sentryService: {
    addBreadcrumb: vi.fn(),
    captureException: vi.fn(),
    startTransaction: vi.fn(() => ({
      setTag: vi.fn(),
      finish: vi.fn(),
    })),
  },
}));

vi.mock('@/core/integrations/posthog', () => ({
  posthogEvents: {
    storylineGenerationStarted: vi.fn(),
    storylineGenerationCompleted: vi.fn(),
    storylineGenerationFailed: vi.fn(),
  },
}));

const mockStoryline: Storyline = {
  logline: 'When a mysterious letter arrives, a dreamer must find courage.',
  threeActStructure: {
    act1: { setup: 'Setup', incitingIncident: 'Incident', firstPlotPoint: 'Plot point' },
    act2: { risingAction: 'Rising', midpoint: 'Midpoint', darkNightOfTheSoul: 'Dark night' },
    act3: { climax: 'Climax', resolution: 'Resolution', closingImage: 'Closing' },
  },
  chapters: [
    { number: 1, title: 'Chapter 1', summary: 'Summary 1', wordCountTarget: 1000 },
  ],
  themes: ['courage', 'friendship'],
  wordCountTotal: 1000,
};

const defaultParams: GenerateStorylineParams = {
  era: '1989',
  characterName: 'Taylor',
  characterArchetype: 'The Dreamer',
  gender: 'same',
  location: 'New York',
  promptDescription: 'A story about finding yourself',
};

describe('generateStoryline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful fetch for debug agent logs (so they don't hit real network)
    (globalThis as any).fetch = vi.fn().mockResolvedValue(new Response('ok'));
    // Default successful response
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: { storyline: mockStoryline },
      error: null,
    });
  });

  it('should generate a storyline successfully', async () => {
    const result = await generateStoryline(defaultParams, 'mock-clerk-token');

    expect(result).toEqual(mockStoryline);
    expect(__testSupabaseMocks__.supabase.functions.invoke).toHaveBeenCalledWith(
      'groq-storyline',
      expect.objectContaining({
        body: expect.objectContaining({
          era: '1989',
          characterName: 'Taylor',
          characterArchetype: 'The Dreamer',
        }),
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-clerk-token',
        }),
      }),
    );
  });

  it('should throw UNAUTHORIZED when no token provided', async () => {
    await expect(generateStoryline(defaultParams, null)).rejects.toThrow('UNAUTHORIZED');
    // Should not invoke the edge function
    expect(__testSupabaseMocks__.supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('should throw UNAUTHORIZED on 401 error response', async () => {
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'UNAUTHORIZED - 401' },
    });

    await expect(generateStoryline(defaultParams, 'mock-token')).rejects.toThrow('UNAUTHORIZED');
  });

  it('should throw GROQ_API_KEY_MISSING on missing API key error', async () => {
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'GROQ_API_KEY_MISSING' },
    });

    await expect(generateStoryline(defaultParams, 'mock-token')).rejects.toThrow('GROQ_API_KEY_MISSING');
  });

  it('should throw on INVALID_STORYLINE error', async () => {
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'INVALID_STORYLINE' },
    });

    await expect(generateStoryline(defaultParams, 'mock-token')).rejects.toThrow('Invalid storyline structure');
  });

  it('should throw on generic edge function error', async () => {
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Internal server error' },
    });

    await expect(generateStoryline(defaultParams, 'mock-token')).rejects.toThrow('Internal server error');
  });

  it('should throw on null data response', async () => {
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(generateStoryline(defaultParams, 'mock-token')).rejects.toThrow('Failed to generate storyline');
  });

  it('should throw on data with error field', async () => {
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: { error: 'Bad request', message: 'Invalid input data' },
      error: null,
    });

    await expect(generateStoryline(defaultParams, 'mock-token')).rejects.toThrow('Invalid input data');
  });

  it('should pass custom prompt when provided', async () => {
    const paramsWithCustom = { ...defaultParams, customPrompt: 'My custom story idea' };
    await generateStoryline(paramsWithCustom, 'mock-token');

    expect(__testSupabaseMocks__.supabase.functions.invoke).toHaveBeenCalledWith(
      'groq-storyline',
      expect.objectContaining({
        body: expect.objectContaining({
          customPrompt: 'My custom story idea',
        }),
      }),
    );
  });

  it('should report errors to Sentry', async () => {
    const { sentryService } = await import('@/core/integrations/sentry');
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    await expect(generateStoryline(defaultParams, 'mock-token')).rejects.toThrow();
    expect(sentryService.captureException).toHaveBeenCalled();
  });

  it('should track generation events with PostHog', async () => {
    const { posthogEvents } = await import('@/core/integrations/posthog');
    await generateStoryline(defaultParams, 'mock-token');

    expect(posthogEvents.storylineGenerationStarted).toHaveBeenCalledWith(
      expect.objectContaining({ era: '1989', characterName: 'Taylor' }),
    );
    expect(posthogEvents.storylineGenerationCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ era: '1989', characterName: 'Taylor' }),
    );
  });

  it('should track failure events with PostHog', async () => {
    const { posthogEvents } = await import('@/core/integrations/posthog');
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    await expect(generateStoryline(defaultParams, 'mock-token')).rejects.toThrow();
    expect(posthogEvents.storylineGenerationFailed).toHaveBeenCalled();
  });
});
