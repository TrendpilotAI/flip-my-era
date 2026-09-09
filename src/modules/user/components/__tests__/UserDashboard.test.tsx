/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  user: { id: 'user-123', email: 'test@example.com', name: 'Test User', subscription_status: 'free', created_at: '2026-01-01' } as any,
  getToken: vi.fn(async () => 'better-auth-token'),
  listOwnStories: vi.fn(),
  creatorAnalyticsEnabled: false,
  ebooksRead: vi.fn(),
}));

vi.mock('@/modules/auth/contexts', () => ({
  useClerkAuth: () => ({
    user: mocks.user,
    isAuthenticated: true,
    isLoading: false,
    getToken: mocks.getToken,
  }),
}));

vi.mock('@/core/integrations/supabase/userData', () => ({
  listOwnStories: mocks.listOwnStories,
}));

vi.mock('@/core/config/featureFlags', () => ({
  isFeatureEnabled: (flag: string) => flag === 'creator_profiles' && mocks.creatorAnalyticsEnabled,
}));

vi.mock('@/modules/shared/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('react-markdown', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/modules/ebook/components/UserBooks', () => ({
  UserBooks: () => <div data-testid="user-books">User Books</div>,
}));

vi.mock('@/modules/creator/CreatorAnalytics', () => ({
  CreatorAnalytics: () => {
    mocks.ebooksRead();
    return <div>Creator Analytics</div>;
  },
}));

vi.mock('@/modules/shared/components/ErrorBoundary', () => ({
  withErrorBoundary: (Component: any) => Component,
}));

// Need to import after all mocks are set up
const { default: UserDashboard } = await import('../UserDashboard');

describe('UserDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: 'user-123', email: 'test@example.com', name: 'Test User', subscription_status: 'free', created_at: '2026-01-01' };
    mocks.creatorAnalyticsEnabled = false;
    mocks.getToken.mockResolvedValue('better-auth-token');
    mocks.listOwnStories.mockResolvedValue([
      {
        id: '1',
        title: 'My Story',
        name: 'Taylor',
        birth_date: null,
        initial_story: 'Once upon a time...',
        created_at: '2026-01-15',
      },
    ]);
  });

  it('should render the dashboard with tabs after loading', async () => {
    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Overview')).toBeInTheDocument());
    expect(screen.getByText('My Stories')).toBeInTheDocument();
    expect(screen.getByText('My Books')).toBeInTheDocument();
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
  });

  it('should display user stories after loading', async () => {
    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('My Story')).toBeInTheDocument());
  });

  it('should show empty state when no stories', async () => {
    mocks.listOwnStories.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('No stories yet')).toBeInTheDocument());
  });

  it('uses the BetterAuth bearer token for private story loading', async () => {
    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mocks.listOwnStories).toHaveBeenCalledWith(6, 'better-auth-token');
    });
  });

  it('should display subscription badge', async () => {
    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Free Plan')).toBeInTheDocument());
  });

  it('rejects the analytics tab parameter while creator profiles are disabled', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard?tab=analytics']}>
        <UserDashboard />
      </MemoryRouter>,
    );

    const overviewTab = await screen.findByRole('tab', { name: 'Overview' });
    expect(overviewTab).toHaveAttribute('data-state', 'active');
    expect(screen.queryByRole('tab', { name: 'Analytics' })).not.toBeInTheDocument();
    expect(mocks.ebooksRead).not.toHaveBeenCalled();
  });
});
