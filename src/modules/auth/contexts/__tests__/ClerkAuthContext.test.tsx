/**
 * Tests for SupabaseAuthProvider (replaces old ClerkAuthContext tests)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SupabaseAuthProvider, useSupabaseAuth, AuthContext } from '@/core/integrations/supabase/auth';

// Mock supabase client
const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } });
const mockOnAuthStateChange = vi.fn().mockReturnValue({
  data: { subscription: { unsubscribe: vi.fn() } },
});
const mockSignOut = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/core/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: any) => mockOnAuthStateChange(cb),
      signOut: () => mockSignOut(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { balance: 3 }, error: null }),
    },
  },
}));

function TestConsumer() {
  const { isAuthenticated, isLoading, user } = useSupabaseAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
    </div>
  );
}

describe('SupabaseAuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('shows unauthenticated when no session', async () => {
    await act(async () => {
      render(
        <SupabaseAuthProvider>
          <TestConsumer />
        </SupabaseAuthProvider>
      );
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('provides user state when authenticated', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            user_metadata: { full_name: 'Test User' },
            created_at: '2024-01-01',
          },
          access_token: 'mock-token',
        },
      },
    });

    await act(async () => {
      render(
        <SupabaseAuthProvider>
          <TestConsumer />
        </SupabaseAuthProvider>
      );
    });

    // After initialization it should show authenticated
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
  });
});
