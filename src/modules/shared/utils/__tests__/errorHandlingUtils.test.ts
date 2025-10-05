import { describe, it, expect, vi } from 'vitest';
import {
  normalizeError,
  isRetryableError,
  calculateRetryDelay,
  handleStreamingGenerationError,
  getUserFriendlyErrorMessage,
  logErrorWithContext,
  type GenerationError,
  type GenerationErrorContext
} from '../errorHandlingUtils';

describe('errorHandlingUtils', () => {
  describe('normalizeError', () => {
    it('should normalize Error instances correctly', () => {
      const error = new Error('Network connection failed');
      const context: GenerationErrorContext = {
        operation: 'story_generation',
        component: 'StoryForm'
      };

      const result = normalizeError(error, context);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Network connection failed');
      expect(result.context).toEqual(context);
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.retryable).toBe(true);
    });

    it('should handle non-Error values', () => {
      const error = 'String error';
      const result = normalizeError(error);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('String error');
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.retryable).toBe(false);
    });

    it('should classify different error types correctly', () => {
      const testCases = [
        { message: 'fetch failed', expectedCode: 'NETWORK_ERROR', expectedRetryable: true },
        { message: 'timeout occurred', expectedCode: 'TIMEOUT_ERROR', expectedRetryable: true },
        { message: 'rate limit exceeded', expectedCode: 'RATE_LIMIT_ERROR', expectedRetryable: true },
        { message: 'invalid token', expectedCode: 'AUTH_ERROR', expectedRetryable: true },
        { message: 'JSON parse error', expectedCode: 'PARSE_ERROR', expectedRetryable: false },
        { message: 'unknown error', expectedCode: 'UNKNOWN_ERROR', expectedRetryable: false }
      ];

      testCases.forEach(({ message, expectedCode, expectedRetryable }) => {
        const error = new Error(message);
        const result = normalizeError(error);
        
        expect(result.code).toBe(expectedCode);
        expect(result.retryable).toBe(expectedRetryable);
      });
    });
  });

  describe('isRetryableError', () => {
    it('should return true for retryable errors', () => {
      const error: GenerationError = {
        name: 'Error',
        message: 'Network connection failed',
        code: 'NETWORK_ERROR',
        retryable: true
      };

      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const error: GenerationError = {
        name: 'Error',
        message: 'Invalid JSON format',
        code: 'PARSE_ERROR',
        retryable: false
      };

      expect(isRetryableError(error)).toBe(false);
    });

    it('should use pattern matching when retryable is undefined', () => {
      const retryableError: GenerationError = {
        name: 'Error',
        message: 'Connection timeout',
        code: 'UNKNOWN_ERROR'
      };

      const nonRetryableError: GenerationError = {
        name: 'Error',
        message: 'Invalid syntax',
        code: 'UNKNOWN_ERROR'
      };

      expect(isRetryableError(retryableError)).toBe(true);
      expect(isRetryableError(nonRetryableError)).toBe(false);
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      const baseDelay = 1000;
      const maxDelay = 10000;
      const backoffFactor = 2;

      expect(calculateRetryDelay(1, baseDelay, maxDelay, backoffFactor)).toBeLessThanOrEqual(1100);
      expect(calculateRetryDelay(2, baseDelay, maxDelay, backoffFactor)).toBeLessThanOrEqual(2200); // Allow for jitter
      expect(calculateRetryDelay(3, baseDelay, maxDelay, backoffFactor)).toBeLessThanOrEqual(4400); // Allow for jitter + variance
    });

    it('should respect maximum delay', () => {
      const baseDelay = 1000;
      const maxDelay = 5000;
      const backoffFactor = 2;

      const delay = calculateRetryDelay(10, baseDelay, maxDelay, backoffFactor);
      expect(delay).toBeLessThanOrEqual(maxDelay + 500); // Account for jitter
    });

    it('should include jitter', () => {
      const delays = Array.from({ length: 10 }, () => 
        calculateRetryDelay(2, 1000, 10000, 2)
      );

      // All delays should be different due to jitter
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe('handleStreamingGenerationError', () => {
    it('should retry retryable errors', async () => {
      let attemptCount = 0;
      const operation = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Network error');
        }
        return 'success';
      });

      const context: GenerationErrorContext = {
        operation: 'story_generation',
        component: 'StoryForm'
      };

      const result = await handleStreamingGenerationError(operation, {
        context,
        maxRetries: 3,
        baseDelay: 10
      });

      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn().mockImplementation(() => {
        throw new Error('JSON parse error');
      });

      const context: GenerationErrorContext = {
        operation: 'story_generation',
        component: 'StoryForm'
      };

      await expect(handleStreamingGenerationError(operation, { context }))
        .rejects.toThrow('JSON parse error');
      
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should call onError and onRetry callbacks', async () => {
      const onError = vi.fn();
      const onRetry = vi.fn();
      let attemptCount = 0;

      const operation = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Network error');
        }
        return 'success';
      });

      const context: GenerationErrorContext = {
        operation: 'story_generation',
        component: 'StoryForm'
      };

      await handleStreamingGenerationError(operation, {
        context,
        maxRetries: 2,
        baseDelay: 10,
        onError,
        onRetry
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('should return appropriate messages for different error codes', () => {
      const testCases = [
        { code: 'NETWORK_ERROR', expected: 'Network connection issue' },
        { code: 'TIMEOUT_ERROR', expected: 'Request timed out' },
        { code: 'RATE_LIMIT_ERROR', expected: 'Too many requests' },
        { code: 'AUTH_ERROR', expected: 'Authentication issue' },
        { code: 'PARSE_ERROR', expected: 'There was an issue processing' },
        { code: 'UNKNOWN_ERROR', expected: 'An unexpected error occurred' }
      ];

      testCases.forEach(({ code, expected }) => {
        const error: GenerationError = {
          name: 'Error',
          message: 'Test error',
          code
        };

        const message = getUserFriendlyErrorMessage(error);
        expect(message).toContain(expected);
      });
    });
  });

  describe('logErrorWithContext', () => {
    it('should log error with context', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const error: GenerationError = {
        name: 'Error',
        message: 'Test error',
        code: 'NETWORK_ERROR',
        retryable: true,
        context: {
          operation: 'story_generation',
          component: 'StoryForm'
        }
      };

      logErrorWithContext(error, { userId: '123' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Generation Error:',
        expect.stringContaining('Test error')
      );

      consoleSpy.mockRestore();
    });
  });
});
