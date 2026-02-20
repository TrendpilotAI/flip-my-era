/**
 * Shared user/profile/credit mock factory.
 */

export function createMockProfile(overrides = {}) {
  return {
    id: 'user_test_123',
    email: 'test@example.com',
    name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    subscription_status: 'free' as const,
    created_at: '2025-01-01T00:00:00Z',
    credits: 100,
    ...overrides,
  };
}

export function createMockCreditBalance(balance = 100) {
  return {
    success: true,
    data: { balance },
  };
}

export function createMockCreditTransaction(overrides = {}) {
  return {
    id: 'txn_test_123',
    user_id: 'user_test_123',
    amount: 10,
    type: 'purchase' as const,
    description: 'Credit pack purchase',
    created_at: '2025-01-15T00:00:00Z',
    ...overrides,
  };
}
