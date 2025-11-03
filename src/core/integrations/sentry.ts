/**
 * Sentry Error Tracking Integration
 * Provides production error monitoring and performance tracking
 */

import * as Sentry from '@sentry/react';
import { browserTracingIntegration } from '@sentry/react';

interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  enabled: boolean;
  tracesSampleRate?: number;
  sendDefaultPii?: boolean;
  beforeSend?: (event: Sentry.ErrorEvent, hint?: Sentry.EventHint) => Sentry.ErrorEvent | null;
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

    // Initialize Sentry SDK
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      tracesSampleRate: config.tracesSampleRate || 0.1,
      sendDefaultPii: config.sendDefaultPii ?? false, // Default to false for privacy
      integrations: [
        browserTracingIntegration(),
      ],
      beforeSend(event, hint) {
        // Apply custom beforeSend if provided
        if (config.beforeSend) {
          return config.beforeSend(event, hint);
        }
        return event;
      },
      // Only capture errors in production
      enabled: config.enabled,
    });

    this.initialized = true;
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: Record<string, unknown>): void {
    if (!this.config?.enabled) {
      return;
    }

    Sentry.captureException(error, {
      extra: context,
      tags: {
        component: context?.component as string || 'unknown',
      },
    });
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.config?.enabled) {
      return;
    }

    const sentryLevel = level === 'info' ? 'info' : level === 'warning' ? 'warning' : 'error';
    Sentry.captureMessage(message, {
      level: sentryLevel as Sentry.SeverityLevel,
    });
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id: string; email?: string; username?: string } | null): void {
    if (!this.config?.enabled) {
      return;
    }

    Sentry.setUser(user);
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

    const sentryLevel = breadcrumb.level === 'info' ? 'info' : breadcrumb.level === 'warning' ? 'warning' : 'error';
    Sentry.addBreadcrumb({
      category: breadcrumb.category,
      message: breadcrumb.message,
      level: sentryLevel as Sentry.SeverityLevel,
      data: breadcrumb.data,
    });
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

    // Start a Sentry transaction for performance monitoring
    // Sentry v10 uses startSpan for transactions
    try {
      // Use Sentry's startSpan API (v10+)
      // Store span reference to manipulate it
      let spanRef: Sentry.Span | undefined;
      
      Sentry.startSpan(
        {
          name,
          op,
        },
        (span) => {
          spanRef = span;
          return span;
        }
      );
      
      return {
        finish: () => {
          if (spanRef && typeof (spanRef as unknown as { end?: () => void }).end === 'function') {
            (spanRef as unknown as { end: () => void }).end();
          }
        },
        setTag: (key: string, value: string) => {
          if (spanRef && typeof (spanRef as unknown as { setTag?: (k: string, v: string) => void }).setTag === 'function') {
            (spanRef as unknown as { setTag: (k: string, v: string) => void }).setTag(key, value);
          }
        },
      };
    } catch (error) {
      // If transaction creation fails, return no-op functions
      return {
        finish: () => {},
        setTag: () => {},
      };
    }
  }
}

export const sentryService = new SentryService();

/**
 * Initialize Sentry based on environment
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_APP_ENV || 'development';
  const sendDefaultPii = import.meta.env.VITE_SENTRY_SEND_DEFAULT_PII === 'true';

  if (!dsn) {
    // Sentry not configured, skip initialization
    return;
  }

  sentryService.init({
    dsn,
    environment: environment as 'development' | 'staging' | 'production',
    enabled: import.meta.env.PROD, // Only enable in production
    tracesSampleRate: 0.1, // Sample 10% of transactions
    sendDefaultPii, // Enable PII collection if configured
    beforeSend: (event, hint) => {
      // Filter out sensitive data
      if (event && typeof event === 'object') {
        const eventObj = event as unknown as Record<string, unknown>;
        
        // Remove authorization headers from request
        if (eventObj.request && typeof eventObj.request === 'object') {
          const request = eventObj.request as Record<string, unknown>;
          if (request?.headers && typeof request.headers === 'object') {
            const headers = request.headers as Record<string, unknown>;
            delete headers.authorization;
            delete headers.Authorization;
          }
        }
      }
      return event;
    },
  });
}
