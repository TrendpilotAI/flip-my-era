import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ClerkAuthProvider, useClerkAuth } from '../ClerkAuthContext';
import { setupClerkMocks, mockClerkUser, mockClerkAuth } from '@/test/mocks/clerk';
import { setupSupabaseMocks, mockProfile } from '@/test/mocks/supabase';
import React from 'react';

// Setup mocks
setupClerkMocks();
setupSupabaseMocks();

describe.skip('ClerkAuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Provider Initialization', () => {
    it('should initialize with null user when not authenticated', async () => {
      // Mock unauthenticated state
      vi.mock('@clerk/clerk-react', () => ({
        useUser: () => ({ user: null, isLoaded: true }),
        useAuth: () => ({ ...mockClerkAuth, isSignedIn: false }),
        SignInButton: vi.fn(),
        SignUpButton: vi.fn(),
        UserButton: vi.fn(),
      }));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ClerkAuthProvider>{children}</ClerkAuthProvider>
      );

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should initialize with user data when authenticated', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ClerkAuthProvider>{children}</ClerkAuthProvider>
      );

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeDefined();
      expect(result.current.user?.id).toBe(mockClerkUser.id);
      expect(result.current.user?.email).toBe(mockClerkUser.primaryEmailAddress.emailAddress);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Credit Balance Management', () => {
    it.skip('should fetch credit balance successfully', async () => {
      // Skip: vi.mock inside test with variable reference causes hoisting issues
      // This test needs refactoring to use module-level mocks or a different approach
      const mockCredits = 150;
      
      // Mock the credits function response
      const mockSupabase = {
        functions: {
          invoke: vi.fn().mockResolvedValue({
            data: { balance: mockCredits },
            error: null,
          }),
        },
      };
      
      vi.mock('@/core/integrations/supabase/client', () => ({
        supabase: mockSupabase,
        getSupabaseSession: vi.fn(),
        signOutFromSupabase: vi.fn(),
        createSupabaseClientWithClerkToken: vi.fn().mockReturnValue(mockSupabase),
      }));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ClerkAuthProvider>{children}</ClerkAuthProvider>
      );

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      let balance: number = 0;
      await act(async () => {
        balance = await result.current.fetchCreditBalance();
      });

      expect(balance).toBe(mockCredits);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('credits', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock-jwt-token',
        },
      });
    });

    it('should handle credit balance fetch errors gracefully', async () => {
      const mockSupabase = {
        functions: {
          invoke: vi.fn().mockRejectedValue(new Error('Network error')),
        },
      };
      
      vi.mock('@/core/integrations/supabase/client', () => ({
        supabase: mockSupabase,
        getSupabaseSession: vi.fn(),
        signOutFromSupabase: vi.fn(),
        createSupabaseClientWithClerkToken: vi.fn().mockReturnValue(mockSupabase),
      }));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ClerkAuthProvider>{children}</ClerkAuthProvider>
      );

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      let balance: number = -1;
      await act(async () => {
        balance = await result.current.fetchCreditBalance();
      });

      expect(balance).toBe(0); // Should return 0 on error
    });

    it('should return 0 when no user is authenticated', async () => {
      vi.mock('@clerk/clerk-react', () => ({
        useUser: () => ({ user: null, isLoaded: true }),
        useAuth: () => ({ ...mockClerkAuth, isSignedIn: false }),
        SignInButton: vi.fn(),
        SignUpButton: vi.fn(),
        UserButton: vi.fn(),
      }));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ClerkAuthProvider>{children}</ClerkAuthProvider>
      );

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      let balance: number = -1;
      await act(async () => {
        balance = await result.current.fetchCreditBalance();
      });

      expect(balance).toBe(0);
    });
  });

  describe('User Profile Sync', () => {
    it('should create new profile for first-time users', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST116' } // Not found error
          }),
          insert: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        })),
      };

      vi.mock('@/core/integrations/supabase/client', () => ({
        supabase: mockSupabase,
        getSupabaseSession: vi.fn(),
        signOutFromSupabase: vi.fn(),
        createSupabaseClientWithClerkToken: vi.fn().mockReturnValue(mockSupabase),
      }));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ClerkAuthProvider>{children}</ClerkAuthProvider>
      );

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isNewUser).toBe(true);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should update existing profile with latest Clerk data', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: mockProfile, 
            error: null 
          }),
          update: vi.fn().mockReturnThis(),
        })),
      };

      vi.mock('@/core/integrations/supabase/client', () => ({
        supabase: mockSupabase,
        getSupabaseSession: vi.fn(),
        signOutFromSupabase: vi.fn(),
        createSupabaseClientWithClerkToken: vi.fn().mockReturnValue(mockSupabase),
      }));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ClerkAuthProvider>{children}</ClerkAuthProvider>
      );

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user?.subscription_status).toBe(mockProfile.subscription_status);
    });
  });

  describe('Authentication Methods', () => {
    it('should handle sign out correctly', async () => {
      const mockSignOut = vi.fn().mockResolvedValue(undefined);
      const mockSupabaseSignOut = vi.fn().mockResolvedValue(undefined);
      
      vi.mock('@clerk/clerk-react', () => ({
        useUser: () => ({ user: mockClerkUser, isLoaded: true }),
        useAuth: () => ({ 
          ...mockClerkAuth, 
          signOut: mockSignOut,
          isSignedIn: true 
        }),
        SignInButton: vi.fn(),
        SignUpButton: vi.fn(),
        UserButton: vi.fn(),
      }));

      vi.mock('@/core/integrations/supabase/client', () => ({
        supabase: {},
        getSupabaseSession: vi.fn(),
        signOutFromSupabase: mockSupabaseSignOut,
        createSupabaseClientWithClerkToken: vi.fn(),
      }));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ClerkAuthProvider>{children}</ClerkAuthProvider>
      );

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.signOut();
        expect(response.error).toBeNull();
      });

      expect(mockSupabaseSignOut).toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should return error for programmatic sign in', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ClerkAuthProvider>{children}</ClerkAuthProvider>
      );

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'password');
        expect(response.error).toBeDefined();
        expect(response.error?.message).toContain('SignInButton');
      });
    });

    it('should return error for programmatic sign up', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ClerkAuthProvider>{children}</ClerkAuthProvider>
      );

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.signUp('test@example.com', 'password', 'Test User');
        expect(response.error).toBeDefined();
        expect(response.error?.message).toContain('SignUpButton');
      });
    });
  });

  describe('User Refresh', () => {
    it('should refresh user profile from Supabase', async () => {
      const updatedProfile = {
        ...mockProfile,
        name: 'Updated Name',
        credits: 200,
      };

      const mockSupabase = {
        from: vi.fn((table: string) => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn()
            .mockResolvedValueOnce({ data: mockProfile, error: null })
            .mockResolvedValueOnce({ data: updatedProfile, error: null }),
        })),
      };

      vi.mock('@/core/integrations/supabase/client', () => ({
        supabase: mockSupabase,
        getSupabaseSession: vi.fn(),
        signOutFromSupabase: vi.fn(),
        createSupabaseClientWithClerkToken: vi.fn().mockReturnValue(mockSupabase),
      }));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ClerkAuthProvider>{children}</ClerkAuthProvider>
      );

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshUser();
      });

      await waitFor(() => {
        expect(result.current.user?.name).toBe(updatedProfile.name);
      });
    });

    it('should handle refresh errors gracefully', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockRejectedValue(new Error('Database error')),
        })),
      };

      vi.mock('@/core/integrations/supabase/client', () => ({
        supabase: mockSupabase,
        getSupabaseSession: vi.fn(),
        signOutFromSupabase: vi.fn(),
        createSupabaseClientWithClerkToken: vi.fn().mockReturnValue(mockSupabase),
      }));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ClerkAuthProvider>{children}</ClerkAuthProvider>
      );

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      // Should not throw error
      await act(async () => {
        await expect(result.current.refreshUser()).resolves.toBeUndefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useClerkAuth is used outside provider', () => {
      // Temporarily suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useClerkAuth());
      }).toThrow('useClerkAuth must be used within a ClerkAuthProvider');

      console.error = originalError;
    });
  });

  describe('Loading States', () => {
    it('should show loading state while Clerk is loading', () => {
      vi.mock('@clerk/clerk-react', () => ({
        useUser: () => ({ user: null, isLoaded: false }),
        useAuth: () => ({ ...mockClerkAuth, isLoaded: false }),
        SignInButton: vi.fn(),
        SignUpButton: vi.fn(),
        UserButton: vi.fn(),
      }));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ClerkAuthProvider>{children}</ClerkAuthProvider>
      );

      const { result } = renderHook(() => useClerkAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });
  });
});