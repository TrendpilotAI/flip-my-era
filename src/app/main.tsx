// Import React first to ensure react-vendor chunk loads before other vendor chunks
import React from 'react';
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from "@clerk/clerk-react";
import { initOpenTelemetry } from "@/core/integrations/opentelemetry";
import { initPostHog } from "@/core/integrations/posthog";
import { initSentry } from "@/core/integrations/sentry";
import App from './App.tsx'
import './index.css'

// Initialize OpenTelemetry before React renders (browser-only)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initOpenTelemetry();
  // Initialize PostHog before React renders
  initPostHog();
  // Initialize Sentry error tracking
  initSentry();
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
    <App />
  </ClerkProvider>
);