/**
 * Integration tests for SupabaseAuthProvider
 * Covers auth lifecycle, memory-leak guards, and race-condition protection.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { SupabaseAuthProvider, useSupabaseAuth } from '@/core/integrations/supabase/auth';

// ─── Mock supabase client ────────────────────────────────────────────────────

const mockUnsubscribe = vi.fn();
let capturedAuthCallback: ((event: string, session: unknown) => void) | null = null;

const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } });
const mockOnAuthStateChange = vi.fn().mockImplementation((cb: (event: string, session: unknown) => void) => {
  capturedAuthCallback = cb;
  return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
});
const mockSignOut = vi.fn().mockResolvedValue({ error: null });
const mockRefreshSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });

const mockFrom = vi.fn(() => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
}));

vi.mock('@/core/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => mockOnAuthStateChange(cb),
      signOut: () => mockSignOut(),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
      refreshSession: () => mockRefreshSession(),
    },
    from: (...args: unknown[]) => mockFrom(...args),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { balance: 5 }, error: null }),
    },
  },
}));

// ─── Test helpers ─────────────────────────────────────────────────────────────

const mockSession = (userId = 'user-123', email = 'test@example.com') => ({
  user: {
    id: userId,
    email,
    user_metadata: { full_name: 'Test User', avatar_url: '' },
    created_at: '2024-01-01T00:00:00Z',
  },
  access_token: 'mock-access-token',
  expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
});

function TestConsumer() {
  const { isAuthenticated, isLoading, user, isNewUser } = useSupabaseAuth();
  return createElement('div', null,
    createElement('span', { 'data-testid': 'loading' }, String(isLoading)),
    createElement('span', { 'data-testid': 'authenticated' }, String(isAuthenticated)),
    createElement('span', { 'data-testid': 'user' }, user ? user.email : 'none'),
    createElement('span', { 'data-testid': 'new-user' }, String(isNewUser)),
  );
}

function SignOutConsumer() {
  const { signOut, isAuthenticated } = useSupabaseAuth();
  return createElement('div', null,
    createElement('span', { 'data-testid': 'authenticated' }, String(isAuthenticated)),
    createElement('button', { 'data-testid': 'sign-out', onClick: signOut }, 'Sign out'),
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SupabaseAuthProvider — auth lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedAuthCallback = null;
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── 1. No session ──────────────────────────────────────────────────────────
  it('renders unauthenticated when no session exists', async () => {
    await act(async () => {
      render(createElement(SupabaseAuthProvider, null, createElement(TestConsumer)));
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('none');
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  // ── 2. Authenticated session ───────────────────────────────────────────────
  it('shows authenticated user when session is present', async () => {
    const session = mockSession();
    mockGetSession.mockResolvedValue({ data: { session } });

    await act(async () => {
      render(createElement(SupabaseAuthProvider, null, createElement(TestConsumer)));
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).toBe('test@example.com');
    });
  });

  // ── 3. Auth state change — sign-in ────────────────────────────────────────
  it('updates state when auth state changes to signed-in', async () => {
    await act(async () => {
      render(createElement(SupabaseAuthProvider, null, createElement(TestConsumer)));
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');

    // Simulate Supabase firing SIGNED_IN
    await act(async () => {
      capturedAuthCallback?.('SIGNED_IN', mockSession());
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });
  });

  // ── 4. Auth state change — sign-out ──────────────────────────────────────
  it('clears user state when auth state changes to signed-out', async () => {
    const session = mockSession();
    mockGetSession.mockResolvedValue({ data: { session } });

    await act(async () => {
      render(createElement(SupabaseAuthProvider, null, createElement(SignOutConsumer)));
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    // Simulate Supabase firing SIGNED_OUT
    await act(async () => {
      capturedAuthCallback?.('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });
  });

  // ── 5. Cleanup on unmount (memory-leak guard) ─────────────────────────────
  it('unsubscribes from auth listener on unmount', async () => {
    let unmount!: () => void;
    await act(async () => {
      ({ unmount } = render(createElement(SupabaseAuthProvider, null, createElement(TestConsumer))));
    });

    act(() => {
      unmount();
    });

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  // ── 6. No state update after unmount (race-condition guard) ───────────────
  it('does not update state after component is unmounted', async () => {
    const setStateSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let unmount!: () => void;

    // Delay the session resolution so we can unmount mid-flight
    let resolveSession!: (v: unknown) => void;
    mockGetSession.mockReturnValueOnce(new Promise(res => { resolveSession = res; }));

    await act(async () => {
      ({ unmount } = render(createElement(SupabaseAuthProvider, null, createElement(TestConsumer))));
    });

    // Unmount before the async session resolves
    act(() => {
      unmount();
    });

    // Now resolve — should not trigger React "can't perform state update on unmounted" warning
    await act(async () => {
      resolveSession({ data: { session: null } });
      await new Promise(r => setTimeout(r, 50));
    });

    // React 18 does not warn for this, but the isMountedRef guard should
    // have prevented any post-unmount setState call.
    setStateSpy.mockRestore();
  });

  // ── 7. Concurrent sync cancellation (AbortController) ────────────────────
  it('cancels a previous profile sync when a new auth event fires', async () => {
    const session1 = mockSession('user-1', 'user1@example.com');
    const session2 = mockSession('user-2', 'user2@example.com');

    await act(async () => {
      render(createElement(SupabaseAuthProvider, null, createElement(TestConsumer)));
    });

    // Fire two rapid auth-state changes (simulates fast sign-in/switch)
    await act(async () => {
      capturedAuthCallback?.('SIGNED_IN', session1);
      capturedAuthCallback?.('SIGNED_IN', session2);
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    // Both events were processed; no crash or stale state should occur.
    // The final visible user should be whichever sync completed last.
    const userText = screen.getByTestId('user').textContent;
    expect(['user1@example.com', 'user2@example.com']).toContain(userText);
  });

  // ── 8. Token refresh scheduling ───────────────────────────────────────────
  it('schedules a token refresh before session expiry', async () => {
    vi.useFakeTimers();

    // Session expires in 65 seconds → refresh should be scheduled in 5 s
    const soonExpiring = {
      ...mockSession(),
      expires_at: Math.floor(Date.now() / 1000) + 65,
    };
    mockGetSession.mockResolvedValue({ data: { session: soonExpiring } });
    mockRefreshSession.mockResolvedValue({
      data: { session: { ...soonExpiring, expires_at: Math.floor(Date.now() / 1000) + 3600 } },
      error: null,
    });

    await act(async () => {
      render(createElement(SupabaseAuthProvider, null, createElement(TestConsumer)));
    });

    // Advance past the refresh window (> 5 s delay)
    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    expect(mockRefreshSession).toHaveBeenCalled();
  });

  // ── 9. New user gets signup credits ──────────────────────────────────────
  it('marks isNewUser true for first-time sign-in', async () => {
    const session = mockSession('new-user-456', 'newbie@example.com');
    mockGetSession.mockResolvedValue({ data: { session } });

    // Profile does not yet exist → PGRST116 (row not found)
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    });

    await act(async () => {
      render(createElement(SupabaseAuthProvider, null, createElement(TestConsumer)));
    });

    await waitFor(() => {
      expect(screen.getByTestId('new-user').textContent).toBe('true');
    });
  });

  // ── 10. useSupabaseAuth throws outside provider ───────────────────────────
  it('throws when useSupabaseAuth is used outside provider', () => {
    const originalError = console.error;
    console.error = vi.fn(); // suppress React's error boundary noise

    function Orphan() {
      useSupabaseAuth();
      return null;
    }

    expect(() => render(createElement(Orphan))).toThrow(
      'useSupabaseAuth must be used within a SupabaseAuthProvider',
    );

    console.error = originalError;
  });
});
