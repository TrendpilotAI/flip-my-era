/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStoryGeneration } from '../useStoryGeneration';
import { useClerkAuth } from '@/modules/auth/contexts';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { generateWithGroq } from '@/modules/shared/utils/groq';
import { saveStory, getLocalStory, getUserPreferences } from '@/modules/story/utils/storyPersistence';
import { detectGender, transformName } from '@/modules/user/utils/genderUtils';
import { getStarSign } from '@/modules/user/utils/starSigns';

// Mock dependencies
vi.mock('@/modules/auth/contexts', () => ({
  useClerkAuth: vi.fn(),
}));
vi.mock('@/modules/shared/hooks/use-toast');
vi.mock('@/modules/shared/utils/groq');
vi.mock('@/modules/story/utils/storyPersistence');
vi.mock('@/modules/user/utils/genderUtils');
vi.mock('@/modules/user/utils/starSigns');
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

const mockUseClerkAuth = useClerkAuth as ReturnType<typeof vi.fn>;
const mockUseToast = vi.mocked(useToast);
const mockGenerateWithGroq = vi.mocked(generateWithGroq);
const mockSaveStory = vi.mocked(saveStory);
const mockGetLocalStory = vi.mocked(getLocalStory);
const mockGetUserPreferences = vi.mocked(getUserPreferences);
const mockDetectGender = vi.mocked(detectGender);
const mockTransformName = vi.mocked(transformName);
const mockGetStarSign = vi.mocked(getStarSign);

describe('useStoryGeneration', () => {
  const mockToast = vi.fn();
  const mockDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseClerkAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '123', email: 'test@example.com' },
      isLoading: false,
      signIn: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
      refreshUser: vi.fn().mockResolvedValue(undefined),
      fetchCreditBalance: vi.fn().mockResolvedValue(100),
      getToken: vi.fn().mockResolvedValue('mock-token'),
      isNewUser: false,
      setIsNewUser: vi.fn(),
      SignInButton: vi.fn(),
      SignUpButton: vi.fn(),
      UserButton: vi.fn()
    });

    mockUseToast.mockReturnValue({
      toast: mockToast
    });

    mockToast.mockReturnValue({
      dismiss: mockDismiss
    });

    mockGetUserPreferences.mockReturnValue(null);
    mockGetLocalStory.mockReturnValue(null);
    mockDetectGender.mockResolvedValue({ gender: 'unknown', probability: 0 });
    mockTransformName.mockResolvedValue('Test Name');
    mockGetStarSign.mockReturnValue('Aries');
  });

  it('should initialize with default values', async () => {
    const { result } = renderHook(() => useStoryGeneration());

    // Wait for initialization to complete
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    expect(result.current.name).toBe('');
    expect(result.current.date).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBe('');
    expect(result.current.personalityType).toBe('dreamer');
    expect(result.current.gender).toBe('same');
    expect(result.current.location).toBe('');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should load saved preferences on initialization', async () => {
    const mockPreferences = {
      name: 'John Doe',
      birth_date: '1990-01-01',
      gender: 'flip',
      personalityType: 'adventurer',
      location: 'New York'
    };

    mockGetUserPreferences.mockReturnValue(mockPreferences);

    const { result } = renderHook(() => useStoryGeneration());

    await act(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.name).toBe('John Doe');
    expect(result.current.gender).toBe('flip');
    expect(result.current.personalityType).toBe('adventurer');
    expect(result.current.location).toBe('New York');
    expect(result.current.isInitialized).toBe(true);
  });

  it('should load saved story on initialization', async () => {
    const mockStory = {
      id: 'story-123',
      storyId: 'story-123',
      initial_story: 'Once upon a time...'
    };

    mockGetLocalStory.mockReturnValue(mockStory);

    const { result } = renderHook(() => useStoryGeneration());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.result).toBe('Once upon a time...');
    expect(result.current.storyId).toBe('story-123');
  });

  it('should detect gender when name changes', async () => {
    const { result } = renderHook(() => useStoryGeneration());

    await act(async () => {
      result.current.setName('Alice');
    });

    expect(mockDetectGender).toHaveBeenCalledWith('Alice');
  });

  it('should transform name when gender detection completes', async () => {
    mockDetectGender.mockResolvedValue({ gender: 'female', probability: 0.9 });

    const { result } = renderHook(() => useStoryGeneration());

    await act(async () => {
      result.current.setName('Alice');
      result.current.setGender('flip');
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockTransformName).toHaveBeenCalledWith(
      'Alice',
      { gender: 'female', probability: 0.9 },
      'flip'
    );
  });

  it('should handle story generation successfully', async () => {
    const mockStory = 'Generated story content';
    const mockSavedStory = { id: 'saved-123', storyId: 'saved-123' };

    mockGenerateWithGroq.mockResolvedValue(mockStory);
    mockSaveStory.mockResolvedValue(mockSavedStory);

    const { result } = renderHook(() => useStoryGeneration());

    await act(async () => {
      result.current.setName('Alice');
      result.current.setDate(new Date('1990-01-01'));
      result.current.setLocation('Paris');
    });

    await act(async () => {
      result.current.handleSubmit();
    });

    expect(mockGenerateWithGroq).toHaveBeenCalled();
    expect(mockSaveStory).toHaveBeenCalled();
    expect(result.current.result).toBe(mockStory);
    expect(result.current.storyId).toBe('saved-123');
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Alternate life discovered!',
      description: 'Your parallel universe self has been revealed!'
    });
  });

  it('should handle story generation errors', async () => {
    const mockError = new Error('GROQ_API_KEY_MISSING');
    mockGenerateWithGroq.mockRejectedValue(mockError);

    const { result } = renderHook(() => useStoryGeneration());

    await act(async () => {
      result.current.setName('Alice');
      result.current.handleSubmit();
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Service Unavailable',
      description: 'Story generation service is currently unavailable. Please try again later.',
      variant: 'destructive'
    });
  });

  it('should handle different error types correctly', async () => {
    const errorTestCases = [
      { error: new Error('INVALID_API_KEY_FORMAT'), expectedTitle: 'Service Error' },
      { error: new Error('INVALID_API_KEY'), expectedTitle: 'Service Error' },
      { error: new Error('RATE_LIMIT_EXCEEDED'), expectedTitle: 'Rate Limit Exceeded' },
      { error: new Error('API_ERROR: Something went wrong'), expectedTitle: 'Service Error' },
      { error: new Error('Unknown error'), expectedTitle: 'Error' }
    ];

    for (const { error, expectedTitle } of errorTestCases) {
      mockGenerateWithGroq.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useStoryGeneration());

      await act(async () => {
        result.current.setName('Alice');
        result.current.handleSubmit();
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expectedTitle,
          variant: 'destructive'
        })
      );

      vi.clearAllMocks();
    }
  });

  it('should handle story selection', async () => {
    mockGenerateWithGroq.mockResolvedValue('Current story');
    
    const { result } = renderHook(() => useStoryGeneration());

    // First generate a story to have current content
    await act(async () => {
      await result.current.handleSubmit();
    });

    // Wait for story to be generated
    await waitFor(() => {
      expect(result.current.result).toBe('Current story');
    });

    const currentStoryId = result.current.storyId;

    // Now select a different story
    const mockStory = {
      id: 'story-123',
      storyId: 'story-123',
      initial_story: 'Selected story content'
    };

    await act(async () => {
      result.current.handleStorySelect(mockStory);
    });

    expect(result.current.previousStory).toEqual({
      content: 'Current story',
      id: currentStoryId
    });
    expect(result.current.result).toBe('Selected story content');
    expect(result.current.storyId).toBe('story-123');
  });

  it('should handle undo functionality', async () => {
    mockGenerateWithGroq.mockResolvedValue('First story');
    
    const { result } = renderHook(() => useStoryGeneration());

    // Generate first story
    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(result.current.result).toBe('First story');
    });

    const firstStoryId = result.current.storyId;

    // Select a different story (this should save the first as previous)
    const secondStory = {
      id: 'story-456',
      storyId: 'story-456',
      initial_story: 'Second story'
    };

    await act(async () => {
      result.current.handleStorySelect(secondStory);
    });

    expect(result.current.result).toBe('Second story');
    expect(result.current.previousStory).toEqual({
      content: 'First story',
      id: firstStoryId
    });

    // Now undo to restore the first story
    await act(async () => {
      result.current.handleUndo();
    });

    expect(result.current.result).toBe('First story');
    expect(result.current.storyId).toBe(firstStoryId);
    expect(result.current.previousStory).toBeNull();
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Story restored',
      description: 'Previous timeline has been restored.'
    });
  });

  it('should not allow undo when no previous story', async () => {
    const { result } = renderHook(() => useStoryGeneration());

    await act(async () => {
      result.current.handleUndo();
    });

    expect(result.current.result).toBe('');
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('should handle name transformation errors gracefully', async () => {
    const transformError = new Error('Transformation failed');
    mockTransformName.mockRejectedValue(transformError);
    mockDetectGender.mockResolvedValue({ gender: 'female', probability: 0.9 });

    const { result } = renderHook(() => useStoryGeneration());

    await act(async () => {
      result.current.setName('Alice');
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should fallback to original name
    expect(result.current.transformedName).toBe('Alice');
  });

  it('should show loading state during generation', async () => {
    let resolveGeneration: (value: string) => void;
    const generationPromise = new Promise<string>(resolve => {
      resolveGeneration = resolve;
    });

    mockGenerateWithGroq.mockReturnValue(generationPromise as any);

    const { result } = renderHook(() => useStoryGeneration());

    await act(async () => {
      result.current.setName('Alice');
      result.current.handleSubmit();
    });

    expect(result.current.loading).toBe(true);
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Accessing the multiverse...',
      description: 'Scanning infinite realities for your alternate life...'
    });

    await act(async () => {
      resolveGeneration!('Generated story');
    });

    expect(result.current.loading).toBe(false);
  });

  it('should dismiss loading toast on completion', async () => {
    mockGenerateWithGroq.mockResolvedValue('Generated story');

    const { result } = renderHook(() => useStoryGeneration());

    await act(async () => {
      result.current.setName('Alice');
      result.current.handleSubmit();
    });

    expect(mockDismiss).toHaveBeenCalled();
  });

  it('should dismiss loading toast on error', async () => {
    mockGenerateWithGroq.mockRejectedValue(new Error('Generation failed'));

    const { result } = renderHook(() => useStoryGeneration());

    await act(async () => {
      result.current.setName('Alice');
      result.current.handleSubmit();
    });

    expect(mockDismiss).toHaveBeenCalled();
  });
});
