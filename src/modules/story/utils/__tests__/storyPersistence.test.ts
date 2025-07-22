import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveStory, getLocalStory, getUserPreferences } from '../storyPersistence';

// Mock the Supabase client
vi.mock('@/core/integrations/supabase/client', () => ({
  createSupabaseClientWithClerkToken: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      })
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'test-story-id',
              name: 'Test User',
              initial_story: 'Test story content',
              user_id: 'test-user-id'
            },
            error: null
          })
        }))
      }))
    }))
  }))
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('storyPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('saveStory', () => {
    it('should save story to Supabase when authenticated', async () => {
      const mockClerkToken = 'mock-clerk-token';
      const story = 'Test story content';
      const name = 'Test User';
      const additionalData = {
        transformedName: 'Test User',
        gender: 'same',
        personalityType: 'dreamer',
        location: 'Test Location'
      };

      const result = await saveStory(story, name, undefined, 'test prompt', additionalData, mockClerkToken);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-story-id');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should save to localStorage when not authenticated', async () => {
      const story = 'Test story content';
      const name = 'Test User';
      const additionalData = {
        transformedName: 'Test User',
        gender: 'same',
        personalityType: 'dreamer',
        location: 'Test Location'
      };

      const result = await saveStory(story, name, undefined, 'test prompt', additionalData, null);

      expect(result).toBeDefined();
      expect(result.storyId).toBeDefined();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('getLocalStory', () => {
    it('should return null when no story in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = getLocalStory();
      
      expect(result).toBeNull();
    });

    it('should return story data when available in localStorage', () => {
      const mockStoryData = {
        name: 'Test User',
        initial_story: 'Test story content',
        storyId: 'test-story-id',
        transformedName: 'Test User',
        gender: 'same',
        personalityType: 'dreamer',
        location: 'Test Location'
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoryData));
      
      const result = getLocalStory();
      
      expect(result).toEqual(mockStoryData);
    });
  });

  describe('getUserPreferences', () => {
    it('should return null when no preferences in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = getUserPreferences();
      
      expect(result).toBeNull();
    });

    it('should return preferences when available in localStorage', () => {
      const mockPreferences = {
        name: 'Test User',
        birth_date: '1990-01-01T00:00:00.000Z',
        gender: 'same',
        personalityType: 'dreamer',
        location: 'Test Location'
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockPreferences));
      
      const result = getUserPreferences();
      
      expect(result).toEqual(mockPreferences);
    });
  });
}); 