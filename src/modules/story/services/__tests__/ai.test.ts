/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock the module under test - setup.ts globally mocks it
vi.unmock('@/modules/story/services/ai');

import {
  generateStory,
  generateImage,
  generateAlternativeName,
} from '../ai';

// ── vi.hoisted() – mock values declared before vi.mock() factories ──
const mocks = vi.hoisted(() => {
  const mockRunwareService = {
    isConfigured: vi.fn(),
    isConnected: vi.fn(),
    generateImage: vi.fn(),
    generateEbookIllustration: vi.fn(),
    generateTaylorSwiftIllustration: vi.fn(),
    generateMultipleImages: vi.fn(),
  };

  const mockApiRequestWithRetry = vi.fn();
  const mockEnhancePromptWithGroq = vi.fn().mockResolvedValue('enhanced prompt');

  return { mockRunwareService, mockApiRequestWithRetry, mockEnhancePromptWithGroq };
});

vi.mock('@/modules/shared/utils/apiWithRetry', () => ({
  apiRequestWithRetry: mocks.mockApiRequestWithRetry,
}));

vi.mock('@/modules/shared/utils/runware', () => ({
  runwareService: mocks.mockRunwareService,
  createEbookIllustrationPrompt: vi.fn().mockReturnValue('ebook prompt'),
  enhancePromptWithGroq: mocks.mockEnhancePromptWithGroq,
  RUNWARE_MODELS: { FLUX_1_1_PRO: 'flux-pro' },
  RUNWARE_SCHEDULERS: { FLOW_MATCH_EULER_DISCRETE: 'scheduler' },
}));

vi.mock('@/modules/story/utils/storyPrompts', () => ({
  getStoryPrompt: vi.fn().mockReturnValue('story prompt'),
}));

vi.mock('@/modules/story/utils/enchantedQuillPrompt', () => ({
  getEnchantedQuillPrompt: vi.fn().mockReturnValue('enchanted quill prompt'),
}));

vi.mock('@/modules/shared/utils/env', () => ({
  getGroqApiKey: vi.fn().mockReturnValue('gsk_test123'),
}));

const defaultGeneratedImage = {
  imageUUID: 'mock-image-uuid',
  taskUUID: 'mock-task-uuid',
  imageURL: 'https://example.com/runware-image.jpg',
  positivePrompt: 'prompt',
  seed: 42,
};

describe('AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockRunwareService.isConfigured.mockReturnValue(true);
    mocks.mockRunwareService.isConnected.mockResolvedValue(true);
    mocks.mockRunwareService.generateImage.mockResolvedValue(defaultGeneratedImage);
    mocks.mockRunwareService.generateEbookIllustration.mockResolvedValue(defaultGeneratedImage);
    mocks.mockRunwareService.generateTaylorSwiftIllustration.mockResolvedValue(defaultGeneratedImage);
    mocks.mockRunwareService.generateMultipleImages.mockResolvedValue([defaultGeneratedImage]);
  });

  describe('generateStory', () => {
    it('should generate a story successfully', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Once upon a time...' } }],
        },
      };

      mocks.mockApiRequestWithRetry.mockResolvedValue(mockResponse);

      const result = await generateStory({ prompt: 'Write a story about a dragon' });

      expect(result).toBe('Once upon a time...');
      expect(mocks.mockApiRequestWithRetry).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mocks.mockApiRequestWithRetry.mockRejectedValue(new Error('API Error'));

      await expect(
        generateStory({ prompt: 'Test prompt' })
      ).rejects.toThrow('Story generation failed');
    });

    it('should use default parameters when not provided', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Story content' } }],
        },
      };

      mocks.mockApiRequestWithRetry.mockResolvedValue(mockResponse);

      const result = await generateStory({ prompt: 'Test prompt' });
      expect(result).toBe('Story content');
      expect(mocks.mockApiRequestWithRetry).toHaveBeenCalled();
    });
  });

  describe('generateImage', () => {
    it('should throw when Runware is not available (OpenAI fallback removed)', async () => {
      mocks.mockRunwareService.isConfigured.mockReturnValue(false);
      mocks.mockRunwareService.isConnected.mockResolvedValue(false);

      await expect(
        generateImage({ prompt: 'A beautiful sunset', useRunware: true })
      ).rejects.toThrow('Image generation failed');
    });

    it('should throw when useRunware is false (OpenAI fallback removed)', async () => {
      await expect(
        generateImage({ prompt: 'A mountain landscape', useRunware: false })
      ).rejects.toThrow('Image generation failed');
    });

    it('should throw on image generation errors', async () => {
      mocks.mockRunwareService.generateImage.mockRejectedValue(new Error('Runware down'));

      await expect(
        generateImage({ prompt: 'Test prompt', useRunware: true })
      ).rejects.toThrow('Image generation failed');
    });
  });

  describe('generateAlternativeName', () => {
    it('should generate an alternative name successfully', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Jane Smith' } }],
        },
      };

      mocks.mockApiRequestWithRetry.mockResolvedValue(mockResponse);

      const result = await generateAlternativeName({
        originalName: 'John Doe',
        targetGender: 'female',
      });

      expect(result).toBe('Jane Smith');
    });

    it('should request similar names when specified', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Jonathan Doe' } }],
        },
      };

      mocks.mockApiRequestWithRetry.mockResolvedValue(mockResponse);

      await generateAlternativeName({
        originalName: 'John Doe',
        targetGender: 'male',
        shouldBeSimilar: true,
      });

      expect(mocks.mockApiRequestWithRetry).toHaveBeenCalled();
    });

    it('should handle name generation errors', async () => {
      mocks.mockApiRequestWithRetry.mockRejectedValue(new Error('Name generation failed'));

      await expect(
        generateAlternativeName({
          originalName: 'John Doe',
          targetGender: 'neutral',
        })
      ).rejects.toThrow('Name generation failed');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle successful story generation with retry utility', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Success after retry' } }],
        },
      };

      mocks.mockApiRequestWithRetry.mockResolvedValue(mockResponse);

      const result = await generateStory({ prompt: 'Test prompt' });

      expect(result).toBe('Success after retry');
      expect(mocks.mockApiRequestWithRetry).toHaveBeenCalled();
    });
  });
});
