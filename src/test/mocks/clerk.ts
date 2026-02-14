/**
 * Shared Clerk auth mock factory.
 * Creates configurable mock auth objects for tests.
 */
import { vi } from 'vitest';
import type { AuthContextType, AuthUser } from '@/modules/auth/contexts/AuthContext';

export interface MockClerkAuthOptions {
  isAuthenticated?: boolean;
  userId?: string;
  email?: string;
  name?: string;
  creditBalance?: number;
  isLoading?: boolean;
  isNewUser?: boolean;
  subscriptionStatus?: 'free' | 'basic' | 'premium';
}

export function createMockClerkAuth(options: MockClerkAuthOptions = {}): AuthContextType {
  const {
    isAuthenticated = true,
    userId = 'user_test_123',
    email = 'test@example.com',
    name = 'Test User',
    creditBalance = 100,
    isLoading = false,
    isNewUser = false,
    subscriptionStatus = 'free',
  } = options;

  const user: AuthUser | null = isAuthenticated
    ? {
        id: userId,
        email,
        name,
        avatar_url: 'https://example.com/avatar.jpg',
        subscription_status: subscriptionStatus,
        created_at: '2025-01-01T00:00:00Z',
        credits: creditBalance,
      }
    : null;

  return {
    user,
    isLoading,
    isAuthenticated,
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
    refreshUser: vi.fn().mockResolvedValue(undefined),
    fetchCreditBalance: vi.fn().mockResolvedValue(creditBalance),
    getToken: vi.fn().mockResolvedValue(isAuthenticated ? 'mock-clerk-jwt' : null),
    isNewUser,
    setIsNewUser: vi.fn(),
    SignInButton: vi.fn(({ children }: { children?: React.ReactNode }) => children ?? null) as unknown as AuthContextType['SignInButton'],
    SignUpButton: vi.fn(({ children }: { children?: React.ReactNode }) => children ?? null) as unknown as AuthContextType['SignUpButton'],
    UserButton: vi.fn(() => null) as unknown as AuthContextType['UserButton'],
  };
}

/** Default unauthenticated mock */
export const UNAUTHENTICATED_AUTH = createMockClerkAuth({ isAuthenticated: false });

/** Default authenticated mock */
export const AUTHENTICATED_AUTH = createMockClerkAuth();

/** Loading state mock */
export const LOADING_AUTH = createMockClerkAuth({ isLoading: true, isAuthenticated: false });
