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

// Mock Supabase
vi.mock('@/core/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}));

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


// Provide a default fetch mock to prevent accidental network calls
if (!(globalThis as any).fetch) {
  (globalThis as any).fetch = vi.fn();
}