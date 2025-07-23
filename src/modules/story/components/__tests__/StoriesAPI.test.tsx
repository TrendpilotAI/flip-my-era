import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStories } from '../hooks/useStories';
import { storiesAPI } from '@/core/api/stories';

// Mock the API
vi.mock('@/core/api/stories', () => ({
  storiesAPI: {
    getStories: vi.fn(),
    createStory: vi.fn(),
    updateStory: vi.fn(),
    deleteStory: vi.fn(),
    getStory: vi.fn(),
  },
}));

// Mock the auth context
vi.mock('@/modules/auth/contexts/ClerkAuthContext', () => ({
  useClerkAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

// Mock the toast
vi.mock('@/modules/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useStories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load stories successfully', async () => {
    const mockStories = [
      {
        id: '1',
        user_id: 'test-user-id',
        name: 'Test User',
        title: 'Test Story',
        initial_story: 'Once upon a time...',
        created_at: '2025-01-20T00:00:00Z',
        updated_at: '2025-01-20T00:00:00Z',
      },
    ];

    vi.mocked(storiesAPI.getStories).mockResolvedValue(mockStories);

    const { result } = renderHook(() => useStories());

    await waitFor(() => {
      expect(result.current.stories).toEqual(mockStories);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle API errors gracefully', async () => {
    const error = new Error('API Error');
    vi.mocked(storiesAPI.getStories).mockRejectedValue(error);

    const { result } = renderHook(() => useStories());

    await waitFor(() => {
      expect(result.current.stories).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('API Error');
    });
  });
}); 