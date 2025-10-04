/**
 * Enhanced error handling utilities for streaming generation and API operations
 * Provides comprehensive error classification, retry logic, and user-friendly error messages
 */

export interface GenerationError extends Error {
  code?: string;
  statusCode?: number;
  retryable?: boolean;
  context?: GenerationErrorContext;
}

export interface GenerationErrorContext {
  operation: string;
  component: string;
  userId?: string;
  chapterIndex?: number;
  attempt?: number;
  timestamp?: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface StreamingGenerationErrorHandlerOptions {
  context: GenerationErrorContext;
  maxRetries?: number;
  baseDelay?: number;
  onError?: (error: GenerationError) => void;
  onRetry?: (attempt: number, error: GenerationError) => void;
}

/**
 * Normalize different error types into a consistent GenerationError format
 */
export const normalizeError = (error: unknown, context?: GenerationErrorContext): GenerationError => {
  if (error instanceof Error) {
    const genError = error as GenerationError;
    genError.context = context;
    
    // Classify error type and set retryable flag
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Network')) {
      genError.code = 'NETWORK_ERROR';
      genError.retryable = true;
    } else if (error.message.includes('timeout')) {
      genError.code = 'TIMEOUT_ERROR';
      genError.retryable = true;
    } else if (error.message.includes('rate limit')) {
      genError.code = 'RATE_LIMIT_ERROR';
      genError.retryable = true;
    } else if (error.message.includes('token') || error.message.includes('auth')) {
      genError.code = 'AUTH_ERROR';
      genError.retryable = true;
    } else if (error.message.includes('parse') || error.message.includes('JSON')) {
      genError.code = 'PARSE_ERROR';
      genError.retryable = false;
    } else {
      genError.code = 'UNKNOWN_ERROR';
      genError.retryable = false;
    }
    
    return genError;
  }
  
  const genError = new Error(String(error)) as GenerationError;
  genError.code = 'UNKNOWN_ERROR';
  genError.retryable = false;
  genError.context = context;
  return genError;
};

/**
 * Check if an error is retryable based on error type and context
 */
export const isRetryableError = (error: GenerationError): boolean => {
  if (error.retryable !== undefined) {
    return error.retryable;
  }
  
  // Default retryable error patterns
  const retryablePatterns = [
    /network/i,
    /timeout/i,
    /rate.?limit/i,
    /temporary/i,
    /unavailable/i,
    /connection/i,
    /fetch/i,
    /ECONNRESET/i,
    /ETIMEDOUT/i
  ];
  
  return retryablePatterns.some(pattern => pattern.test(error.message));
};

/**
 * Calculate delay for retry attempts with exponential backoff
 */
export const calculateRetryDelay = (
  attempt: number, 
  baseDelay: number = 1000, 
  maxDelay: number = 30000,
  backoffFactor: number = 2
): number => {
  const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
  // Add jitter to prevent thundering herd
  const jitter = delay * 0.1 * Math.random();
  return delay + jitter;
};

/**
 * Enhanced error handler for streaming generation operations
 */
export const handleStreamingGenerationError = async <T>(
  operation: () => Promise<T>,
  options: StreamingGenerationErrorHandlerOptions
): Promise<T> => {
  const {
    context,
    maxRetries = 3,
    baseDelay = 1000,
    onError,
    onRetry
  } = options;

  let lastError: GenerationError;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      lastError = normalizeError(error, {
        ...context,
        attempt,
        timestamp: new Date().toISOString()
      });
      
      console.error(`Attempt ${attempt} failed:`, {
        error: lastError.message,
        context: lastError.context,
        retryable: lastError.retryable
      });
      
      // If this is the last attempt or error is not retryable, throw
      if (attempt > maxRetries || !isRetryableError(lastError)) {
        onError?.(lastError);
        throw lastError;
      }
      
      // Calculate delay and wait before retry
      const delay = calculateRetryDelay(attempt, baseDelay);
      console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      onRetry?.(attempt, lastError);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

/**
 * Get user-friendly error message for different error types
 */
export const getUserFriendlyErrorMessage = (error: GenerationError): string => {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Network connection issue. Please check your internet connection and try again.';
    case 'TIMEOUT_ERROR':
      return 'Request timed out. The server might be busy. Please try again in a moment.';
    case 'RATE_LIMIT_ERROR':
      return 'Too many requests. Please wait a moment before trying again.';
    case 'AUTH_ERROR':
      return 'Authentication issue. Please refresh the page and try again.';
    case 'PARSE_ERROR':
      return 'There was an issue processing the response. Please try again.';
    default:
      return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
  }
};

/**
 * Log error with context for monitoring and debugging
 */
export const logErrorWithContext = (error: GenerationError, additionalContext?: Record<string, any>) => {
  const logData = {
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      retryable: error.retryable,
      stack: error.stack
    },
    context: error.context,
    additionalContext
  };
  
  console.error('Generation Error:', JSON.stringify(logData, null, 2));
  
  // In production, you might want to send this to a monitoring service
  // Example: sendToMonitoringService(logData);
};