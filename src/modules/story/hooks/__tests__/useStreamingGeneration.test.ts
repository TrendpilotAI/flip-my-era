import { renderHook, act } from '@testing-library/react';
import { useStreamingGeneration } from '../useStreamingGeneration';

// Mock the dependencies
jest.mock('@/modules/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

jest.mock('@/modules/auth/contexts/ClerkAuthContext', () => ({
  useClerkAuth: () => ({
    getToken: jest.fn().mockResolvedValue('mock-token')
  })
}));

// Mock fetch
global.fetch = jest.fn();

describe('useStreamingGeneration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle JSON parsing errors gracefully', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: () => ({
          read: jest.fn().mockResolvedValue({
            done: false,
            value: new TextEncoder().encode(
              'data: {"type":"chapter","currentChapter":2,"totalChapters":3,"chapterTitle":"Test Chapter","chapterContent":"Content with unescaped quotes and newlines\n\nThis is a test with "quotes" and \n newlines"}\n\n'
            )
          })
        })
      }
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useStreamingGeneration());

    await act(async () => {
      await result.current.startGeneration({
        originalStory: 'Test story',
        useTaylorSwiftThemes: false,
        numChapters: 3
      });
    });

    // The hook should handle the parsing error gracefully
    expect(result.current.isGenerating).toBe(false);
  });

  it('should handle malformed JSON data', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: () => ({
          read: jest.fn().mockResolvedValue({
            done: false,
            value: new TextEncoder().encode(
              'data: {"type":"chapter","currentChapter":2,"totalChapters":3,"chapterTitle":"Test Chapter","chapterContent":"Content with unescaped quotes and newlines\n\nThis is a test with "quotes" and \n newlines"}\n\n'
            )
          })
        })
      }
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useStreamingGeneration());

    await act(async () => {
      await result.current.startGeneration({
        originalStory: 'Test story',
        useTaylorSwiftThemes: false,
        numChapters: 3
      });
    });

    // The hook should handle the parsing error gracefully
    expect(result.current.isGenerating).toBe(false);
  });

  it('should handle empty or whitespace-only lines', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: () => ({
          read: jest.fn().mockResolvedValue({
            done: false,
            value: new TextEncoder().encode(
              'data: \n\ndata: {"type":"progress","currentChapter":1,"totalChapters":3}\n\n'
            )
          })
        })
      }
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useStreamingGeneration());

    await act(async () => {
      await result.current.startGeneration({
        originalStory: 'Test story',
        useTaylorSwiftThemes: false,
        numChapters: 3
      });
    });

    // Should handle empty lines without errors
    expect(result.current.isGenerating).toBe(false);
  });
}); 