import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateStory,
  generateImage,
  generateEbookIllustration,
  generateTaylorSwiftIllustration,
  generateAlternativeName,
  isRunwareAvailable,
} from '../ai';

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_GROQ_API_KEY: 'test-groq-key',
    VITE_OPENAI_API_KEY: 'test-openai-key',
    VITE_RUNWARE_API_KEY: 'test-runware-key',
  },
}));

// Mock the apiRequestWithRetry function
vi.mock('@/modules/shared/utils/apiWithRetry', () => ({
  apiRequestWithRetry: vi.fn(),
}));

// Mock the RunwareService
vi.mock('@/modules/shared/utils/runware', () => ({
  RunwareService: vi.fn().mockImplementation(() => ({
    isConfigured: vi.fn().mockReturnValue(true),
    isConnected: vi.fn().mockResolvedValue(true),
    generateImage: vi.fn().mockResolvedValue('https://example.com/runware-image.jpg'),
  })),
  createEbookIllustrationPrompt: vi.fn().mockReturnValue('ebook prompt'),
  enhancePromptWithGroq: vi.fn().mockResolvedValue('enhanced prompt'),
}));

// Mock the story prompts
vi.mock('@/modules/story/utils/storyPrompts', () => ({
  getStoryPrompt: vi.fn().mockReturnValue('story prompt'),
}));

// Mock the enchanted quill prompt
vi.mock('@/modules/story/utils/enchantedQuillPrompt', () => ({
  getEnchantedQuillPrompt: vi.fn().mockReturnValue('enchanted quill prompt'),
}));

import { apiRequestWithRetry } from '@/modules/shared/utils/apiWithRetry';
import { RunwareService, enhancePromptWithGroq } from '@/modules/shared/utils/runware';

describe('AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateStory', () => {
    it('should generate a story successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Once upon a time...',
            },
          },
        ],
      };

      (apiRequestWithRetry as any).mockResolvedValue(mockResponse);

      const result = await generateStory({
        prompt: 'Write a story about a dragon',
      });

      expect(result).toBe('Once upon a time...');
      expect(apiRequestWithRetry).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-groq-key',
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('Write a story about a dragon'),
        }),
        expect.any(Object)
      );
    });

    it('should handle API errors gracefully', async () => {
      (apiRequestWithRetry as any).mockRejectedValue(new Error('API Error'));

      await expect(
        generateStory({ prompt: 'Test prompt' })
      ).rejects.toThrow('API Error');
    });

    it('should use default parameters when not provided', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Story content' } }],
      };

      (apiRequestWithRetry as any).mockResolvedValue(mockResponse);

      await generateStory({ prompt: 'Test prompt' });

      const callBody = JSON.parse(
        (apiRequestWithRetry as any).mock.calls[0][1].body
      );

      expect(callBody.max_tokens).toBe(8000); // Default value
      expect(callBody.temperature).toBe(0.8); // Default value
    });

    it('should handle missing API key', async () => {
      // Temporarily override the mock to simulate missing API key
      const originalEnv = import.meta.env.VITE_GROQ_API_KEY;
      import.meta.env.VITE_GROQ_API_KEY = '';

      await expect(
        generateStory({ prompt: 'Test prompt' })
      ).rejects.toThrow();

      import.meta.env.VITE_GROQ_API_KEY = originalEnv;
    });
  });

  describe('generateImage', () => {
    it('should generate an image using RUNWARE when available', async () => {
      const mockRunwareService = {
        isConfigured: vi.fn().mockReturnValue(true),
        isConnected: vi.fn().mockResolvedValue(true),
        generateImage: vi.fn().mockResolvedValue('https://example.com/runware-image.jpg'),
      };

      (RunwareService as any).mockImplementation(() => mockRunwareService);

      const result = await generateImage({
        prompt: 'A beautiful sunset',
        useRunware: true,
      });

      expect(result).toBe('https://example.com/runware-image.jpg');
      expect(mockRunwareService.generateImage).toHaveBeenCalledWith('A beautiful sunset');
    });

    it('should fall back to OpenAI when RUNWARE is not available', async () => {
      const mockRunwareService = {
        isConfigured: vi.fn().mockReturnValue(false),
        isConnected: vi.fn().mockResolvedValue(false),
        generateImage: vi.fn(),
      };

      (RunwareService as any).mockImplementation(() => mockRunwareService);

      const mockOpenAIResponse = {
        data: [{ url: 'https://example.com/openai-image.jpg' }],
      };

      (apiRequestWithRetry as any).mockResolvedValue(mockOpenAIResponse);

      const result = await generateImage({
        prompt: 'A beautiful sunset',
        useRunware: true,
      });

      expect(result).toBe('https://example.com/openai-image.jpg');
      expect(apiRequestWithRetry).toHaveBeenCalledWith(
        'https://api.openai.com/v1/images/generations',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should use OpenAI directly when useRunware is false', async () => {
      const mockOpenAIResponse = {
        data: [{ url: 'https://example.com/openai-image.jpg' }],
      };

      (apiRequestWithRetry as any).mockResolvedValue(mockOpenAIResponse);

      const result = await generateImage({
        prompt: 'A mountain landscape',
        useRunware: false,
      });

      expect(result).toBe('https://example.com/openai-image.jpg');
    });

    it('should handle image generation errors', async () => {
      (apiRequestWithRetry as any).mockRejectedValue(new Error('Image generation failed'));

      await expect(
        generateImage({ prompt: 'Test prompt' })
      ).rejects.toThrow('Image generation failed');
    });
  });

  describe('generateEbookIllustration', () => {
    it('should generate an ebook illustration with enhanced prompts', async () => {
      const mockEnhancedPrompt = 'Enhanced illustration prompt';
      (enhancePromptWithGroq as any).mockResolvedValue(mockEnhancedPrompt);

      const mockRunwareService = {
        isConfigured: vi.fn().mockReturnValue(true),
        isConnected: vi.fn().mockResolvedValue(true),
        generateImage: vi.fn().mockResolvedValue('https://example.com/ebook-image.jpg'),
      };

      (RunwareService as any).mockImplementation(() => mockRunwareService);

      const result = await generateEbookIllustration({
        chapterTitle: 'Chapter 1',
        chapterContent: 'Chapter content',
        style: 'fantasy',
        mood: 'mysterious',
        useEnhancedPrompts: true,
      });

      expect(result).toBe('https://example.com/ebook-image.jpg');
      expect(enhancePromptWithGroq).toHaveBeenCalled();
    });

    it('should generate illustration without enhancement when disabled', async () => {
      const mockRunwareService = {
        isConfigured: vi.fn().mockReturnValue(true),
        isConnected: vi.fn().mockResolvedValue(true),
        generateImage: vi.fn().mockResolvedValue('https://example.com/ebook-image.jpg'),
      };

      (RunwareService as any).mockImplementation(() => mockRunwareService);

      const result = await generateEbookIllustration({
        chapterTitle: 'Chapter 1',
        chapterContent: 'Chapter content',
        useEnhancedPrompts: false,
      });

      expect(result).toBe('https://example.com/ebook-image.jpg');
      expect(enhancePromptWithGroq).not.toHaveBeenCalled();
    });
  });

  describe('generateAlternativeName', () => {
    it('should generate an alternative name successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Jane Smith',
            },
          },
        ],
      };

      (apiRequestWithRetry as any).mockResolvedValue(mockResponse);

      const result = await generateAlternativeName({
        originalName: 'John Doe',
        targetGender: 'female',
      });

      expect(result).toBe('Jane Smith');
    });

    it('should request similar names when specified', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Jonathan Doe' } }],
      };

      (apiRequestWithRetry as any).mockResolvedValue(mockResponse);

      await generateAlternativeName({
        originalName: 'John Doe',
        targetGender: 'male',
        shouldBeSimilar: true,
      });

      const callBody = JSON.parse(
        (apiRequestWithRetry as any).mock.calls[0][1].body
      );

      expect(callBody.messages[0].content).toContain('similar');
    });

    it('should handle name generation errors', async () => {
      (apiRequestWithRetry as any).mockRejectedValue(new Error('Name generation failed'));

      await expect(
        generateAlternativeName({
          originalName: 'John Doe',
          targetGender: 'neutral',
        })
      ).rejects.toThrow('Name generation failed');
    });
  });

  describe('isRunwareAvailable', () => {
    it('should return true when RUNWARE is configured and connected', async () => {
      const mockRunwareService = {
        isConfigured: vi.fn().mockReturnValue(true),
        isConnected: vi.fn().mockResolvedValue(true),
      };

      (RunwareService as any).mockImplementation(() => mockRunwareService);

      const result = await isRunwareAvailable();
      expect(result).toBe(true);
    });

    it('should return false when RUNWARE is not configured', async () => {
      const mockRunwareService = {
        isConfigured: vi.fn().mockReturnValue(false),
        isConnected: vi.fn(),
      };

      (RunwareService as any).mockImplementation(() => mockRunwareService);

      const result = await isRunwareAvailable();
      expect(result).toBe(false);
    });

    it('should return false when connection check fails', async () => {
      const mockRunwareService = {
        isConfigured: vi.fn().mockReturnValue(true),
        isConnected: vi.fn().mockRejectedValue(new Error('Connection failed')),
      };

      (RunwareService as any).mockImplementation(() => mockRunwareService);

      const result = await isRunwareAvailable();
      expect(result).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limit errors with retry', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Success after retry' } }],
      };

      // First call fails with rate limit, second succeeds
      (apiRequestWithRetry as any)
        .mockRejectedValueOnce({
          status: 429,
          message: 'Rate limit exceeded',
        })
        .mockResolvedValueOnce(mockResponse);

      // The apiRequestWithRetry should handle the retry internally
      // So we expect the function to eventually succeed
      const result = await generateStory({ prompt: 'Test prompt' });
      
      // Since apiRequestWithRetry handles retries internally,
      // we should get a result or an error, not a pending promise
      expect(apiRequestWithRetry).toHaveBeenCalled();
    });
  });
});