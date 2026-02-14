import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostHogProvider } from 'posthog-js/react';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  queryClient?: QueryClient;
}

function render(ui: React.ReactElement, options: CustomRenderOptions = {}) {
  const { route = '/', queryClient, ...renderOptions } = options;
  window.history.pushState({}, 'Test page', route);

  const client = queryClient ?? createTestQueryClient();

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={{
        api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
        defaults: '2025-05-24',
        capture_exceptions: true,
        debug: import.meta.env.MODE === 'development',
      }}
    >
      <BrowserRouter>
        <QueryClientProvider client={client}>
          {children}
        </QueryClientProvider>
      </BrowserRouter>
    </PostHogProvider>
  );

  return {
    user: userEvent.setup(),
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { render, createTestQueryClient };
