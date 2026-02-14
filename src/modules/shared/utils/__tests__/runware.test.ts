/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock runware module to test the real implementations
vi.unmock('@/modules/shared/utils/runware');

import {
  RUNWARE_MODELS,
  RUNWARE_SCHEDULERS,
  getModelArchitecture,
  filterParamsForModel,
  createEbookIllustrationPrompt,
  enhancePromptWithGroq,
} from '../runware';

describe('runware utilities', () => {
  describe('RUNWARE_MODELS', () => {
    it('should define FLUX model', () => {
      expect(RUNWARE_MODELS.FLUX_1_1_PRO).toBeDefined();
      expect(typeof RUNWARE_MODELS.FLUX_1_1_PRO).toBe('string');
    });
  });

  describe('RUNWARE_SCHEDULERS', () => {
    it('should define FLOW_MATCH_EULER_DISCRETE scheduler', () => {
      expect(RUNWARE_SCHEDULERS.FLOW_MATCH_EULER_DISCRETE).toBeDefined();
    });
  });

  describe('getModelArchitecture', () => {
    it('should identify FLUX models', () => {
      expect(getModelArchitecture(RUNWARE_MODELS.FLUX_1_1_PRO)).toBe('FLUX');
    });

    it('should default to SD15 for unknown models', () => {
      expect(getModelArchitecture('unknown-model')).toBe('SD15');
    });
  });

  describe('filterParamsForModel', () => {
    it('should filter FLUX-incompatible parameters', () => {
      const params = {
        positivePrompt: 'Test prompt',
        negativePrompt: 'Bad prompt',
        CFGScale: 7.5,
        checkNSFW: true,
        strength: 0.8,
        model: RUNWARE_MODELS.FLUX_1_1_PRO,
      };

      const filtered = filterParamsForModel(params);

      expect(filtered.positivePrompt).toBe('Test prompt');
      expect(filtered.negativePrompt).toBeUndefined();
      expect(filtered.CFGScale).toBeUndefined();
      expect(filtered.checkNSFW).toBeUndefined();
      expect(filtered.strength).toBeUndefined();
    });

    it('should keep all parameters for non-FLUX models', () => {
      const params = {
        positivePrompt: 'Test prompt',
        negativePrompt: 'Bad prompt',
        CFGScale: 7.5,
        model: 'unknown-model',
      };

      const filtered = filterParamsForModel(params);

      expect(filtered.positivePrompt).toBe('Test prompt');
      expect(filtered.negativePrompt).toBe('Bad prompt');
      expect(filtered.CFGScale).toBe(7.5);
    });
  });

  describe('createEbookIllustrationPrompt', () => {
    it('should create prompt for children style', () => {
      const result = createEbookIllustrationPrompt({
        chapterTitle: 'Adventure Begins',
        chapterContent: 'The hero starts their journey...',
        style: 'children',
        mood: 'happy',
      });

      expect(result).toContain('Adventure Begins');
      expect(result).toContain('children');
      // mood "happy" maps to descriptors like "cheerful, bright"
      expect(result).toContain('cheerful');
    });

    it('should create prompt for fantasy style', () => {
      const result = createEbookIllustrationPrompt({
        chapterTitle: 'Magic Forest',
        chapterContent: 'In the enchanted woods...',
        style: 'fantasy',
        mood: 'mysterious',
      });

      expect(result).toContain('Magic Forest');
      // style "fantasy" maps to descriptors like "magical, ethereal"
      expect(result).toContain('magical');
    });

    it('should handle missing style and mood', () => {
      const result = createEbookIllustrationPrompt({
        chapterTitle: 'Test Chapter',
        chapterContent: 'Test content',
      });

      expect(result).toContain('Test Chapter');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('enhancePromptWithGroq', () => {
    it('should fallback to basic prompt when no token provided', async () => {
      const result = await enhancePromptWithGroq(
        { chapterTitle: 'Test', chapterContent: 'Content', style: 'children', mood: 'happy' },
        null,
      );

      const basicPrompt = createEbookIllustrationPrompt({
        chapterTitle: 'Test',
        chapterContent: 'Content',
        style: 'children',
        mood: 'happy',
      });

      expect(result).toBe(basicPrompt);
    });

    it('should enhance prompt via Edge Function when token provided', async () => {
      // The function uses dynamic import of generateWithGroq which is mocked globally
      // by setup.ts. We need to import and configure that mock.
      const { generateWithGroq: mockGroq } = await import('@/modules/shared/utils/groq');
      (mockGroq as any).mockResolvedValue('Enhanced illustration prompt');

      const result = await enhancePromptWithGroq(
        { chapterTitle: 'Test Chapter', chapterContent: 'Test content', style: 'children', mood: 'happy' },
        'mock-clerk-token',
      );

      expect(result).toBe('Enhanced illustration prompt');
    });

    it('should fallback to basic prompt on Edge Function failure', async () => {
      const { generateWithGroq: mockGroq } = await import('@/modules/shared/utils/groq');
      (mockGroq as any).mockRejectedValue(new Error('Edge Function failed'));

      const result = await enhancePromptWithGroq(
        { chapterTitle: 'Test Chapter', chapterContent: 'Test content', style: 'children', mood: 'happy' },
        'mock-clerk-token',
      );

      const expectedBasicPrompt = createEbookIllustrationPrompt({
        chapterTitle: 'Test Chapter',
        chapterContent: 'Test content',
        style: 'children',
        mood: 'happy',
      });

      expect(result).toBe(expectedBasicPrompt);
    });
  });
});
