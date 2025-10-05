import { vi } from 'vitest';

export const mockClerkUser = {
  id: 'user_mock_123',
  fullName: 'Mocked User',
  primaryEmailAddress: {
    emailAddress: 'mocked.user@example.com',
  },
  imageUrl: 'https://example.com/avatar.png',
  profileImageUrl: 'https://example.com/avatar.png',
  firstName: 'Mocked',
  lastName: 'User',
  publicMetadata: {},
  privateMetadata: {},
  unsafeMetadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  subscription_status: 'free' as const,
};

export const mockClerkAuth = {
  userId: mockClerkUser.id,
  sessionId: 'sess_mock_123',
  actor: null,
  orgId: null,
  orgRole: null,
  orgSlug: null,
  isLoaded: true,
  isSignedIn: true,
  signOut: vi.fn().mockResolvedValue(undefined),
  signIn: vi.fn().mockResolvedValue(undefined),
  getToken: vi.fn().mockResolvedValue('mock-jwt-token'),
  setActive: vi.fn().mockResolvedValue(undefined),
  getSessionToken: vi.fn().mockResolvedValue('mock-session-token'),
};

export const mockUseUser = {
  isLoaded: true,
  isSignedIn: true,
  user: mockClerkUser,
};

export const mockUseAuth = mockClerkAuth;

type ClerkState = {
  user: typeof mockUseUser;
  auth: typeof mockUseAuth;
};

const defaultState: ClerkState = {
  user: { ...mockUseUser },
  auth: { ...mockUseAuth },
};

const currentState: ClerkState = {
  user: { ...mockUseUser },
  auth: { ...mockUseAuth },
};

export const createMockButton = (testId: string, label: string) =>
  vi.fn(() => ({ testId, label }));

export const MockSignInButton = createMockButton('mock-sign-in', 'Sign In');
export const MockSignUpButton = createMockButton('mock-sign-up', 'Sign Up');
export const MockUserButton = vi.fn(() => ({ testId: 'mock-user-button', label: 'User' }));

export const setClerkMockState = (overrides: Partial<ClerkState>) => {
  if (overrides.user) {
    currentState.user = { ...currentState.user, ...overrides.user };
  }
  if (overrides.auth) {
    currentState.auth = { ...currentState.auth, ...overrides.auth };
  }
};

export const resetClerkMocks = () => {
  currentState.user = { ...defaultState.user };
  currentState.auth = { ...defaultState.auth };
  mockClerkAuth.signOut.mockClear();
  mockClerkAuth.signIn.mockClear();
  mockClerkAuth.getToken.mockClear().mockResolvedValue('mock-jwt-token');
  mockClerkAuth.setActive.mockClear();
  mockClerkAuth.getSessionToken.mockClear();
  MockSignInButton.mockClear();
  MockSignUpButton.mockClear();
  MockUserButton.mockClear();
};

export const setupClerkModuleMocks = () => {
  vi.doMock('@clerk/clerk-react', () => ({
    useUser: () => currentState.user,
    useAuth: () => currentState.auth,
    SignInButton: MockSignInButton,
    SignUpButton: MockSignUpButton,
    UserButton: MockUserButton,
  }));
};

