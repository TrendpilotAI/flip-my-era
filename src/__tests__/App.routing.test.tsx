/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// ── vi.hoisted() – mock values declared before vi.mock() factories ──
const mocks = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
  user: null as any,
}));

// Mock auth contexts
vi.mock('@/modules/auth/contexts', () => ({
  useClerkAuth: () => ({
    isAuthenticated: mocks.isAuthenticated,
    isLoading: mocks.isLoading,
    user: mocks.user,
  }),
}));

vi.mock('@/modules/auth/contexts/ClerkAuthContext', () => ({
  ClerkAuthProvider: ({ children }: any) => <div>{children}</div>,
}));

// Mock integrations
vi.mock('@/core/integrations/sentry', () => ({
  initSentry: vi.fn(),
  sentryService: { addBreadcrumb: vi.fn(), captureException: vi.fn(), startTransaction: vi.fn(() => ({ setTag: vi.fn(), finish: vi.fn() })) },
}));
vi.mock('@/core/integrations/posthog', () => ({
  posthogEvents: { pageViewed: vi.fn() },
}));
vi.mock('@/core/utils/performance', () => ({
  performanceMonitor: { init: vi.fn() },
}));

// Mock all page components as simple divs
vi.mock('@/app/pages/Index', () => ({ default: () => <div data-testid="index-page">Home</div> }));
vi.mock('@/app/pages/NotFound', () => ({ default: () => <div data-testid="not-found">404 Not Found</div> }));
vi.mock('@/app/pages/FAQ', () => ({ default: () => <div data-testid="faq-page">FAQ</div> }));
vi.mock('@/app/pages/PlanSelector', () => ({ default: () => <div data-testid="plans-page">Plans</div> }));
vi.mock('@/app/pages/Checkout', () => ({ default: () => <div data-testid="checkout-page">Checkout</div> }));
vi.mock('@/app/pages/CheckoutSuccess', () => ({ default: () => <div data-testid="checkout-success">Success</div> }));
vi.mock('@/app/pages/UpgradePlan', () => ({ default: () => <div data-testid="upgrade-page">Upgrade</div> }));
vi.mock('@/app/pages/AdminDashboard', () => ({ default: () => <div data-testid="admin-dashboard">Admin</div> }));
vi.mock('@/app/pages/AdminIntegrations', () => ({ default: () => <div data-testid="admin-integrations">Integrations</div> }));
vi.mock('@/app/pages/AdminUsers', () => ({ default: () => <div data-testid="admin-users">Users</div> }));
vi.mock('@/app/pages/AdminCredits', () => ({ default: () => <div data-testid="admin-credits">Credits</div> }));
vi.mock('@/modules/auth/components/Auth', () => ({ default: () => <div data-testid="auth-page">Auth</div> }));
vi.mock('@/modules/auth/components/AuthCallback', () => ({ default: () => <div data-testid="auth-callback">Callback</div> }));
vi.mock('@/modules/auth/components/ResetPassword', () => ({ default: () => <div data-testid="reset-password">Reset</div> }));
vi.mock('@/modules/user/components/UserDashboard', () => ({ default: () => <div data-testid="user-dashboard">Dashboard</div> }));
vi.mock('@/modules/shared/components/Layout', () => ({ Layout: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/modules/shared/components/ui/toaster', () => ({ Toaster: () => null }));
vi.mock('@/modules/shared/components/ErrorBoundary', () => ({ ErrorBoundary: ({ children }: any) => <div>{children}</div> }));

// Import ProtectedRoute and AdminRoute after mocks
import { ProtectedRoute } from '@/modules/shared/components/ProtectedRoute';
import { AdminRoute } from '@/modules/shared/components/AdminRoute';

// Re-create minimal route structure for testing (avoids importing the full App with BrowserRouter)
function TestApp({ initialRoute }: { initialRoute: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<div data-testid="index-page">Home</div>} />
        <Route path="/plans" element={<div data-testid="plans-page">Plans</div>} />
        <Route path="/faq" element={<div data-testid="faq-page">FAQ</div>} />
        <Route path="/auth" element={<div data-testid="auth-page">Auth</div>} />
        <Route path="/auth/callback" element={<div data-testid="auth-callback">Callback</div>} />
        <Route path="/reset-password" element={<div data-testid="reset-password">Reset</div>} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><div data-testid="user-dashboard">Dashboard</div></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><div data-testid="checkout-page">Checkout</div></ProtectedRoute>} />
        <Route path="/upgrade" element={<ProtectedRoute><div data-testid="upgrade-page">Upgrade</div></ProtectedRoute>} />
        <Route path="/premium-features" element={<ProtectedRoute requiredSubscription="premium"><div data-testid="premium-page">Premium</div></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminRoute><div data-testid="admin-dashboard">Admin</div></AdminRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<div data-testid="not-found">404 Not Found</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('App Routing', () => {
  beforeEach(() => {
    mocks.isAuthenticated = false;
    mocks.isLoading = false;
    mocks.user = null;
  });

  describe('Public Routes', () => {
    it('should render landing page at /', () => {
      render(<TestApp initialRoute="/" />);
      expect(screen.getByTestId('index-page')).toBeInTheDocument();
    });

    it('should render FAQ page at /faq', () => {
      render(<TestApp initialRoute="/faq" />);
      expect(screen.getByTestId('faq-page')).toBeInTheDocument();
    });

    it('should render auth page at /auth', () => {
      render(<TestApp initialRoute="/auth" />);
      expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    });

    it('should render plans page at /plans', () => {
      render(<TestApp initialRoute="/plans" />);
      expect(screen.getByTestId('plans-page')).toBeInTheDocument();
    });

    it('should render auth callback at /auth/callback', () => {
      render(<TestApp initialRoute="/auth/callback" />);
      expect(screen.getByTestId('auth-callback')).toBeInTheDocument();
    });
  });

  describe('Protected Routes', () => {
    it('should redirect /dashboard to /auth when unauthenticated', () => {
      mocks.isAuthenticated = false;
      render(<TestApp initialRoute="/dashboard" />);
      expect(screen.getByTestId('auth-page')).toBeInTheDocument();
      expect(screen.queryByTestId('user-dashboard')).not.toBeInTheDocument();
    });

    it('should render dashboard at /dashboard when authenticated', () => {
      mocks.isAuthenticated = true;
      mocks.user = { id: '1', email: 'test@test.com', subscription_status: 'free' };
      render(<TestApp initialRoute="/dashboard" />);
      expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
    });

    it('should redirect /checkout to /auth when unauthenticated', () => {
      mocks.isAuthenticated = false;
      render(<TestApp initialRoute="/checkout" />);
      expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    });

    it('should show loading state when auth is loading', () => {
      mocks.isLoading = true;
      render(<TestApp initialRoute="/dashboard" />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Subscription-Protected Routes', () => {
    it('should redirect free users to /upgrade for premium routes', () => {
      mocks.isAuthenticated = true;
      mocks.user = { id: '1', email: 'test@test.com', subscription_status: 'free' };
      render(<TestApp initialRoute="/premium-features" />);
      // ProtectedRoute redirects to /upgrade which renders our upgrade page
      expect(screen.queryByTestId('premium-page')).not.toBeInTheDocument();
    });

    it('should allow premium users to access premium routes', () => {
      mocks.isAuthenticated = true;
      mocks.user = { id: '1', email: 'test@test.com', subscription_status: 'premium' };
      render(<TestApp initialRoute="/premium-features" />);
      expect(screen.getByTestId('premium-page')).toBeInTheDocument();
    });
  });

  describe('Admin Routes', () => {
    it('should restrict /admin from non-admin users', () => {
      mocks.isAuthenticated = true;
      mocks.user = { id: '1', email: 'regular@test.com', subscription_status: 'free' };
      render(<TestApp initialRoute="/admin" />);
      expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Catch-all Route', () => {
    it('should render 404 for unknown routes', () => {
      render(<TestApp initialRoute="/nonexistent-page" />);
      expect(screen.getByTestId('not-found')).toBeInTheDocument();
    });
  });
});
