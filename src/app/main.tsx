import React from 'react';
import { createRoot } from 'react-dom/client'
import { initOpenTelemetry } from "@/core/integrations/opentelemetry";
import { initPostHog } from "@/core/integrations/posthog";
import { initSentry } from "@/core/integrations/sentry";
import App from './App.tsx'
import './index.css'

// Initialize OpenTelemetry before React renders (browser-only)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initOpenTelemetry();
  initPostHog();
  initSentry();
}

createRoot(document.getElementById("root")!).render(
  <App />
);
