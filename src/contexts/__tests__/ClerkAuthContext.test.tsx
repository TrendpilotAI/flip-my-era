import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ClerkAuthProvider, useClerkAuth } from '@/modules/auth/contexts';
import { useUser, useAuth } from '@clerk/clerk-react';
import { supabase } from '@/core/integrations/supabase/client';

// Mock Clerk hooks
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(),
  useAuth: vi.fn(),
  SignInButton: vi.fn(),
  SignUpButton: vi.fn(),
  UserButton: vi.fn()
}));

// Mock Supabase client
vi.mock('@/core/integrations/supabase/client', () => {
  const mockSupabaseClient = {
    auth: {
      signInWithIdToken: vi.fn(),
      getSession: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      }))
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: { balance: 100 },
        error: null
      })
    }
  };

  return {
    supabase: mockSupabaseClient,
    getSupabaseSession: vi.fn(),
    signOutFromSupabase: vi.fn(),
    createSupabaseClientWithClerkToken: vi.fn(() => mockSupabaseClient)
  };
});

const mockUseUser = vi.mocked(useUser);
const mockUseAuth = vi.mocked(useAuth);
const mockSupabase = vi.mocked(supabase);

describe('ClerkAuthContext', () => {
  const mockGetToken = vi.fn();
  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      signOut: mockSignOut,
      getToken: mockGetToken
    } as any);

    mockGetToken.mockResolvedValue('mock-clerk-token');
    mockSignOut.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useClerkAuth', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useClerkAuth());
      }).toThrow('useClerkAuth must be used within a ClerkAuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('ClerkAuthProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ClerkAuthProvider>{children}</ClerkAuthProvider>
    );

    it('should provide loading state when Clerk is not loaded', () => {
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: false
      } as any);

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should provide unauthenticated state when no user', () => {
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: true
      } as any);

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should create new user profile when user signs in for first time', async () => {
      const mockClerkUser = {
        id: 'clerk-user-123',
        primaryEmailAddress: {
          emailAddress: 'test@example.com'
        },
        fullName: 'Test User',
        imageUrl: 'https://example.com/avatar.jpg',
        createdAt: 1640995200000 // Jan 1, 2022
      };

      mockUseUser.mockReturnValue({
        user: mockClerkUser,
        isLoaded: true
      } as any);

      // Mock Supabase responses - the implementation uses Clerk user ID directly
      const mockFrom = vi.fn();
      const mockSelect = vi.fn();
      const mockEq = vi.fn();
      const mockSingle = vi.fn();
      const mockInsert = vi.fn();
      
      mockFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert
      });
      
      mockSelect.mockReturnValue({
        eq: mockEq
      });
      
      mockEq.mockReturnValue({
        single: mockSingle
      });
      
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // Not found error
      });
      
      mockInsert.mockResolvedValue({
        data: null,
        error: null
      });
      
      mockSupabase.from = mockFrom;

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toMatchObject({
        id: 'clerk-user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        subscription_status: 'free',
        created_at: '2022-01-01T00:00:00.000Z'
      });
      expect(result.current.user?.credits).toBeDefined();
      expect(result.current.isNewUser).toBe(true);
    });

    it('should update existing user profile when user signs in', async () => {
      const mockClerkUser = {
        id: 'clerk-user-123',
        primaryEmailAddress: {
          emailAddress: 'test@example.com'
        },
        fullName: 'Updated Name',
        imageUrl: 'https://example.com/new-avatar.jpg',
        createdAt: 1640995200000
      };

      const existingProfile = {
        id: 'clerk-user-123',
        email: 'test@example.com',
        name: 'Old Name',
        avatar_url: 'https://example.com/old-avatar.jpg',
        subscription_status: 'premium',
        created_at: '2022-01-01T00:00:00Z'
      };

      mockUseUser.mockReturnValue({
        user: mockClerkUser,
        isLoaded: true
      } as any);

      // Mock Supabase responses - the implementation uses Clerk user ID directly
      const mockFrom2 = vi.fn();
      const mockSelect2 = vi.fn();
      const mockEq2 = vi.fn();
      const mockSingle2 = vi.fn();
      const mockUpdate = vi.fn();
      const mockUpdateEq = vi.fn();
      
      mockFrom2.mockReturnValue({
        select: mockSelect2,
        update: mockUpdate
      });
      
      mockSelect2.mockReturnValue({
        eq: mockEq2
      });
      
      mockEq2.mockReturnValue({
        single: mockSingle2
      });
      
      mockUpdate.mockReturnValue({
        eq: mockUpdateEq
      });
      
      mockSingle2.mockResolvedValue({
        data: existingProfile,
        error: null
      });
      
      mockUpdateEq.mockResolvedValue({
        data: null,
        error: null
      });
      
      mockSupabase.from = mockFrom2;

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toMatchObject({
        id: 'clerk-user-123',
        email: 'test@example.com',
        name: 'Updated Name', // Updated from Clerk
        avatar_url: 'https://example.com/new-avatar.jpg', // Updated from Clerk
        subscription_status: 'premium', // Preserved from Supabase
        created_at: '2022-01-01T00:00:00Z' // Preserved from Supabase
      });
      expect(result.current.user?.credits).toBeDefined();
      expect(result.current.isNewUser).toBe(false);
    });

    it('should handle Supabase authentication errors gracefully', async () => {
      const mockClerkUser = {
        id: 'clerk-user-123',
        primaryEmailAddress: {
          emailAddress: 'test@example.com'
        },
        fullName: 'Test User',
        imageUrl: 'https://example.com/avatar.jpg',
        createdAt: 1640995200000
      };

      mockUseUser.mockReturnValue({
        user: mockClerkUser,
        isLoaded: true
      } as any);

      // Mock createSupabaseClientWithClerkToken to throw an error
      const { createSupabaseClientWithClerkToken } = await import('@/core/integrations/supabase/client');
      const mockCreateSupabaseClientWithClerkToken = vi.mocked(createSupabaseClientWithClerkToken);
      mockCreateSupabaseClientWithClerkToken.mockImplementationOnce(() => {
        throw new Error('Supabase auth failed');
      });

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should fall back to Clerk data
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: 'clerk-user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        subscription_status: 'free',
        created_at: '2022-01-01T00:00:00.000Z',
        credits: 0
      });
    });

    it('should handle missing Clerk token', async () => {
      const mockClerkUser = {
        id: 'clerk-user-123',
        primaryEmailAddress: {
          emailAddress: 'test@example.com'
        },
        fullName: 'Test User',
        imageUrl: 'https://example.com/avatar.jpg',
        createdAt: 1640995200000
      };

      mockUseUser.mockReturnValue({
        user: mockClerkUser,
        isLoaded: true
      } as any);

      mockGetToken.mockResolvedValue(null);

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should fall back to Clerk data
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: 'clerk-user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        subscription_status: 'free',
        created_at: '2022-01-01T00:00:00.000Z',
        credits: 0
      });
    });

    it('should handle sign out successfully', async () => {
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: true
      } as any);

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      await act(async () => {
        const { error } = await result.current.signOut();
        expect(error).toBeNull();
      });

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: true
      } as any);

      mockSignOut.mockRejectedValue(new Error('Sign out failed'));

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      await act(async () => {
        const { error } = await result.current.signOut();
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toBe('Sign out failed');
      });
    });

    it('should provide programmatic sign in/up methods that return errors', async () => {
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: true
      } as any);

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      await act(async () => {
        const signInResult = await result.current.signIn('test@example.com', 'password');
        expect(signInResult.error).toBeInstanceOf(Error);
        expect(signInResult.error?.message).toContain('Use SignInButton component');

        const signUpResult = await result.current.signUp('test@example.com', 'password', 'Test User');
        expect(signUpResult.error).toBeInstanceOf(Error);
        expect(signUpResult.error?.message).toContain('Use SignUpButton component');

        const googleResult = await result.current.signInWithGoogle();
        expect(googleResult.error).toBeInstanceOf(Error);
        expect(googleResult.error?.message).toContain('Use SignInButton component');
      });
    });

    it('should refresh user profile', async () => {
      const mockClerkUser = {
        id: 'clerk-user-123',
        primaryEmailAddress: {
          emailAddress: 'test@example.com'
        },
        fullName: 'Test User',
        imageUrl: 'https://example.com/avatar.jpg',
        createdAt: 1640995200000
      };

      mockUseUser.mockReturnValue({
        user: mockClerkUser,
        isLoaded: true
      } as any);

      const { createSupabaseClientWithClerkToken } = await import('@/core/integrations/supabase/client');
      const mockCreateSupabaseClientWithClerkToken = vi.mocked(createSupabaseClientWithClerkToken);

      // Mock the refresh user profile response
      const mockFrom3 = vi.fn();
      const mockSelect3 = vi.fn();
      const mockEq3 = vi.fn();
      const mockSingle3 = vi.fn();
      const mockUpdate3 = vi.fn();
      const mockUpdateEq3 = vi.fn();
      
      mockFrom3.mockReturnValue({
        select: mockSelect3,
        update: mockUpdate3
      });
      
      mockSelect3.mockReturnValue({
        eq: mockEq3
      });
      
      mockEq3.mockReturnValue({
        single: mockSingle3
      });
      
      mockUpdate3.mockReturnValue({
        eq: mockUpdateEq3
      });
      
      mockSingle3.mockResolvedValue({
        data: {
          id: 'clerk-user-123',
          email: 'test@example.com',
          name: 'Updated Name',
          avatar_url: 'https://example.com/new-avatar.jpg',
          subscription_status: 'premium',
          created_at: '2022-01-01T00:00:00Z'
        },
        error: null
      });
      
      mockUpdateEq3.mockResolvedValue({
        data: null,
        error: null
      });
      
      mockSupabase.from = mockFrom3;

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(mockCreateSupabaseClientWithClerkToken).toHaveBeenCalled();
    });

    it('should handle refresh user errors gracefully', async () => {
      const mockClerkUser = {
        id: 'clerk-user-123',
        primaryEmailAddress: {
          emailAddress: 'test@example.com'
        },
        fullName: 'Test User',
        imageUrl: 'https://example.com/avatar.jpg',
        createdAt: 1640995200000
      };

      mockUseUser.mockReturnValue({
        user: mockClerkUser,
        isLoaded: true
      } as any);

      const { createSupabaseClientWithClerkToken } = await import('@/core/integrations/supabase/client');
      const mockCreateSupabaseClientWithClerkToken = vi.mocked(createSupabaseClientWithClerkToken);

      mockCreateSupabaseClientWithClerkToken.mockImplementationOnce(() => {
        throw new Error('Session error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      // Wait for initial sync to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error syncing user profile:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});
