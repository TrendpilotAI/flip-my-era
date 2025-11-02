/**
 * OpenTelemetry Integration for Sentry
 * Sends traces, logs, and metrics to Sentry via OTLP endpoint
 */

import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';

/**
 * Initialize OpenTelemetry tracing for the application
 */
export function initOpenTelemetry(): void {
  // Check if OpenTelemetry should be enabled
  const otlpEndpoint = import.meta.env.VITE_OTLP_ENDPOINT;
  const enabled = import.meta.env.VITE_OTLP_ENABLED === 'true' || (import.meta.env.PROD && !!otlpEndpoint);

  if (!enabled || !otlpEndpoint) {
    // OpenTelemetry not configured, skip initialization
    console.debug('OpenTelemetry not configured or disabled');
    return;
  }

  try {
    // Extract Sentry project ID and organization from endpoint
    // Format: https://o[org-id].ingest.us.sentry.io/api/[project-id]/integration//otlp
    const urlMatch = otlpEndpoint.match(/https:\/\/([^/]+)\.ingest\.(?:us\.)?sentry\.io\/api\/(\d+)\//);
    if (!urlMatch) {
      console.warn('Invalid Sentry OTLP endpoint format');
      return;
    }

    // Create resource with service information
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'FlipMyEra',
      [SemanticResourceAttributes.SERVICE_VERSION]: import.meta.env.VITE_APP_VERSION || '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: import.meta.env.VITE_APP_ENV || 'production',
    });

    // Configure OTLP exporter for Sentry
    // Sentry's OTLP endpoint format: /api/{project-id}/integration//otlp
    // We need to append /v1/traces for the traces endpoint
    const tracesUrl = otlpEndpoint.endsWith('/') 
      ? `${otlpEndpoint}v1/traces` 
      : `${otlpEndpoint}/v1/traces`;
    
    const traceExporter = new OTLPTraceExporter({
      url: tracesUrl,
      headers: {
        // Sentry may require authentication headers
        // Add Sentry auth token if available
        ...(import.meta.env.VITE_SENTRY_AUTH_TOKEN && {
          Authorization: `Bearer ${import.meta.env.VITE_SENTRY_AUTH_TOKEN}`,
        }),
        'Content-Type': 'application/json',
      },
      // Compression is recommended for production
      compression: 'gzip',
    });

    // Create tracer provider
    const tracerProvider = new WebTracerProvider({
      resource,
    });

    // Add span processor (batch processing for better performance)
    tracerProvider.addSpanProcessor(
      new BatchSpanProcessor(traceExporter, {
        maxExportBatchSize: 512,
        exportTimeoutMillis: 30000,
        scheduledDelayMillis: 5000,
      })
    );

    // Register the provider globally
    tracerProvider.register();

    // Register auto-instrumentations
    registerInstrumentations({
      instrumentations: [
        // HTTP fetch instrumentation
        new FetchInstrumentation({
          propagateTraceHeaderCorsUrls: [
            /.*/, // Instrument all fetch requests
          ],
          clearTimingResources: true,
        }),
        // XMLHttpRequest instrumentation
        new XMLHttpRequestInstrumentation({
          propagateTraceHeaderCorsUrls: [
            /.*/, // Instrument all XHR requests
          ],
        }),
        // Document load instrumentation (page load performance)
        new DocumentLoadInstrumentation(),
        // User interaction instrumentation (click, keyboard events)
        new UserInteractionInstrumentation({
          enabled: true,
        }),
      ],
    });

    console.debug('OpenTelemetry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize OpenTelemetry:', error);
    // Don't throw - allow app to continue even if telemetry fails
  }
}

// Re-export tracer for convenience
export { trace } from '@opentelemetry/api';

/**
 * Helper to get a tracer instance
 * Use this for manual instrumentation in your code
 * 
 * @example
 * ```typescript
 * import { getTracer } from '@/core/integrations/opentelemetry';
 * 
 * const tracer = getTracer('my-service');
 * tracer.startActiveSpan('my-operation', (span) => {
 *   // Your code here
 *   span.end();
 * });
 * ```
 */
export function getTracer(name: string, version?: string) {
  try {
    const { trace } = require('@opentelemetry/api');
    return trace.getTracer(name, version);
  } catch (error) {
    // Return a no-op tracer if OpenTelemetry is not available
    // This happens if OpenTelemetry failed to initialize or is disabled
    const noOpSpan = {
      setAttribute: () => {},
      end: () => {},
      setStatus: () => {},
      recordException: () => {},
    };
    
    return {
      startSpan: (_name: string) => noOpSpan,
      startActiveSpan: (_name: string, _fn: (span: typeof noOpSpan) => void | Promise<void>) => {
        try {
          const result = _fn(noOpSpan);
          if (result instanceof Promise) {
            result.catch(() => {});
          }
        } catch (e) {
          // Ignore errors in no-op mode
        }
      },
    };
  }
}
