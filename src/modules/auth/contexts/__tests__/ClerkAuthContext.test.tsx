/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ClerkAuthProvider } from '../ClerkAuthContext';
import { AuthContext } from '../AuthContext';
import { useContext } from 'react';

// Mock variables (hoisted)
const mockClerkUser = {
  id: 'user_123',
  primaryEmailAddress: { emailAddress: 'test@example.com' },
  fullName: 'Test User',
  imageUrl: 'https://example.com/avatar.png',
  createdAt: new Date('2025-01-01').getTime(),
};

const mockGetToken = vi.fn().mockResolvedValue('mock-clerk-token');
const mockSignOut = vi.fn().mockResolvedValue(undefined);

let mockUser: typeof mockClerkUser | null = mockClerkUser;
let mockIsLoaded = true;

vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ user: mockUser, isLoaded: mockIsLoaded }),
  useAuth: () => ({
    signOut: mockSignOut,
    getToken: mockGetToken,
  }),
  SignInButton: ({ children }: any) => <div data-testid="sign-in-button">{children}</div>,
  SignUpButton: ({ children }: any) => <div data-testid="sign-up-button">{children}</div>,
  UserButton: () => <div data-testid="user-button" />,
}));

vi.mock('@/core/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true, data: { balance: { balance: 10 } } }, error: null }),
    },
  },
  signOutFromSupabase: vi.fn().mockResolvedValue(undefined),
  createSupabaseClientWithClerkToken: vi.fn(() => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: {
              id: 'user_123',
              email: 'test@example.com',
              name: 'Test User',
              avatar_url: 'https://example.com/avatar.png',
              subscription_status: 'free',
              created_at: '2025-01-01T00:00:00Z',
              credits: 10,
            },
            error: null,
          }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      insert: () => Promise.resolve({ error: null }),
    }),
  })),
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

// Test consumer component
function AuthConsumer() {
  const ctx = useContext(AuthContext);
  if (!ctx) return <div>No context</div>;
  return (
    <div>
      <span data-testid="loading">{String(ctx.isLoading)}</span>
      <span data-testid="authenticated">{String(ctx.isAuthenticated)}</span>
      <span data-testid="user-email">{ctx.user?.email || 'none'}</span>
      <span data-testid="user-name">{ctx.user?.name || 'none'}</span>
      <button data-testid="sign-out" onClick={() => ctx.signOut()}>Sign Out</button>
      <button data-testid="refresh" onClick={() => ctx.refreshUser()}>Refresh</button>
    </div>
  );
}

describe('ClerkAuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = mockClerkUser;
    mockIsLoaded = true;
  });

  it('provides user state when authenticated', async () => {
    render(
      <ClerkAuthProvider>
        <AuthConsumer />
      </ClerkAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });
    expect(screen.getByTestId('user-email').textContent).toBe('test@example.com');
  });

  it('shows loading state when Clerk is not loaded', () => {
    mockIsLoaded = false;
    render(
      <ClerkAuthProvider>
        <AuthConsumer />
      </ClerkAuthProvider>
    );

    expect(screen.getByTestId('loading').textContent).toBe('true');
  });

  it('shows unauthenticated when no user', async () => {
    mockUser = null;
    render(
      <ClerkAuthProvider>
        <AuthConsumer />
      </ClerkAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });
    expect(screen.getByTestId('user-email').textContent).toBe('none');
  });

  it('cleans up AbortController on unmount', async () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');

    const { unmount } = render(
      <ClerkAuthProvider>
        <AuthConsumer />
      </ClerkAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    unmount();
    expect(abortSpy).toHaveBeenCalled();
    abortSpy.mockRestore();
  });

  it('calls getToken with supabase template during sync', async () => {
    render(
      <ClerkAuthProvider>
        <AuthConsumer />
      </ClerkAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    expect(mockGetToken).toHaveBeenCalledWith({ template: 'supabase' });
  });

  it('handles sign out correctly', async () => {
    const { signOutFromSupabase } = await import('@/core/integrations/supabase/client');
    const { sentryService } = await import('@/core/integrations/sentry');

    render(
      <ClerkAuthProvider>
        <AuthConsumer />
      </ClerkAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    await act(async () => {
      screen.getByTestId('sign-out').click();
    });

    expect(signOutFromSupabase).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalled();
    expect(sentryService.setUser).toHaveBeenCalledWith(null);
  });
});
