import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveStory, getUserStories, getStoryById, getLocalStory, getUserPreferences } from '../storyPersistence';

// Mock environment variables
vi.mock('@/core/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
  createSupabaseClientWithClerkToken: vi.fn(),
}));

// Mock Clerk auth context
vi.mock('@/modules/auth/contexts/ClerkAuthContext', () => ({
  useClerkAuth: () => ({
    getToken: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

describe('storyPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveStory', () => {
    it('should save story to Supabase when authenticated', async () => {
      const mockToken = 'mock-jwt-token';
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          story: {
            id: 'story-123',
            name: 'Test User',
            initial_story: 'Test story content',
            created_at: '2025-01-20T00:00:00Z',
          },
        }),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await saveStory(
        'Test story content',
        'Test User',
        new Date('2025-01-20'),
        'Test prompt',
        {
          transformedName: 'Test User',
          gender: 'same',
          personalityType: 'dreamer',
          location: 'New York',
        },
        mockToken
      );

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/save-story'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`,
          },
          body: expect.stringContaining('Test story content'),
        })
      );

      expect(result).toEqual({
        id: 'story-123',
        name: 'Test User',
        initial_story: 'Test story content',
        created_at: '2025-01-20T00:00:00Z',
      });

      // Should also save to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'flip_my_era_story_data',
        expect.stringContaining('Test story content')
      );
    });

    it('should save to localStorage only when not authenticated', async () => {
      const result = await saveStory(
        'Test story content',
        'Test User',
        new Date('2025-01-20'),
        'Test prompt',
        {
          transformedName: 'Test User',
          gender: 'same',
          personalityType: 'dreamer',
          location: 'New York',
        }
      );

      expect(fetch).not.toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'flip_my_era_story_data',
        expect.stringContaining('Test story content')
      );

      expect(result.storyId).toBeDefined();
      expect(result.name).toBe('Test User');
      expect(result.initial_story).toBe('Test story content');
    });

    it('should handle Supabase errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: 'Database error',
        }),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await saveStory(
        'Test story content',
        'Test User',
        new Date('2025-01-20'),
        'Test prompt',
        {},
        'mock-token'
      );

      // Should still save to localStorage as fallback
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(result.storyId).toBeDefined();
    });
  });

  describe('getUserStories', () => {
    it('should fetch stories from Supabase when authenticated', async () => {
      const mockToken = 'mock-jwt-token';
      const mockStories = [
        {
          id: 'story-1',
          name: 'Test User',
          initial_story: 'Story 1',
          created_at: '2025-01-20T00:00:00Z',
        },
        {
          id: 'story-2',
          name: 'Test User',
          initial_story: 'Story 2',
          created_at: '2025-01-19T00:00:00Z',
        },
      ];

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          stories: mockStories,
        }),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await getUserStories(mockToken);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/get-user-stories'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
          },
        })
      );

      expect(result).toEqual(mockStories);
    });

    it('should return local story when not authenticated', async () => {
      const localStory = {
        name: 'Test User',
        initial_story: 'Local story',
        storyId: 'valid-story-id',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(localStory));

      const result = await getUserStories();

      expect(fetch).not.toHaveBeenCalled();
      expect(result).toEqual([localStory]);
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Internal Server Error',
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await getUserStories('mock-token');

      // Should fallback to local story
      expect(result).toEqual([]);
    });
  });

  describe('getStoryById', () => {
    it('should fetch specific story from Supabase when authenticated', async () => {
      const mockToken = 'mock-jwt-token';
      const mockStory = {
        id: 'story-123',
        name: 'Test User',
        initial_story: 'Specific story content',
        created_at: '2025-01-20T00:00:00Z',
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          story: mockStory,
        }),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await getStoryById('story-123', mockToken);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/get-user-stories?storyId=story-123'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
          },
        })
      );

      expect(result).toEqual(mockStory);
    });

    it('should return local story when not found in Supabase', async () => {
      const localStory = {
        name: 'Test User',
        initial_story: 'Local story',
        storyId: 'story-123',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(localStory));

      const result = await getStoryById('story-123');

      expect(result).toEqual(localStory);
    });

    it('should return null when story not found anywhere', async () => {
      const result = await getStoryById('non-existent-story');

      expect(result).toBeNull();
    });
  });

  describe('getLocalStory', () => {
    it('should return parsed story from localStorage', () => {
      const mockStory = {
        name: 'Test User',
        initial_story: 'Local story content',
        storyId: 'valid-story-id',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStory));

      const result = getLocalStory();

      expect(result).toEqual(mockStory);
    });

    it('should return null when no story in localStorage', () => {
      const result = getLocalStory();

      expect(result).toBeNull();
    });

    it('should clear invalid story data', () => {
      const invalidStory = {
        name: 'Test User',
        initial_story: 'Local story content',
        storyId: 'local-invalid-id',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidStory));

      const result = getLocalStory();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('flip_my_era_story_data');
    });
  });

  describe('getUserPreferences', () => {
    it('should return parsed preferences from localStorage', () => {
      const mockPreferences = {
        name: 'Test User',
        birth_date: '2025-01-20T00:00:00Z',
        gender: 'same',
        personalityType: 'dreamer',
        location: 'New York',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockPreferences));

      const result = getUserPreferences();

      expect(result).toEqual(mockPreferences);
    });

    it('should return null when no preferences in localStorage', () => {
      const result = getUserPreferences();

      expect(result).toBeNull();
    });
  });
}); 