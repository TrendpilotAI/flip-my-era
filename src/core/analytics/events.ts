/**
 * Typed Analytics Event Helpers
 * Centralized funnel event tracking built on PostHog
 */

import { posthogService } from '@/core/integrations/posthog';

// ─── Event Names ───────────────────────────────────────────────
export const ANALYTICS_EVENTS = {
  // Navigation
  PAGE_VIEW: 'page_view',

  // Auth funnel
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN_COMPLETED: 'login_completed',

  // Ebook creation funnel
  EBOOK_CREATE_STARTED: 'ebook_create_started',
  EBOOK_CREATE_COMPLETED: 'ebook_create_completed',

  // Checkout funnel
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_COMPLETED: 'checkout_completed',

  // Credits
  CREDITS_PURCHASED: 'credits_purchased',
  CREDITS_USED: 'credits_used',

  // Experiments
  EXPERIMENT_VIEWED: '$experiment_viewed',
  EXPERIMENT_CONVERTED: '$experiment_converted',
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

// ─── Typed Helpers ─────────────────────────────────────────────

export function trackPageView(path: string, props?: Record<string, unknown>) {
  posthogService.capture(ANALYTICS_EVENTS.PAGE_VIEW, { path, ...props });
}

export function trackSignupStarted(method: 'email' | 'google' | 'github' = 'email') {
  posthogService.capture(ANALYTICS_EVENTS.SIGNUP_STARTED, { method });
}

export function trackSignupCompleted(userId: string, method?: string) {
  posthogService.capture(ANALYTICS_EVENTS.SIGNUP_COMPLETED, { userId, method });
}

export function trackLoginCompleted(userId: string) {
  posthogService.capture(ANALYTICS_EVENTS.LOGIN_COMPLETED, { userId });
}

export function trackEbookCreateStarted(props?: { era?: string; format?: string }) {
  posthogService.capture(ANALYTICS_EVENTS.EBOOK_CREATE_STARTED, props);
}

export function trackEbookCreateCompleted(props?: { era?: string; format?: string; chapters?: number }) {
  posthogService.capture(ANALYTICS_EVENTS.EBOOK_CREATE_COMPLETED, props);
}

export function trackCheckoutStarted(props: { plan?: string; amount?: number; credits?: number }) {
  posthogService.capture(ANALYTICS_EVENTS.CHECKOUT_STARTED, props);
}

export function trackCheckoutCompleted(props: { plan?: string; amount?: number; credits?: number; transactionId?: string }) {
  posthogService.capture(ANALYTICS_EVENTS.CHECKOUT_COMPLETED, props);
}

export function trackCreditsPurchased(amount: number, credits: number) {
  posthogService.capture(ANALYTICS_EVENTS.CREDITS_PURCHASED, { amount, credits });
}

export function trackCreditsUsed(credits: number, purpose: string) {
  posthogService.capture(ANALYTICS_EVENTS.CREDITS_USED, { credits, purpose });
}
