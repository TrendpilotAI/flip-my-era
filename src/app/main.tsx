import { createRoot } from 'react-dom/client'
import { ClerkProvider } from "@clerk/clerk-react";
import { initOpenTelemetry } from "@/core/integrations/opentelemetry";
import App from './App.tsx'
import './index.css'

// Initialize OpenTelemetry before React renders
// This ensures all traces are captured from the start
initOpenTelemetry();

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
    <App />
  </ClerkProvider>
);
