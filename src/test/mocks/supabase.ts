import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabaseClient = {
  from: vi.fn((table: string) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  })),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    signInWithOAuth: vi.fn().mockResolvedValue({ data: null, error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: null, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: null, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
  storage: {
    from: vi.fn((bucket: string) => ({
      upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      download: vi.fn().mockResolvedValue({ data: null, error: null }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file' } }),
    })),
  },
  channel: vi.fn((name: string) => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn().mockReturnThis(),
  })),
};

// Mock profile data
export const mockProfile = {
  id: 'user_test123',
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  subscription_status: 'free' as const,
  created_at: '2024-01-01T00:00:00Z',
  credits: 100,
};

// Mock story data
export const mockStory = {
  id: 'story_test123',
  user_id: 'user_test123',
  title: 'Test Story',
  content: 'This is a test story content.',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  is_public: false,
  tags: ['test', 'story'],
};

// Mock credit transaction
export const mockCreditTransaction = {
  id: 'transaction_test123',
  user_id: 'user_test123',
  amount: -10,
  balance_after: 90,
  description: 'Story generation',
  created_at: '2024-01-01T00:00:00Z',
};

// Helper to setup Supabase responses
export const setupSupabaseResponses = (overrides: any = {}) => {
  const client = { ...mockSupabaseClient };
  
  // Override specific methods if needed
  if (overrides.profile) {
    client.from = vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          ...mockSupabaseClient.from(table),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: overrides.profile, 
            error: null 
          }),
        };
      }
      return mockSupabaseClient.from(table);
    });
  }
  
  if (overrides.stories) {
    client.from = vi.fn((table: string) => {
      if (table === 'stories') {
        return {
          ...mockSupabaseClient.from(table),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ 
            data: overrides.stories, 
            error: null 
          }),
        };
      }
      return mockSupabaseClient.from(table);
    });
  }
  
  if (overrides.credits) {
    client.functions.invoke = vi.fn((functionName: string) => {
      if (functionName === 'credits') {
        return Promise.resolve({ 
          data: { balance: overrides.credits }, 
          error: null 
        });
      }
      return mockSupabaseClient.functions.invoke(functionName);
    });
  }
  
  return client;
};

// Setup Supabase mocks for tests
export const setupSupabaseMocks = () => {
  vi.mock('@/core/integrations/supabase/client', () => ({
    supabase: mockSupabaseClient,
    getSupabaseSession: vi.fn().mockResolvedValue(null),
    signOutFromSupabase: vi.fn().mockResolvedValue(undefined),
    createSupabaseClientWithClerkToken: vi.fn().mockReturnValue(mockSupabaseClient),
  }));
  
  vi.mock('@/integrations/supabase/client', () => ({
    supabase: mockSupabaseClient,
  }));
};