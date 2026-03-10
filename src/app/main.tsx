import React from 'react';
import { createRoot } from 'react-dom/client'
import { initPostHog } from "@/core/integrations/posthog";
import { initSentry } from "@/core/integrations/sentry";
import App from './App.tsx'
import './index.css'

// Initialize integrations before React renders (browser-only)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initPostHog();
  initSentry();
}

createRoot(document.getElementById("root")!).render(
  <App />
);
