/**
 * BetterAuth AuthProvider tests
 *
 * Validates the React context, hooks, and auth action handlers provided by
 * BetterAuthProvider.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

// ─── Hoisted mocks (must be initialised before vi.mock factories run) ─────────
const {
  mockUseSession,
  mockSignInEmail,
  mockSignUpEmail,
  mockSignOut,
  mockSignInSocial,
  mockGetSession,
  mockSupabaseFrom,
  mockSupabaseFunctionsInvoke,
  mockInvokeAuthenticatedFunction,
} = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
  mockSignInEmail: vi.fn(),
  mockSignUpEmail: vi.fn(),
  mockSignOut: vi.fn(),
  mockSignInSocial: vi.fn(),
  mockGetSession: vi.fn(),
  mockSupabaseFrom: vi.fn(),
  mockSupabaseFunctionsInvoke: vi.fn(),
  mockInvokeAuthenticatedFunction: vi.fn(),
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
    from: mockSupabaseFrom,
    functions: {
      invoke: mockSupabaseFunctionsInvoke,
    },
  },
  invokeAuthenticatedFunction: mockInvokeAuthenticatedFunction,
}));

vi.mock('@/core/integrations/supabase/userData', () => ({
  getOwnProfile: vi.fn(async () => {
    throw new Error('Legacy browser profile boundary invoked');
  }),
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

async function flushProviderEffects() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function expectOnlyServerOwnedProfileBoundary(expectedProvisionCalls: number) {
  const provisionCalls = mockInvokeAuthenticatedFunction.mock.calls.filter(
    ([functionName]) => functionName === 'provision-profile',
  );
  expect(provisionCalls).toHaveLength(expectedProvisionCalls);
  for (const [, options] of provisionCalls) {
    expect(options).toEqual({ method: 'POST' });
  }
  expect(mockSupabaseFrom).not.toHaveBeenCalled();
  expect(mockSupabaseFunctionsInvoke).not.toHaveBeenCalled();
}

function authProviderSource(): ts.SourceFile {
  const path = resolve(process.cwd(), 'src/core/integrations/better-auth/AuthProvider.tsx');
  return ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function importsForbiddenProfileBoundary(source: ts.SourceFile): boolean {
  return source.statements.some((statement) => {
    return ts.isImportDeclaration(statement)
      && ts.isStringLiteral(statement.moduleSpecifier)
      && /(?:^|\/)userData$/.test(statement.moduleSpecifier.text);
  });
}

function hasRawBrowserProfileRead(source: ts.SourceFile): boolean {
  let rawRead = false;
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node)
      && ts.isPropertyAccessExpression(node.expression)
      && node.expression.name.text === 'from'
      && node.arguments[0]
      && ts.isStringLiteralLike(node.arguments[0])
      && ['profiles', 'user_credits', 'credit_transactions'].includes(node.arguments[0].text)
    ) {
      rawRead = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return rawRead;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BetterAuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    mockGetSession.mockResolvedValue({ data: null });
    mockSupabaseFunctionsInvoke.mockResolvedValue({
      data: { success: true, data: { balance: 5 } },
      error: null,
    });
    mockInvokeAuthenticatedFunction.mockResolvedValue({
      data: { profile: null, credits: 0, created: false },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('has no anonymous browser profile boundary to bypass provision-profile', () => {
    const source = authProviderSource();

    expect(importsForbiddenProfileBoundary(source)).toBe(false);
    expect(hasRawBrowserProfileRead(source)).toBe(false);
    expect(readFileSync(source.fileName, 'utf8')).not.toContain('getOwnProfile');
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

  it('real user scenario: a first BetterAuth session provisions with no client identity payload and exposes the canonical server profile', async () => {
    const sessionUser = {
      id: 'user-123',
      email: 'stale-browser-claim@example.com',
      name: 'Stale Browser Name',
      image: 'https://browser.example/avatar.png',
      createdAt: new Date().toISOString(),
    };
    const canonicalProfile = {
      id: 'user-123',
      email: 'verified-server-identity@example.com',
      full_name: 'Canonical Server Name',
      avatar_url: 'https://server.example/avatar.png',
      subscription_status: 'premium',
      created_at: '2026-08-24T00:00:00.000Z',
      credits: 17,
    };
    mockUseSession.mockReturnValue({
      data: { user: sessionUser, session: { token: 'opaque-better-auth-session' } },
      isPending: false,
    });
    mockInvokeAuthenticatedFunction.mockResolvedValue({
      data: { profile: canonicalProfile, credits: 17, created: true },
      error: null,
    });

    let ctx!: AuthContextType;
    renderWithProvider(c => { ctx = c; });

    await flushProviderEffects();
    expect(mockInvokeAuthenticatedFunction).toHaveBeenCalledWith('provision-profile', { method: 'POST' });

    expectOnlyServerOwnedProfileBoundary(1);

    await waitFor(() => {
      expect(ctx.user).toMatchObject({
        id: 'user-123',
        email: 'verified-server-identity@example.com',
        name: 'Canonical Server Name',
        avatar_url: 'https://server.example/avatar.png',
        subscription_status: 'premium',
        credits: 17,
      });
    });
    expect(ctx.isNewUser).toBe(true);
  });

  it('real user scenario: a temporary provisioning failure is retried by refreshUser instead of permanently marking the account synced', async () => {
    const sessionUser = {
      id: 'user-retry',
      email: 'retry@example.com',
      name: 'Retry User',
      image: null,
      createdAt: new Date().toISOString(),
    };
    const canonicalProfile = {
      id: 'user-retry',
      email: 'retry@example.com',
      full_name: 'Retry User',
      avatar_url: '',
      subscription_status: 'basic',
      created_at: '2026-08-24T00:00:00.000Z',
      credits: 8,
    };
    mockUseSession.mockReturnValue({
      data: { user: sessionUser, session: { token: 'opaque-better-auth-session' } },
      isPending: false,
    });
    mockInvokeAuthenticatedFunction
      .mockResolvedValueOnce({ data: null, error: new Error('Temporary provisioning outage') })
      .mockResolvedValueOnce({ data: { profile: canonicalProfile, credits: 8, created: true }, error: null });

    let ctx!: AuthContextType;
    renderWithProvider(c => { ctx = c; });

    await flushProviderEffects();
    expectOnlyServerOwnedProfileBoundary(1);

    expect(ctx.isNewUser).toBe(false);
    expect(ctx.user).toMatchObject({
      id: 'user-retry',
      credits: 0,
      subscription_status: 'free',
    });

    await act(async () => {
      await ctx.refreshUser();
    });

    await waitFor(() => {
      const provisionCalls = mockInvokeAuthenticatedFunction.mock.calls.filter(
        ([functionName]) => functionName === 'provision-profile',
      );
      expect(provisionCalls).toHaveLength(2);
      expect(provisionCalls[1]?.[1]).toEqual({ method: 'POST' });
    });
    expectOnlyServerOwnedProfileBoundary(2);

    await waitFor(() => {
      expect(ctx.user).toMatchObject({
        id: 'user-retry',
        subscription_status: 'basic',
        credits: 8,
      });
    });
  });

  it('real user scenario: a malformed provisioning response never grants browser-created credits or marks the account as synced', async () => {
    const sessionUser = {
      id: 'user-malformed-provision',
      email: 'malformed@example.com',
      name: 'Malformed Provision',
      image: null,
      createdAt: new Date().toISOString(),
    };
    mockUseSession.mockReturnValue({
      data: { user: sessionUser, session: { token: 'opaque-better-auth-session' } },
      isPending: false,
    });
    mockInvokeAuthenticatedFunction.mockResolvedValue({
      data: { profile: null, credits: 3, created: true },
      error: null,
    });

    let ctx!: AuthContextType;
    renderWithProvider(c => { ctx = c; });

    await flushProviderEffects();
    expect(mockInvokeAuthenticatedFunction).toHaveBeenCalledWith('provision-profile', { method: 'POST' });

    expectOnlyServerOwnedProfileBoundary(1);
    expect(ctx.isNewUser).toBe(false);
    expect(ctx.user).toMatchObject({
      id: 'user-malformed-provision',
      credits: 0,
      subscription_status: 'free',
    });
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
