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
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock Runware Service
vi.mock('@/utils/runware', () => ({
  RunwareService: {
    getInstance: vi.fn(),
  },
}));

// Mock Groq
vi.mock('@/utils/groq', () => ({
  generateWithGroq: vi.fn(),
}));

// Mock AI Services
vi.mock('@/services/ai', () => ({
  generateChapters: vi.fn(),
  generateImage: vi.fn(),
})); 