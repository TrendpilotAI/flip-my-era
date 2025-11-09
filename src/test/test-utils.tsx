import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostHogProvider } from 'posthog-js/react';

// Create a custom render function that includes providers
function render(ui: React.ReactElement, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return rtlRender(
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={{
        api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
        defaults: '2025-05-24',
        capture_exceptions: true, // This enables capturing exceptions using Error Tracking, set to false if you don't want this
        debug: import.meta.env.MODE === 'development',
      }}
    >
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {ui}
        </QueryClientProvider>
      </BrowserRouter>
    </PostHogProvider>
  );
}

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { render };