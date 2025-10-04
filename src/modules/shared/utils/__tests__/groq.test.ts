import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateWithGroq } from '../groq';

// Mock fetch
global.fetch = vi.fn();

describe('groq', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    vi.stubEnv('VITE_GROQ_API_KEY', 'gsk_test123456789');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('generateWithGroq', () => {
    it('should generate story successfully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Generated story content'
            }
          }]
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await generateWithGroq('Test prompt');

      expect(result).toBe('Generated story content');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer gsk_test123456789'
          },
          body: expect.stringContaining('Test prompt')
        })
      );
    });

    it('should throw error when API key is missing', async () => {
      vi.stubEnv('VITE_GROQ_API_KEY', '');

      await expect(generateWithGroq('Test prompt')).rejects.toThrow('GROQ_API_KEY_MISSING');
    });

    it('should throw error when API key format is invalid', async () => {
      vi.stubEnv('VITE_GROQ_API_KEY', 'invalid-key');

      await expect(generateWithGroq('Test prompt')).rejects.toThrow('INVALID_API_KEY_FORMAT');
    });

    it('should handle 401 unauthorized error', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Invalid API key' }
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(generateWithGroq('Test prompt')).rejects.toThrow('INVALID_API_KEY');
    });

    it('should handle 429 rate limit error', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Rate limit exceeded' }
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(generateWithGroq('Test prompt')).rejects.toThrow('RATE_LIMIT_EXCEEDED');
    });

    it('should handle other API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Internal server error' }
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(generateWithGroq('Test prompt')).rejects.toThrow('API_ERROR: Internal server error');
    });

    it('should handle API errors without error message', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({})
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(generateWithGroq('Test prompt')).rejects.toThrow('API_ERROR: Unknown error');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(generateWithGroq('Test prompt')).rejects.toThrow('Network error');
    });

    it('should use correct model and parameters', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Generated story' } }]
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await generateWithGroq('Test prompt');

      const callArgs = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody).toEqual({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: 'You are a creative writer specializing in humorous alternate reality stories and chapter generation.'
          },
          {
            role: 'user',
            content: 'Test prompt'
          }
        ],
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 1,
        stop: null
      });
    });

    it('should handle empty response gracefully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: []
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(generateWithGroq('Test prompt')).rejects.toThrow();
    });

    it('should handle malformed response', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{}] // Missing message property
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(generateWithGroq('Test prompt')).rejects.toThrow();
    });

    it('should log errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Server error' }
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      try {
        await generateWithGroq('Test prompt');
      } catch (error) {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith('Groq API error:', { error: { message: 'Server error' } });
      
      consoleSpy.mockRestore();
    });

    it('should handle JSON parsing errors in error response', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(generateWithGroq('Test prompt')).rejects.toThrow('Invalid JSON');
    });
  });
});