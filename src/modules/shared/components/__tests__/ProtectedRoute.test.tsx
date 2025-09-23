import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { ClerkAuthProvider } from '@/modules/auth/contexts/ClerkAuthContext';
import { mockClerkUser } from '@/test/mocks/clerk';

// Mock the useClerkAuth hook
const mockUseClerkAuth = vi.fn();
vi.mock('@/modules/auth/contexts/ClerkAuthContext', async () => {
  const actual = await vi.importActual('@/modules/auth/contexts/ClerkAuthContext');
  return {
    ...actual,
    useClerkAuth: () => mockUseClerkAuth(),
    ClerkAuthProvider: ({ children }: any) => children,
  };
});

// Mock Navigate component to track redirects
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to, state }: any) => {
      mockNavigate(to, state);
      return null;
    },
  };
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when authentication is being checked', () => {
      mockUseClerkAuth.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        user: null,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Authentication Check', () => {
    it('should render children when user is authenticated', () => {
      mockUseClerkAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: {
          ...mockClerkUser,
          subscription_status: 'free',
        },
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should redirect to /auth when user is not authenticated', () => {
      mockUseClerkAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith(
        '/auth',
        expect.objectContaining({
          from: expect.objectContaining({
            pathname: '/dashboard',
          }),
        })
      );
    });
  });

  describe('Subscription Level Check', () => {
    it('should render content when user has required subscription level', () => {
      mockUseClerkAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: {
          ...mockClerkUser,
          subscription_status: 'premium',
        },
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requiredSubscription="premium">
            <div>Premium Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Premium Content')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should render content when user has higher subscription than required', () => {
      mockUseClerkAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: {
          ...mockClerkUser,
          subscription_status: 'premium',
        },
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requiredSubscription="basic">
            <div>Basic Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Basic Content')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should redirect to /upgrade when user has insufficient subscription', () => {
      mockUseClerkAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: {
          ...mockClerkUser,
          subscription_status: 'free',
        },
      });

      render(
        <MemoryRouter initialEntries={['/premium-features']}>
          <ProtectedRoute requiredSubscription="premium">
            <div>Premium Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.queryByText('Premium Content')).not.toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith(
        '/upgrade',
        expect.objectContaining({
          from: expect.objectContaining({
            pathname: '/premium-features',
          }),
        })
      );
    });

    it('should handle missing subscription_status as free tier', () => {
      mockUseClerkAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: {
          ...mockClerkUser,
          subscription_status: undefined,
        },
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requiredSubscription="basic">
            <div>Basic Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.queryByText('Basic Content')).not.toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith(
        '/upgrade',
        expect.any(Object)
      );
    });
  });

  describe('Subscription Level Hierarchy', () => {
    const testCases = [
      { userLevel: 'free', requiredLevel: 'free', shouldRender: true },
      { userLevel: 'free', requiredLevel: 'basic', shouldRender: false },
      { userLevel: 'free', requiredLevel: 'premium', shouldRender: false },
      { userLevel: 'basic', requiredLevel: 'free', shouldRender: true },
      { userLevel: 'basic', requiredLevel: 'basic', shouldRender: true },
      { userLevel: 'basic', requiredLevel: 'premium', shouldRender: false },
      { userLevel: 'premium', requiredLevel: 'free', shouldRender: true },
      { userLevel: 'premium', requiredLevel: 'basic', shouldRender: true },
      { userLevel: 'premium', requiredLevel: 'premium', shouldRender: true },
    ];

    testCases.forEach(({ userLevel, requiredLevel, shouldRender }) => {
      it(`should ${shouldRender ? 'render' : 'redirect'} when user has ${userLevel} and ${requiredLevel} is required`, () => {
        mockUseClerkAuth.mockReturnValue({
          isLoading: false,
          isAuthenticated: true,
          user: {
            ...mockClerkUser,
            subscription_status: userLevel as any,
          },
        });

        render(
          <MemoryRouter>
            <ProtectedRoute requiredSubscription={requiredLevel as any}>
              <div>Protected Content</div>
            </ProtectedRoute>
          </MemoryRouter>
        );

        if (shouldRender) {
          expect(screen.getByText('Protected Content')).toBeInTheDocument();
          expect(mockNavigate).not.toHaveBeenCalled();
        } else {
          expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
          expect(mockNavigate).toHaveBeenCalledWith('/upgrade', expect.any(Object));
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user gracefully', () => {
      mockUseClerkAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: null,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should render children when no subscription requirement is specified', () => {
      mockUseClerkAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: {
          ...mockClerkUser,
          subscription_status: 'free',
        },
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Any Authenticated User Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Any Authenticated User Content')).toBeInTheDocument();
    });
  });
});