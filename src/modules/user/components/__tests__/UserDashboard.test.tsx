/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { __testSupabaseMocks__ } from '@/test/setup';

const mocks = vi.hoisted(() => ({
  user: { id: 'user-123', email: 'test@example.com', name: 'Test User', subscription_status: 'free', created_at: '2026-01-01' } as any,
}));

vi.mock('@/modules/auth/contexts', () => ({
  useClerkAuth: () => ({
    user: mocks.user,
    isAuthenticated: true,
    isLoading: false,
  }),
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

vi.mock('@/modules/shared/components/ErrorBoundary', () => ({
  withErrorBoundary: (Component: any) => Component,
}));

// Need to import after all mocks are set up
const { default: UserDashboard } = await import('../UserDashboard');

describe('UserDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: 'user-123', email: 'test@example.com', name: 'Test User', subscription_status: 'free', created_at: '2026-01-01' };
    // Mock supabase stories query
    __testSupabaseMocks__.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [
                { id: '1', title: 'My Story', name: 'Taylor', birth_date: null, initial_story: 'Once upon a time...', created_at: '2026-01-15' },
              ],
              error: null,
            }),
          }),
        }),
      }),
    });
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
    __testSupabaseMocks__.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    });

    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('No stories yet')).toBeInTheDocument());
  });

  it('should display subscription badge', async () => {
    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Free Plan')).toBeInTheDocument());
  });
});
