/**
 * Sentry Error Tracking Integration
 * Provides production error monitoring and performance tracking
 */

// Sentry will be initialized here once package is added
// For now, we'll create a stub implementation

interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  enabled: boolean;
  tracesSampleRate?: number;
  beforeSend?: (event: unknown) => unknown | null;
}

class SentryService {
  private initialized = false;
  private config: SentryConfig | null = null;

  /**
   * Initialize Sentry error tracking
   */
  init(config: SentryConfig): void {
    if (this.initialized) {
      return;
    }

    this.config = config;

    if (!config.enabled) {
      return;
    }

    // TODO: Initialize Sentry SDK once @sentry/react is added
    // Example:
    // import * as Sentry from '@sentry/react';
    // Sentry.init({
    //   dsn: config.dsn,
    //   environment: config.environment,
    //   tracesSampleRate: config.tracesSampleRate || 0.1,
    //   beforeSend: config.beforeSend,
    //   integrations: [
    //     new Sentry.BrowserTracing(),
    //     new Sentry.Replay(),
    //   ],
    // });

    this.initialized = true;
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: Record<string, unknown>): void {
    if (!this.config?.enabled) {
      return;
    }

    // TODO: Implement with Sentry SDK
    // Sentry.captureException(error, { extra: context });
    
    // For now, log to console in development only
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[Sentry] Would capture:', error, context);
    }
    // In production, this will be sent to Sentry once SDK is installed
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.config?.enabled) {
      return;
    }

    // TODO: Implement with Sentry SDK
    // Sentry.captureMessage(message, level);
    
    // For now, log to console in development only
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(`[Sentry ${level}]`, message);
    }
    // In production, this will be sent to Sentry once SDK is installed
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id: string; email?: string; username?: string } | null): void {
    if (!this.config?.enabled) {
      return;
    }

    // TODO: Implement with Sentry SDK
    // Sentry.setUser(user);
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: {
    category: string;
    message: string;
    level?: 'info' | 'warning' | 'error';
    data?: Record<string, unknown>;
  }): void {
    if (!this.config?.enabled) {
      return;
    }

    // TODO: Implement with Sentry SDK
    // Sentry.addBreadcrumb(breadcrumb);
  }

  /**
   * Start a performance transaction
   */
  startTransaction(name: string, op: string): {
    finish: () => void;
    setTag: (key: string, value: string) => void;
  } {
    if (!this.config?.enabled) {
      return {
        finish: () => {},
        setTag: () => {},
      };
    }

    // TODO: Implement with Sentry SDK
    // return Sentry.startTransaction({ name, op });
    
    return {
      finish: () => {},
      setTag: () => {},
    };
  }
}

export const sentryService = new SentryService();

/**
 * Initialize Sentry based on environment
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_APP_ENV || 'development';

  if (!dsn) {
    // Sentry not configured, skip initialization
    return;
  }

  sentryService.init({
    dsn,
    environment: environment as 'development' | 'staging' | 'production',
    enabled: import.meta.env.PROD, // Only enable in production
    tracesSampleRate: 0.1, // Sample 10% of transactions
    beforeSend: (event) => {
      // Filter out sensitive data
      if (event && typeof event === 'object' && 'request' in event) {
        const request = event.request as Record<string, unknown>;
        if (request?.headers) {
          // Remove authorization headers
          delete (request.headers as Record<string, unknown>).authorization;
          delete (request.headers as Record<string, unknown>).Authorization;
        }
      }
      return event;
    },
  });
}
