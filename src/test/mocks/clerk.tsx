import { vi } from 'vitest';

// Mock Clerk user object
export const mockClerkUser = {
  id: 'user_test123',
  primaryEmailAddress: {
    emailAddress: 'test@example.com',
  },
  fullName: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  imageUrl: 'https://example.com/avatar.jpg',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// Mock Clerk auth object
export const mockClerkAuth = {
  userId: 'user_test123',
  sessionId: 'session_test123',
  getToken: vi.fn().mockResolvedValue('mock-jwt-token'),
  signOut: vi.fn().mockResolvedValue(undefined),
};

// Mock useUser hook
export const mockUseUser = {
  user: mockClerkUser,
  isLoaded: true,
  isSignedIn: true,
};

// Mock useAuth hook
export const mockUseAuth = {
  ...mockClerkAuth,
  isLoaded: true,
  isSignedIn: true,
};

// Create mock Clerk provider
export const createMockClerkProvider = (overrides = {}) => {
  return {
    user: { ...mockClerkUser, ...overrides.user },
    auth: { ...mockClerkAuth, ...overrides.auth },
    isLoaded: overrides.isLoaded ?? true,
    isSignedIn: overrides.isSignedIn ?? true,
  };
};

// Mock Clerk components
export const MockSignInButton = ({ children, ...props }: any) => (
  <button data-testid="sign-in-button" {...props}>
    {children || 'Sign In'}
  </button>
);

export const MockSignUpButton = ({ children, ...props }: any) => (
  <button data-testid="sign-up-button" {...props}>
    {children || 'Sign Up'}
  </button>
);

export const MockUserButton = (props: any) => (
  <button data-testid="user-button" {...props}>
    User Menu
  </button>
);

// Setup Clerk mocks for tests
export const setupClerkMocks = () => {
  vi.mock('@clerk/clerk-react', () => ({
    useUser: () => mockUseUser,
    useAuth: () => mockUseAuth,
    SignInButton: MockSignInButton,
    SignUpButton: MockSignUpButton,
    UserButton: MockUserButton,
    ClerkProvider: ({ children }: any) => children,
    SignedIn: ({ children }: any) => (mockUseAuth.isSignedIn ? children : null),
    SignedOut: ({ children }: any) => (!mockUseAuth.isSignedIn ? children : null),
  }));
};