import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { useClerkAuth } from '@/modules/auth/contexts';

// Mock the auth context
vi.mock('@/modules/auth/contexts', () => ({
  useClerkAuth: vi.fn(),
}));
const mockUseClerkAuth = useClerkAuth as ReturnType<typeof vi.fn>;

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to, state }: { to: string; state?: any }) => (
      <div data-testid="navigate" data-to={to} data-state={JSON.stringify(state)}>
        Redirecting to {to}
      </div>
    ),
    useLocation: () => ({ pathname: '/dashboard' })
  };
});

const TestComponent = () => <div>Protected Content</div>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state when authentication is loading', () => {
    mockUseClerkAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      signIn: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
      refreshUser: vi.fn().mockResolvedValue(undefined),
      fetchCreditBalance: vi.fn().mockResolvedValue(0),
      getToken: vi.fn().mockResolvedValue(null),
      isNewUser: false,
      setIsNewUser: vi.fn(),
      SignInButton: vi.fn(),
      SignUpButton: vi.fn(),
      UserButton: vi.fn()
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to auth when not authenticated', () => {
    mockUseClerkAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      signIn: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
      refreshUser: vi.fn().mockResolvedValue(undefined),
      fetchCreditBalance: vi.fn().mockResolvedValue(0),
      getToken: vi.fn().mockResolvedValue(null),
      isNewUser: false,
      setIsNewUser: vi.fn(),
      SignInButton: vi.fn(),
      SignUpButton: vi.fn(),
      UserButton: vi.fn()
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/auth');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when authenticated', () => {
    mockUseClerkAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '123', email: 'test@example.com' },
      signIn: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
      refreshUser: vi.fn().mockResolvedValue(undefined),
      fetchCreditBalance: vi.fn().mockResolvedValue(100),
      getToken: vi.fn().mockResolvedValue('mock-token'),
      isNewUser: false,
      setIsNewUser: vi.fn(),
      SignInButton: vi.fn(),
      SignUpButton: vi.fn(),
      UserButton: vi.fn()
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('should allow access for free subscription when no requirement', () => {
    mockUseClerkAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { 
        id: '123', 
        email: 'test@example.com',
        subscription_status: 'free'
      },
      signIn: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
      refreshUser: vi.fn().mockResolvedValue(undefined),
      fetchCreditBalance: vi.fn().mockResolvedValue(100),
      getToken: vi.fn().mockResolvedValue('mock-token'),
      isNewUser: false,
      setIsNewUser: vi.fn(),
      SignInButton: vi.fn(),
      SignUpButton: vi.fn(),
      UserButton: vi.fn()
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should allow access for basic subscription when basic required', () => {
    mockUseClerkAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { 
        id: '123', 
        email: 'test@example.com',
        subscription_status: 'basic'
      },
      signIn: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
      refreshUser: vi.fn().mockResolvedValue(undefined),
      fetchCreditBalance: vi.fn().mockResolvedValue(100),
      getToken: vi.fn().mockResolvedValue('mock-token'),
      isNewUser: false,
      setIsNewUser: vi.fn(),
      SignInButton: vi.fn(),
      SignUpButton: vi.fn(),
      UserButton: vi.fn()
    });

    render(
      <BrowserRouter>
        <ProtectedRoute requiredSubscription="basic">
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should allow access for premium subscription when basic required', () => {
    mockUseClerkAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { 
        id: '123', 
        email: 'test@example.com',
        subscription_status: 'premium'
      },
      signIn: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
      refreshUser: vi.fn().mockResolvedValue(undefined),
      fetchCreditBalance: vi.fn().mockResolvedValue(100),
      getToken: vi.fn().mockResolvedValue('mock-token'),
      isNewUser: false,
      setIsNewUser: vi.fn(),
      SignInButton: vi.fn(),
      SignUpButton: vi.fn(),
      UserButton: vi.fn()
    });

    render(
      <BrowserRouter>
        <ProtectedRoute requiredSubscription="basic">
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to upgrade when subscription level is insufficient', () => {
    mockUseClerkAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { 
        id: '123', 
        email: 'test@example.com',
        subscription_status: 'free'
      },
      signIn: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
      refreshUser: vi.fn().mockResolvedValue(undefined),
      fetchCreditBalance: vi.fn().mockResolvedValue(100),
      getToken: vi.fn().mockResolvedValue('mock-token'),
      isNewUser: false,
      setIsNewUser: vi.fn(),
      SignInButton: vi.fn(),
      SignUpButton: vi.fn(),
      UserButton: vi.fn()
    });

    render(
      <BrowserRouter>
        <ProtectedRoute requiredSubscription="premium">
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/upgrade');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to upgrade when subscription level is basic but premium required', () => {
    mockUseClerkAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { 
        id: '123', 
        email: 'test@example.com',
        subscription_status: 'basic'
      },
      signIn: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
      refreshUser: vi.fn().mockResolvedValue(undefined),
      fetchCreditBalance: vi.fn().mockResolvedValue(100),
      getToken: vi.fn().mockResolvedValue('mock-token'),
      isNewUser: false,
      setIsNewUser: vi.fn(),
      SignInButton: vi.fn(),
      SignUpButton: vi.fn(),
      UserButton: vi.fn()
    });

    render(
      <BrowserRouter>
        <ProtectedRoute requiredSubscription="premium">
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/upgrade');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should handle undefined subscription status as free', () => {
    mockUseClerkAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { 
        id: '123', 
        email: 'test@example.com'
        // subscription_status is undefined
      },
      signIn: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
      refreshUser: vi.fn().mockResolvedValue(undefined),
      fetchCreditBalance: vi.fn().mockResolvedValue(100),
      getToken: vi.fn().mockResolvedValue('mock-token'),
      isNewUser: false,
      setIsNewUser: vi.fn(),
      SignInButton: vi.fn(),
      SignUpButton: vi.fn(),
      UserButton: vi.fn()
    });

    render(
      <BrowserRouter>
        <ProtectedRoute requiredSubscription="premium">
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/upgrade');
  });

  it('should preserve location state when redirecting', () => {
    mockUseClerkAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      signIn: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
      refreshUser: vi.fn().mockResolvedValue(undefined),
      fetchCreditBalance: vi.fn().mockResolvedValue(0),
      getToken: vi.fn().mockResolvedValue(null),
      isNewUser: false,
      setIsNewUser: vi.fn(),
      SignInButton: vi.fn(),
      SignUpButton: vi.fn(),
      UserButton: vi.fn()
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    const navigateElement = screen.getByTestId('navigate');
    const state = JSON.parse(navigateElement.getAttribute('data-state') || '{}');
    expect(state.from).toEqual({ pathname: '/dashboard' });
  });

  it('should render multiple children correctly', () => {
    mockUseClerkAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '123', email: 'test@example.com' },
      signIn: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
      refreshUser: vi.fn().mockResolvedValue(undefined),
      fetchCreditBalance: vi.fn().mockResolvedValue(100),
      getToken: vi.fn().mockResolvedValue('mock-token'),
      isNewUser: false,
      setIsNewUser: vi.fn(),
      SignInButton: vi.fn(),
      SignUpButton: vi.fn(),
      UserButton: vi.fn()
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Child 1</div>
          <div>Child 2</div>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
