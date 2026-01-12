import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { apiRequestWithRetry } from '../apiWithRetry';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('apiWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock isAxiosError to work with our mock errors
    (axios.isAxiosError as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (error: unknown) => (error as { isAxiosError?: boolean })?.isAxiosError === true
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
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

  it('should not retry on non-rate-limit errors (400)', async () => {
    const mockError = {
      response: { status: 400 },
      message: 'Bad request',
      isAxiosError: true
    };

    mockedAxios.mockRejectedValueOnce(mockError);

    const config = {
      method: 'GET' as const,
      url: 'https://api.example.com/test'
    };

    await expect(apiRequestWithRetry(config)).rejects.toEqual(mockError);
    expect(mockedAxios).toHaveBeenCalledTimes(1);
  });

  it('should not retry on non-rate-limit errors (500)', async () => {
    const mockError = {
      response: { status: 500 },
      message: 'Internal Server Error',
      isAxiosError: true
    };

    mockedAxios.mockRejectedValueOnce(mockError);

    const config = {
      method: 'GET' as const,
      url: 'https://api.example.com/test'
    };

    await expect(apiRequestWithRetry(config)).rejects.toEqual(mockError);
    expect(mockedAxios).toHaveBeenCalledTimes(1);
  });

  it('should handle network errors without response object', async () => {
    const mockError = {
      message: 'Network Error',
      isAxiosError: false
    };

    mockedAxios.mockRejectedValueOnce(mockError);

    const config = {
      method: 'GET' as const,
      url: 'https://api.example.com/test'
    };

    await expect(apiRequestWithRetry(config)).rejects.toEqual(mockError);
    expect(mockedAxios).toHaveBeenCalledTimes(1);
  });

  it('should correctly identify rate limit from 429 status', async () => {
    const mockError = {
      response: { status: 429 },
      message: 'Too Many Requests',
      isAxiosError: true
    };
    const mockSuccessResponse = { data: 'success', status: 200 };

    // First call fails with 429, second succeeds
    mockedAxios
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockSuccessResponse);

    const config = {
      method: 'GET' as const,
      url: 'https://api.example.com/test'
    };

    // Use real timers but this will take ~1 second due to retry delay
    const result = await apiRequestWithRetry(config);

    expect(result).toEqual(mockSuccessResponse);
    expect(mockedAxios).toHaveBeenCalledTimes(2);
  }, 5000); // 5 second timeout for retry delay

  it('should correctly identify rate limit from error message', async () => {
    const mockError = {
      message: 'rate limit exceeded',
      isAxiosError: false
    };
    const mockSuccessResponse = { data: 'success', status: 200 };

    mockedAxios
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockSuccessResponse);

    const config = {
      method: 'GET' as const,
      url: 'https://api.example.com/test'
    };

    const result = await apiRequestWithRetry(config);

    expect(result).toEqual(mockSuccessResponse);
    expect(mockedAxios).toHaveBeenCalledTimes(2);
  }, 5000);

  it('should preserve original config in retries', async () => {
    const mockError = {
      response: { status: 429 },
      message: 'Rate limit exceeded',
      isAxiosError: true
    };
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

    const result = await apiRequestWithRetry(config);
    expect(result).toEqual(mockSuccessResponse);

    // Both calls should use the same config
    expect(mockedAxios).toHaveBeenNthCalledWith(1, config);
    expect(mockedAxios).toHaveBeenNthCalledWith(2, config);
    expect(mockedAxios).toHaveBeenCalledTimes(2);
  }, 5000);
});
