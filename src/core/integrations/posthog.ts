/**
 * PostHog Analytics Integration
 * Comprehensive product analytics and user behavior tracking
 */

import posthog from 'posthog-js';

interface PostHogConfig {
  apiKey: string;
  apiHost?: string;
  enabled: boolean;
  environment?: string;
  autocapture?: boolean;
  capturePageview?: boolean;
  capturePageleave?: boolean;
  loaded?: (posthog: typeof posthog) => void;
}

class PostHogService {
  private initialized = false;
  private config: PostHogConfig | null = null;

  /**
   * Initialize PostHog analytics
   */
  init(config: PostHogConfig): void {
    if (this.initialized) {
      return;
    }

    this.config = config;

    if (!config.enabled || !config.apiKey) {
      console.debug('PostHog not configured or disabled');
      return;
    }

    try {
      posthog.init(config.apiKey, {
        api_host: config.apiHost || 'https://app.posthog.com',
        autocapture: config.autocapture ?? true,
        capture_pageview: config.capturePageview ?? true,
        capture_pageleave: config.capturePageleave ?? true,
        loaded: config.loaded || ((ph) => {
          if (import.meta.env.DEV) {
            console.log('PostHog initialized', ph);
          }
        }),
        // Privacy settings
        respect_dnt: true, // Respect Do Not Track
        opt_out_capturing_by_default: false,
        // Performance settings
        batch_size: 20,
        batch_flush_interval_ms: 10000,
        // Session recording (optional, can be enabled later)
        disable_session_recording: true, // Disable by default for privacy
        // Feature flags
        advanced_disable_decide: false,
        // Environment
        environment: config.environment || 'production',
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  }

  /**
   * Identify a user
   */
  identify(userId: string, properties?: Record<string, unknown>): void {
    if (!this.config?.enabled || !this.initialized) {
      return;
    }

    try {
      posthog.identify(userId, properties);
    } catch (error) {
      console.error('PostHog identify error:', error);
    }
  }

  /**
   * Reset user identification (on logout)
   */
  reset(): void {
    if (!this.config?.enabled || !this.initialized) {
      return;
    }

    try {
      posthog.reset();
    } catch (error) {
      console.error('PostHog reset error:', error);
    }
  }

  /**
   * Capture an event
   */
  capture(eventName: string, properties?: Record<string, unknown>): void {
    if (!this.config?.enabled || !this.initialized) {
      return;
    }

    try {
      posthog.capture(eventName, properties);
    } catch (error) {
      console.error('PostHog capture error:', error);
    }
  }

  /**
   * Set user properties
   */
  setPersonProperties(properties: Record<string, unknown>): void {
    if (!this.config?.enabled || !this.initialized) {
      return;
    }

    try {
      posthog.setPersonProperties(properties);
    } catch (error) {
      console.error('PostHog setPersonProperties error:', error);
    }
  }

  /**
   * Get feature flag value
   */
  isFeatureEnabled(featureKey: string): boolean {
    if (!this.config?.enabled || !this.initialized) {
      return false;
    }

    try {
      return posthog.isFeatureEnabled(featureKey) || false;
    } catch (error) {
      console.error('PostHog isFeatureEnabled error:', error);
      return false;
    }
  }

  /**
   * Get feature flag value with fallback
   */
  getFeatureFlag(featureKey: string, fallback?: unknown): unknown {
    if (!this.config?.enabled || !this.initialized) {
      return fallback;
    }

    try {
      return posthog.getFeatureFlag(featureKey) ?? fallback;
    } catch (error) {
      console.error('PostHog getFeatureFlag error:', error);
      return fallback;
    }
  }

  /**
   * Reload feature flags
   */
  reloadFeatureFlags(): void {
    if (!this.config?.enabled || !this.initialized) {
      return;
    }

    try {
      posthog.reloadFeatureFlags();
    } catch (error) {
      console.error('PostHog reloadFeatureFlags error:', error);
    }
  }

  /**
   * Check if PostHog is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export const posthogService = new PostHogService();

/**
 * Initialize PostHog based on environment
 */
export function initPostHog(): void {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY || import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
  const apiHost = import.meta.env.VITE_POSTHOG_HOST || import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
  const environment = import.meta.env.VITE_APP_ENV || 'production';
  const enabled = import.meta.env.VITE_POSTHOG_ENABLED !== 'false' && !!apiKey && import.meta.env.PROD; // Only enable in production

  if (!apiKey) {
    console.debug('PostHog API key not configured');
    return;
  }

  posthogService.init({
    apiKey,
    apiHost,
    enabled, // Already includes PROD check
    environment: environment as 'development' | 'staging' | 'production',
    autocapture: true,
    capturePageview: true,
    capturePageleave: true,
  });
}

/**
 * Event tracking helpers for common events
 */
export const posthogEvents = {
  // Authentication events
  userSignedUp: (properties?: Record<string, unknown>) => {
    posthogService.capture('user_signed_up', properties);
  },
  userSignedIn: (properties?: Record<string, unknown>) => {
    posthogService.capture('user_signed_in', properties);
  },
  userSignedOut: () => {
    posthogService.capture('user_signed_out');
  },

  // Wizard navigation events
  eraSelected: (era: string) => {
    posthogService.capture('era_selected', { era });
  },
  promptSelected: (promptId: string, era: string, isCustom: boolean) => {
    posthogService.capture('prompt_selected', { promptId, era, isCustom });
  },
  characterSelected: (archetypeId: string, archetypeName: string, era: string) => {
    posthogService.capture('character_selected', { archetypeId, archetypeName, era });
  },
  formatSelected: (format: string, era: string) => {
    posthogService.capture('format_selected', { format, era });
  },

  // Story generation events
  storylineGenerationStarted: (properties?: Record<string, unknown>) => {
    posthogService.capture('storyline_generation_started', properties);
  },
  storylineGenerationCompleted: (properties?: Record<string, unknown>) => {
    posthogService.capture('storyline_generation_completed', properties);
  },
  storylineGenerationFailed: (error: string, properties?: Record<string, unknown>) => {
    posthogService.capture('storyline_generation_failed', { error, ...properties });
  },
  storyGenerationStarted: (properties?: Record<string, unknown>) => {
    posthogService.capture('story_generation_started', properties);
  },
  chapterCompleted: (chapterNumber: number, totalChapters: number, properties?: Record<string, unknown>) => {
    posthogService.capture('chapter_completed', { chapterNumber, totalChapters, ...properties });
  },
  storyGenerationCompleted: (properties?: Record<string, unknown>) => {
    posthogService.capture('story_generation_completed', properties);
  },
  storyGenerationFailed: (error: string, properties?: Record<string, unknown>) => {
    posthogService.capture('story_generation_failed', { error, ...properties });
  },
  storyGenerationAborted: (properties?: Record<string, unknown>) => {
    posthogService.capture('story_generation_aborted', properties);
  },

  // E-book events
  ebookGenerationStarted: (properties?: Record<string, unknown>) => {
    posthogService.capture('ebook_generation_started', properties);
  },
  ebookGenerationCompleted: (properties?: Record<string, unknown>) => {
    posthogService.capture('ebook_generation_completed', properties);
  },
  ebookDownloaded: (properties?: Record<string, unknown>) => {
    posthogService.capture('ebook_downloaded', properties);
  },

  // Credit events
  creditsPurchased: (amount: number, credits: number, properties?: Record<string, unknown>) => {
    posthogService.capture('credits_purchased', { amount, credits, ...properties });
  },
  creditsUsed: (credits: number, purpose: string, properties?: Record<string, unknown>) => {
    posthogService.capture('credits_used', { credits, purpose, ...properties });
  },

  // Page view events (for SPA tracking)
  pageViewed: (path: string, properties?: Record<string, unknown>) => {
    posthogService.capture('$pageview', { path, ...properties });
  },

  // Error events
  errorOccurred: (error: string, component: string, properties?: Record<string, unknown>) => {
    posthogService.capture('error_occurred', { error, component, ...properties });
  },
};

