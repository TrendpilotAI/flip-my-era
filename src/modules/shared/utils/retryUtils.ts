/**
 * Retry utilities for database and authentication operations
 * Provides configurable retry logic with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: Error) => boolean;
}

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

/**
 * Default retry condition - retries on network, timeout, and temporary errors
 */
const defaultRetryCondition = (error: Error): boolean => {
  const retryablePatterns = [
    /network/i,
    /timeout/i,
    /temporary/i,
    /unavailable/i,
    /connection/i,
    /ECONNRESET/i,
    /ETIMEDOUT/i,
    /rate.?limit/i
  ];
  
  return retryablePatterns.some(pattern => pattern.test(error.message));
};

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateDelay = (
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffFactor: number
): number => {
  const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
  // Add jitter to prevent thundering herd
  const jitter = delay * 0.1 * Math.random();
  return Math.floor(delay + jitter);
};

/**
 * Generic retry function with exponential backoff
 */
export const retry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    retryCondition = defaultRetryCondition
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.warn(`Retry attempt ${attempt} failed:`, lastError.message);
      
      // If this is the last attempt or error is not retryable, throw
      if (attempt > maxRetries || !retryCondition(lastError)) {
        throw new RetryError(
          `Operation failed after ${attempt} attempts: ${lastError.message}`,
          attempt,
          lastError
        );
      }
      
      // Calculate delay and wait before retry
      const delay = calculateDelay(attempt, baseDelay, maxDelay, backoffFactor);
      console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new RetryError(
    `Operation failed after ${maxRetries + 1} attempts`,
    maxRetries + 1,
    lastError!
  );
};

/**
 * Retry function specifically for database operations
 */
export const retryDatabaseOperation = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const databaseRetryCondition = (error: Error): boolean => {
    const databaseRetryablePatterns = [
      /connection/i,
      /timeout/i,
      /temporary/i,
      /unavailable/i,
      /deadlock/i,
      /lock/i,
      /busy/i,
      /rate.?limit/i,
      /PGRST/i, // PostgREST errors that might be temporary
    ];
    
    return databaseRetryablePatterns.some(pattern => pattern.test(error.message));
  };

  return retry(operation, {
    maxRetries: 3,
    baseDelay: 500,
    maxDelay: 5000,
    backoffFactor: 2,
    retryCondition: databaseRetryCondition,
    ...options
  });
};

/**
 * Retry function specifically for authentication operations
 */
export const retryAuthOperation = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const authRetryCondition = (error: Error): boolean => {
    const authRetryablePatterns = [
      /network/i,
      /timeout/i,
      /temporary/i,
      /unavailable/i,
      /connection/i,
      /rate.?limit/i,
      /token.*refresh/i,
      /session.*expired/i
    ];
    
    // Don't retry on authentication failures that are likely permanent
    const nonRetryablePatterns = [
      /invalid.*credentials/i,
      /unauthorized/i,
      /forbidden/i,
      /access.*denied/i
    ];
    
    const isNonRetryable = nonRetryablePatterns.some(pattern => pattern.test(error.message));
    if (isNonRetryable) return false;
    
    return authRetryablePatterns.some(pattern => pattern.test(error.message));
  };

  return retry(operation, {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 3000,
    backoffFactor: 1.5,
    retryCondition: authRetryCondition,
    ...options
  });
};

/**
 * Retry function for API operations with custom logic
 */
export const retryApiOperation = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const apiRetryCondition = (error: Error): boolean => {
    const apiRetryablePatterns = [
      /network/i,
      /timeout/i,
      /5\d\d/i, // 5xx HTTP status codes
      /rate.?limit/i,
      /temporary/i,
      /unavailable/i,
      /connection/i,
      /fetch/i
    ];
    
    return apiRetryablePatterns.some(pattern => pattern.test(error.message));
  };

  return retry(operation, {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryCondition: apiRetryCondition,
    ...options
  });
};