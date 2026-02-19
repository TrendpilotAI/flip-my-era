/**
 * Mock for Supabase Auth (replaces old Clerk mock)
 * Provides mock implementations for auth context used in tests
 */
import { vi } from 'vitest';

export const mockSupabaseAuth = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    avatar_url: '',
    subscription_status: 'free' as const,
    created_at: new Date().toISOString(),
    credits: 3,
  },
  session: null,
  isLoading: false,
  isAuthenticated: true,
  isSignedIn: true,
  signIn: vi.fn().mockResolvedValue({ error: null }),
  signUp: vi.fn().mockResolvedValue({ error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
  refreshUser: vi.fn().mockResolvedValue(undefined),
  fetchCreditBalance: vi.fn().mockResolvedValue(3),
  getToken: vi.fn().mockResolvedValue('mock-token'),
  isNewUser: false,
  setIsNewUser: vi.fn(),
};

// Mock the auth module
vi.mock('@/core/integrations/supabase/auth', () => ({
  useSupabaseAuth: () => mockSupabaseAuth,
  useAuth: () => mockSupabaseAuth,
  SupabaseAuthProvider: ({ children }: { children: React.ReactNode }) => children,
  AuthContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
}));

// Also mock the re-export paths
vi.mock('@/modules/auth/contexts', () => ({
  useClerkAuth: () => mockSupabaseAuth,
  ClerkAuthProvider: ({ children }: { children: React.ReactNode }) => children,
  AuthContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
}));
