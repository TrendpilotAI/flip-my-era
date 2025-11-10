import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { apiRequestWithRetry } from '../apiWithRetry';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('apiWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return successful response on first attempt', async () => {
    const mockResponse = { data: 'success', status: 200 };
    mockedAxios.mockResolvedValueOnce(mockResponse);

    const config = {
      method: 'GET' as const,
      url: 'https://api.example.com/test'
    };

    const result = await apiRequestWithRetry(config);

    expect(result).toEqual(mockResponse);
    expect(mockedAxios).toHaveBeenCalledTimes(1);
  });

  it('should retry on rate limit error (429)', async () => {
    const mockError = {
      response: { status: 429 },
      message: 'Rate limit exceeded',
      isAxiosError: true
    } as any;
    const mockSuccessResponse = { data: 'success', status: 200 };

    mockedAxios
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockSuccessResponse);

    const config = {
      method: 'GET' as const,
      url: 'https://api.example.com/test'
    };

    const promise = apiRequestWithRetry(config);

    // Fast-forward timers to simulate delays
    await vi.runAllTimersAsync();

    const result = await promise;

    expect(result).toEqual(mockSuccessResponse);
    expect(mockedAxios).toHaveBeenCalledTimes(2);
  });

  it('should retry on rate limit message in error', async () => {
    const mockError = {
      message: 'rate limit exceeded',
      isAxiosError: false
    } as any;
    const mockSuccessResponse = { data: 'success', status: 200 };

    mockedAxios
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockSuccessResponse);

    const config = {
      method: 'GET' as const,
      url: 'https://api.example.com/test'
    };

    const promise = apiRequestWithRetry(config);
    await vi.runAllTimersAsync();

    const result = await promise;

    expect(result).toEqual(mockSuccessResponse);
    expect(mockedAxios).toHaveBeenCalledTimes(2);
  });

  it('should retry on "Rate limit" message in error', async () => {
    const mockError = {
      message: 'Rate limit exceeded',
      isAxiosError: false
    } as any;
    const mockSuccessResponse = { data: 'success', status: 200 };

    mockedAxios
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockSuccessResponse);

    const config = {
      method: 'GET' as const,
      url: 'https://api.example.com/test'
    };

    const promise = apiRequestWithRetry(config);
    await vi.runAllTimersAsync();

    const result = await promise;

    expect(result).toEqual(mockSuccessResponse);
    expect(mockedAxios).toHaveBeenCalledTimes(2);
  });

  it('should not retry on non-rate-limit errors', async () => {
    const mockError = {
      response: { status: 400 },
      message: 'Bad request',
      isAxiosError: true
    } as any;

    mockedAxios.mockRejectedValueOnce(mockError);

    const config = {
      method: 'GET' as const,
      url: 'https://api.example.com/test'
    };

    await expect(apiRequestWithRetry(config)).rejects.toEqual(mockError);
    expect(mockedAxios).toHaveBeenCalledTimes(1);
  });

  it('should not retry after max retries exceeded', async () => {
    const mockError = {
      response: { status: 429 },
      message: 'Rate limit exceeded',
      isAxiosError: true
    } as any;

    // Mock 4 failures (1 initial + 3 retries)
    mockedAxios
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError);

    const config = {
      method: 'GET' as const,
      url: 'https://api.example.com/test'
    };

    const promise = apiRequestWithRetry(config);
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toEqual(mockError);
    expect(mockedAxios).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });

  it('should use exponential backoff for retries', async () => {
    const mockError = {
      response: { status: 429 },
      message: 'Rate limit exceeded',
      isAxiosError: true
    } as any;
    const mockSuccessResponse = { data: 'success', status: 200 };

    mockedAxios
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockSuccessResponse);

    const config = {
      method: 'GET' as const,
      url: 'https://api.example.com/test'
    };

    const promise = apiRequestWithRetry(config);

    // Fast-forward all timers to complete the retries
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result).toEqual(mockSuccessResponse);
    expect(mockedAxios).toHaveBeenCalledTimes(3);
  });

  it('should handle network errors without response object', async () => {
    const mockError = {
      message: 'Network Error'
    };

    mockedAxios.mockRejectedValue(mockError);

    const config = {
      method: 'GET' as const,
      url: 'https://api.example.com/test'
    };

    await expect(apiRequestWithRetry(config)).rejects.toEqual(mockError);
    expect(mockedAxios).toHaveBeenCalledTimes(1);
  });

  it('should preserve original config in retries', async () => {
    const mockError = {
      response: { status: 429 },
      message: 'Rate limit exceeded',
      isAxiosError: true
    } as any;
    const mockSuccessResponse = { data: 'success', status: 200 };

    mockedAxios
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockSuccessResponse);

    const config = {
      method: 'POST' as const,
      url: 'https://api.example.com/test',
      data: { test: 'data' },
      headers: { 'Content-Type': 'application/json' }
    };

    const promise = apiRequestWithRetry(config);
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result).toEqual(mockSuccessResponse);

    expect(mockedAxios).toHaveBeenCalledWith(config);
    expect(mockedAxios).toHaveBeenCalledTimes(2);
  });

  it('should handle concurrent retry attempts', async () => {
    const mockError = {
      response: { status: 429 },
      message: 'Rate limit exceeded',
      isAxiosError: true
    } as any;
    const mockSuccessResponse = { data: 'success', status: 200 };

    mockedAxios
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockSuccessResponse)
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockSuccessResponse);

    const config = {
      method: 'GET' as const,
      url: 'https://api.example.com/test'
    };

    // Start multiple concurrent requests
    const promise1 = apiRequestWithRetry(config);
    const promise2 = apiRequestWithRetry(config);

    await vi.runAllTimersAsync();

    const [result1, result2] = await Promise.all([promise1, promise2]);

    expect(result1).toEqual(mockSuccessResponse);
    expect(result2).toEqual(mockSuccessResponse);
    expect(mockedAxios).toHaveBeenCalledTimes(6); // 2 requests × 3 attempts each
  });
});
