/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"development"',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    deps: {
      optimizer: {
        web: {
          include: ['react/jsx-dev-runtime', 'react/jsx-runtime'],
        },
      },
    },
    // Optimize test performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Prevent timer/mock pollution across threads
        minThreads: 1,
        maxThreads: 1,
      },
    },
    // Test timeout - increased to handle exponential backoff in retry tests
    testTimeout: 15000,
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/__tests__/**',
        '**/__mocks__/**',
        'dist/',
        'coverage/',
        '*.config.{ts,js}',
        'src/vite-env.d.ts',
        'supabase/**',
        'scripts/**',
        'e2e/**',
      ],
      // Coverage thresholds — raise as tests are added
      thresholds: {
        lines: 10,
        functions: 20,
        branches: 40,
        statements: 10,
      },
      // Report uncovered lines
      reportOnFailure: true,
    },
    // Exclude patterns
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/e2e/**',
    ],
    // Include patterns
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Retry flaky tests
    retry: 1,
    // Bail on first failure in CI
    bail: process.env.CI ? 1 : 0,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
    },
  },
}); 