import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Makes an API request with exponential backoff retry logic for rate limit errors
 */
export async function apiRequestWithRetry<T>(
  config: AxiosRequestConfig,
  currentRetry = 0
): Promise<AxiosResponse<T>> {
  try {
    return await axios(config);
  } catch (error: unknown) {
    // Check if it's a rate limit error
    let status: number | undefined;
    let message = String(error);
    if (axios.isAxiosError(error)) {
      status = error.response?.status;
      message = error.message ?? message;
    }
    const isRateLimit = status === 429 || message.includes('rate limit') || message.includes('Rate limit');
    
    // If we have retries left and it's a rate limit error
    if (currentRetry < MAX_RETRIES && isRateLimit) {
      // Calculate exponential backoff delay
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, currentRetry);
      
      console.log(`Rate limit exceeded. Retrying in ${delay}ms (Attempt ${currentRetry + 1}/${MAX_RETRIES})`);
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the request
      return apiRequestWithRetry<T>(config, currentRetry + 1);
    }
    
    // If we've used all retries or it's not a rate limit error, rethrow
    throw error;
  }
} 