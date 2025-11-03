/**
 * Request timeout utility for Edge Functions
 * Ensures requests don't hang indefinitely
 */

/**
 * Create a timeout promise that rejects after specified duration
 */
export function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${ms}ms`));
    }, ms);
  });
}

/**
 * Race a promise against a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  timeoutMessage = `Operation timed out after ${ms}ms`
): Promise<T> {
  const timeout = createTimeout(ms);
  
  try {
    return await Promise.race([promise, timeout]) as T;
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new Error(timeoutMessage);
    }
    throw error;
  }
}

/**
 * Common timeout durations (in milliseconds)
 */
export const TIMEOUTS = {
  SHORT: 10000,   // 10 seconds
  MEDIUM: 30000,  // 30 seconds
  LONG: 60000,    // 60 seconds
  VERY_LONG: 120000, // 2 minutes
} as const;
