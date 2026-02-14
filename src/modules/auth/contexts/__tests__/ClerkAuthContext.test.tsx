/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { ClerkAuthProvider } from '../ClerkAuthContext';

// ── vi.hoisted() – mock values declared before vi.mock() factories ──
const mocks = vi.hoisted(() => {
  const mockGetToken = vi.fn().mockResolvedValue('mock-clerk-jwt');
  const mockSignOut = vi.fn().mockResolvedValue(undefined);

  return {
    mockClerkUser: null as any,
    mockIsLoaded: true,
    mockGetToken,
    mockSignOut,
  };
});

// ── vi.mock() factories reference hoisted mocks ──
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ user: mocks.mockClerkUser, isLoaded: mocks.mockIsLoaded }),
  useAuth: () => ({ signOut: mocks.mockSignOut, getToken: mocks.mockGetToken }),
  SignInButton: ({ children }: any) => children ?? null,
  SignUpButton: ({ children }: any) => children ?? null,
  UserButton: () => null,
}));

vi.mock('@/core/integrations/sentry', () => ({
  sentryService: {
    setUser: vi.fn(),
    addBreadcrumb: vi.fn(),
    captureException: vi.fn(),
  },
}));

vi.mock('@/core/integrations/posthog', () => ({
  posthogService: { identify: vi.fn(), reset: vi.fn() },
  posthogEvents: {
    userSignedUp: vi.fn(),
    userSignedIn: vi.fn(),
    userSignedOut: vi.fn(),
  },
}));

// Consumer component that reads the AuthContext
function AuthConsumer() {
  const auth = useContext(AuthContext);
  if (!auth) return <div>No auth context</div>;
  return (
    <div>
      <span data-testid="loading">{String(auth.isLoading)}</span>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="user-email">{auth.user?.email ?? 'none'}</span>
      <span data-testid="user-name">{auth.user?.name ?? 'none'}</span>
      <button data-testid="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <ClerkAuthProvider>
      <AuthConsumer />
    </ClerkAuthProvider>,
  );
}

// Import the Supabase mock that setup.ts exports
import { __testSupabaseMocks__ } from '@/test/setup';

describe('ClerkAuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockClerkUser = null;
    mocks.mockIsLoaded = true;
    mocks.mockGetToken.mockResolvedValue('mock-clerk-jwt');

    // Default Supabase stubs – profile select returns existing user
    __testSupabaseMocks__.supabaseSelectMock.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'clerk_user_1',
            email: 'test@example.com',
            name: 'Test User',
            avatar_url: 'https://img.clerk.com/avatar',
            subscription_status: 'free',
            created_at: '2025-01-01T00:00:00Z',
            credits: 50,
          },
          error: null,
        }),
      }),
    });

    __testSupabaseMocks__.supabaseUpdateMock.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    // credits edge function returns balance
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: { success: true, data: { balance: 50 } },
      error: null,
    });

    // createSupabaseClientWithClerkToken returns the same mock client
    __testSupabaseMocks__.createSupabaseClientWithClerkTokenMock.mockReturnValue(
      __testSupabaseMocks__.supabase,
    );
  });

  it('provides unauthenticated state when no Clerk user', () => {
    mocks.mockClerkUser = null;
    renderWithProvider();

    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user-email').textContent).toBe('none');
  });

  it('shows loading when Clerk is not loaded', () => {
    mocks.mockIsLoaded = false;
    renderWithProvider();

    expect(screen.getByTestId('loading').textContent).toBe('true');
  });

  it('provides authenticated user from Clerk data', async () => {
    mocks.mockClerkUser = {
      id: 'clerk_user_1',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      fullName: 'Test User',
      imageUrl: 'https://img.clerk.com/avatar',
      createdAt: new Date('2025-01-01').getTime(),
    };

    renderWithProvider();

    // Initially the user falls back to Clerk data before profile sync
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });
    expect(screen.getByTestId('user-email').textContent).toBe('test@example.com');
  });

  it('syncs user profile from Supabase for existing user', async () => {
    mocks.mockClerkUser = {
      id: 'clerk_user_1',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      fullName: 'Test User',
      imageUrl: 'https://img.clerk.com/avatar',
      createdAt: new Date('2025-01-01').getTime(),
    };

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user-name').textContent).toBe('Test User');
    });

    // Should have called getToken to get Clerk JWT
    expect(mocks.mockGetToken).toHaveBeenCalledWith({ template: 'supabase' });
    // Should have called createSupabaseClientWithClerkToken
    expect(__testSupabaseMocks__.createSupabaseClientWithClerkTokenMock).toHaveBeenCalledWith('mock-clerk-jwt');
  });

  it('creates new profile when user does not exist in Supabase', async () => {
    // Supabase select returns PGRST116 (no rows found)
    __testSupabaseMocks__.supabaseSelectMock.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      }),
    });

    __testSupabaseMocks__.supabaseInsertMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });

    mocks.mockClerkUser = {
      id: 'new_user_1',
      primaryEmailAddress: { emailAddress: 'new@example.com' },
      fullName: 'New User',
      imageUrl: 'https://img.clerk.com/new',
      createdAt: new Date('2025-06-01').getTime(),
    };

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user-email').textContent).toBe('new@example.com');
    });
  });

  it('handles sign out correctly', async () => {
    mocks.mockClerkUser = {
      id: 'clerk_user_1',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      fullName: 'Test User',
      imageUrl: 'https://img.clerk.com/avatar',
      createdAt: new Date('2025-01-01').getTime(),
    };

    const { getByTestId } = renderWithProvider();

    await waitFor(() => {
      expect(getByTestId('authenticated').textContent).toBe('true');
    });

    await act(async () => {
      getByTestId('sign-out').click();
    });

    expect(mocks.mockSignOut).toHaveBeenCalled();
    expect(__testSupabaseMocks__.signOutFromSupabaseMock).toHaveBeenCalled();
  });

  it('falls back to Clerk data when Supabase sync fails', async () => {
    // Supabase select throws error
    __testSupabaseMocks__.supabaseSelectMock.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockRejectedValue(new Error('DB unavailable')),
      }),
    });

    mocks.mockClerkUser = {
      id: 'clerk_user_1',
      primaryEmailAddress: { emailAddress: 'fallback@example.com' },
      fullName: 'Fallback User',
      imageUrl: 'https://img.clerk.com/fb',
      createdAt: new Date('2025-01-01').getTime(),
    };

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user-email').textContent).toBe('fallback@example.com');
    });
  });

  it('returns null token when getToken fails', async () => {
    mocks.mockGetToken.mockRejectedValue(new Error('Token error'));
    mocks.mockClerkUser = {
      id: 'clerk_user_1',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      fullName: 'Test User',
      imageUrl: 'https://img.clerk.com/avatar',
      createdAt: new Date('2025-01-01').getTime(),
    };

    let authValue: any;
    function TokenConsumer() {
      authValue = useContext(AuthContext);
      return null;
    }

    render(
      <ClerkAuthProvider>
        <TokenConsumer />
      </ClerkAuthProvider>,
    );

    await waitFor(() => {
      expect(authValue).toBeDefined();
    });

    const token = await authValue.getToken();
    expect(token).toBeNull();
  });
});
