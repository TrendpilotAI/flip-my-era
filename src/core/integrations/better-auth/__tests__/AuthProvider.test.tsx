/**
 * BetterAuth AuthProvider tests
 *
 * Validates the React context, hooks, and auth action handlers provided by
 * BetterAuthProvider.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { createElement } from 'react';

// ─── Hoisted mocks (must be initialised before vi.mock factories run) ─────────
const {
  mockUseSession,
  mockSignInEmail,
  mockSignUpEmail,
  mockSignOut,
  mockSignInSocial,
  mockGetSession,
} = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
  mockSignInEmail: vi.fn(),
  mockSignUpEmail: vi.fn(),
  mockSignOut: vi.fn(),
  mockSignInSocial: vi.fn(),
  mockGetSession: vi.fn(),
}));

// ─── Mock better-auth/react ───────────────────────────────────────────────────
vi.mock('better-auth/react', () => ({
  createAuthClient: () => ({
    useSession: mockUseSession,
    signIn: {
      email: mockSignInEmail,
      social: mockSignInSocial,
    },
    signUp: {
      email: mockSignUpEmail,
    },
    signOut: mockSignOut,
    getSession: mockGetSession,
  }),
}));

// ─── Mock Supabase client ─────────────────────────────────────────────────────
vi.mock('@/core/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: { success: true, data: { balance: 5 } },
        error: null,
      }),
    },
  },
}));

// ─── Import AFTER mocks ───────────────────────────────────────────────────────
import {
  BetterAuthProvider,
  useAuth,
  type AuthContextType,
} from '../AuthProvider';

// ─── Helper ───────────────────────────────────────────────────────────────────

function TestConsumer({ onContext }: { onContext: (ctx: AuthContextType) => void }) {
  const ctx = useAuth();
  onContext(ctx);
  return createElement('div', { 'data-testid': 'consumer' }, ctx.isAuthenticated ? 'authenticated' : 'unauthenticated');
}

function renderWithProvider(onContext: (ctx: AuthContextType) => void) {
  return render(
    createElement(BetterAuthProvider, null,
      createElement(TestConsumer, { onContext })
    )
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BetterAuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides unauthenticated state when no session', () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });

    let ctx!: AuthContextType;
    renderWithProvider(c => { ctx = c; });

    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.isSignedIn).toBe(false);
    expect(ctx.user).toBeNull();
    expect(ctx.session).toBeNull();
    expect(ctx.isLoading).toBe(false);
  });

  it('provides loading state while session is pending', () => {
    mockUseSession.mockReturnValue({ data: null, isPending: true });

    let ctx!: AuthContextType;
    renderWithProvider(c => { ctx = c; });

    expect(ctx.isLoading).toBe(true);
  });

  it('provides authenticated state when session exists', async () => {
    const fakeUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.png',
      createdAt: new Date().toISOString(),
    };
    mockUseSession.mockReturnValue({ data: { user: fakeUser, session: { token: 'tok' } }, isPending: false });

    let ctx!: AuthContextType;
    renderWithProvider(c => { ctx = c; });

    await waitFor(() => {
      expect(ctx.isAuthenticated).toBe(true);
    });

    expect(ctx.user?.id).toBe('user-123');
    expect(ctx.user?.email).toBe('test@example.com');
    expect(ctx.session?.access_token).toBe('tok');
  });

  it('signIn delegates to authClient.signIn.email', async () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    mockSignInEmail.mockResolvedValue({});

    let ctx!: AuthContextType;
    renderWithProvider(c => { ctx = c; });

    await act(async () => {
      const result = await ctx.signIn('a@b.com', 'password123');
      expect(result.error).toBeNull();
    });

    expect(mockSignInEmail).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123' });
  });

  it('signIn returns error when authClient reports an error', async () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    mockSignInEmail.mockResolvedValue({ error: { message: 'Invalid credentials' } });

    let ctx!: AuthContextType;
    renderWithProvider(c => { ctx = c; });

    await act(async () => {
      const result = await ctx.signIn('a@b.com', 'wrong');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toMatch(/invalid credentials/i);
    });
  });

  it('signUp delegates to authClient.signUp.email', async () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    mockSignUpEmail.mockResolvedValue({});

    let ctx!: AuthContextType;
    renderWithProvider(c => { ctx = c; });

    await act(async () => {
      const result = await ctx.signUp('new@user.com', 'pass123', 'New User');
      expect(result.error).toBeNull();
    });

    expect(mockSignUpEmail).toHaveBeenCalledWith({
      email: 'new@user.com',
      password: 'pass123',
      name: 'New User',
    });
  });

  it('signOut delegates to authClient.signOut', async () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    mockSignOut.mockResolvedValue({});

    let ctx!: AuthContextType;
    renderWithProvider(c => { ctx = c; });

    await act(async () => {
      const result = await ctx.signOut();
      expect(result.error).toBeNull();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('signInWithGoogle delegates to authClient.signIn.social', async () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    mockSignInSocial.mockResolvedValue({});

    let ctx!: AuthContextType;
    renderWithProvider(c => { ctx = c; });

    await act(async () => {
      const result = await ctx.signInWithGoogle();
      expect(result.error).toBeNull();
    });

    expect(mockSignInSocial).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' })
    );
  });

  it('getToken returns null when no session', async () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    mockGetSession.mockResolvedValue({ data: null });

    let ctx!: AuthContextType;
    renderWithProvider(c => { ctx = c; });

    const token = await ctx.getToken();
    expect(token).toBeNull();
  });

  it('getToken returns session token when available', async () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    mockGetSession.mockResolvedValue({ data: { session: { token: 'my-session-token' } } });

    let ctx!: AuthContextType;
    renderWithProvider(c => { ctx = c; });

    const token = await ctx.getToken();
    expect(token).toBe('my-session-token');
  });

  it('throws when useAuth is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(createElement(TestConsumer, { onContext: () => {} }));
    }).toThrow(/useBetterAuth must be used within a BetterAuthProvider/i);
    consoleError.mockRestore();
  });
});
