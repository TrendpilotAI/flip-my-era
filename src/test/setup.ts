import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
const mockResizeObserver = vi.fn();
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.ResizeObserver = mockResizeObserver;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  }
});

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState = MockWebSocket.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {
    // Mock implementation
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

Object.defineProperty(global, 'WebSocket', {
  value: MockWebSocket
});

// Mock fetch
global.fetch = vi.fn();

// Mock environment variables
vi.stubEnv('VITE_GROQ_API_KEY', 'gsk_test123456789');
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-key');
vi.stubEnv('VITE_RUNWARE_PROXY_URL', '/api/functions/runware-proxy');
vi.stubEnv('VITE_OPENAI_API_KEY', 'test-openai-key');

const supabaseAuthMock = {
  getUser: vi.fn(),
  signOut: vi.fn(),
  signInWithIdToken: vi.fn(),
  getSession: vi.fn(),
};

const supabaseSelectMock = vi.fn(() => ({
  eq: vi.fn(() => ({
    single: vi.fn(),
  })),
  single: vi.fn(),
}));

const supabaseInsertMock = vi.fn(() => ({
  select: vi.fn(() => ({
    single: vi.fn(),
  })),
}));

const supabaseUpdateMock = vi.fn(() => ({
  eq: vi.fn(),
}));

const supabaseFromMock = vi.fn(() => ({
  select: supabaseSelectMock,
  insert: supabaseInsertMock,
  update: supabaseUpdateMock,
  delete: vi.fn(() => ({ eq: vi.fn() })),
}));

const supabaseClientMock = {
  auth: supabaseAuthMock,
  from: supabaseFromMock,
  functions: {
    invoke: vi.fn(),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/mock.jpg' } })),
    })),
  },
};

const createSupabaseClientWithClerkTokenMock = vi.fn(() => supabaseClientMock);
const getSupabaseSessionMock = vi.fn();
const signOutFromSupabaseMock = vi.fn();

vi.mock('@/core/integrations/supabase/client', () => ({
  supabase: supabaseClientMock,
  getSupabaseSession: getSupabaseSessionMock,
  signOutFromSupabase: signOutFromSupabaseMock,
  createSupabaseClientWithClerkToken: createSupabaseClientWithClerkTokenMock,
}));

/* eslint-disable @typescript-eslint/no-explicit-any */
export const __testSupabaseMocks__ = {
  supabase: supabaseClientMock,
  createSupabaseClientWithClerkTokenMock,
  getSupabaseSessionMock,
  signOutFromSupabaseMock,
  supabaseAuthMock,
  supabaseFromMock,
  supabaseSelectMock,
  supabaseInsertMock,
  supabaseUpdateMock,
};

// Mock Runware module with constructor-based service and exported constants
vi.mock('@/modules/shared/utils/runware', () => {
  class MockRunwareService {
    isConfigured = vi.fn(() => false);
    isConnected = vi.fn(async () => false);
    generateEbookIllustration = vi.fn(async () => ({ imageURL: '' }));
    generateTaylorSwiftIllustration = vi.fn(async () => ({ imageURL: '' }));
    generateImage = vi.fn(async () => ({ imageURL: '' }));
  }

  return {
    RunwareService: MockRunwareService,
    RUNWARE_MODELS: { FLUX_1_1_PRO: 'FLUX_1_1_PRO' },
    RUNWARE_SCHEDULERS: { FLOW_MATCH_EULER_DISCRETE: 'FLOW_MATCH_EULER_DISCRETE' },
    createEbookIllustrationPrompt: vi.fn(() => 'illustration prompt'),
    enhancePromptWithGroq: vi.fn(async (p: any) => 'enhanced ' + JSON.stringify(p)),
  };
});

// Mock Groq
vi.mock('@/modules/shared/utils/groq', () => ({
  generateWithGroq: vi.fn(),
}));

// Mock AI Services
vi.mock('@/modules/story/services/ai', () => ({
  generateStory: vi.fn(),
  generateChapters: vi.fn(),
  generateImage: vi.fn(),
  generateEbookIllustration: vi.fn(),
  generateTaylorSwiftChapters: vi.fn(),
  generateTaylorSwiftIllustration: vi.fn(),
  generateName: vi.fn(),
  generateAlternativeName: vi.fn(),
  isRunwareAvailable: vi.fn(),
}));

// Mock story persistence
vi.mock('@/modules/story/utils/storyPersistence', () => ({
  saveStory: vi.fn(),
  getLocalStory: vi.fn(),
  getUserPreferences: vi.fn()
}));

// Mock gender utils
vi.mock('@/modules/user/utils/genderUtils', () => ({
  detectGender: vi.fn(),
  transformName: vi.fn()
}));

// Mock star signs
vi.mock('@/modules/user/utils/starSigns', () => ({
  getStarSign: vi.fn()
}));

// Mock story prompts
vi.mock('@/modules/story/utils/storyPrompts', () => ({
  getRandomViralTropes: vi.fn(() => ['trope1', 'trope2']),
  getRandomSceneSettings: vi.fn(() => ['setting1', 'setting2']),
  generateStoryPrompt: vi.fn(() => 'Generated prompt')
}));

// Mock toast hook
vi.mock('@/modules/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(() => ({ dismiss: vi.fn() }))
  })
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/test' })
  };
});

// Provide a default fetch mock to prevent accidental network calls
if (!(globalThis as any).fetch) {
  (globalThis as any).fetch = vi.fn();
}

// Mock PostHogProvider to prevent actual PostHog initialization in tests
vi.mock('posthog-js/react', () => ({
  PostHogProvider: ({ children }: any) => children,
}));