/**
 * Performance monitoring utilities
 * Tracks Core Web Vitals and custom performance metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  /**
   * Initialize performance monitoring
   */
  init(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Monitor Core Web Vitals
      this.observeCoreWebVitals();
      
      // Monitor navigation timing
      this.observeNavigationTiming();
      
      // Monitor resource timing
      this.observeResourceTiming();
    } catch (error) {
      // Performance monitoring unavailable
    }
  }

  /**
   * Observe Core Web Vitals (LCP, FID, CLS)
   */
  private observeCoreWebVitals(): void {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        this.recordMetric('LCP', lastEntry.startTime, 'ms');
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('FID', entry.processingStart - entry.startTime, 'ms');
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        this.recordMetric('CLS', clsValue, 'score');
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      // Core Web Vitals not supported
    }
  }

  /**
   * Observe navigation timing
   */
  private observeNavigationTiming(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceNavigationTiming) => {
          // Time to First Byte (TTFB)
          this.recordMetric('TTFB', entry.responseStart - entry.requestStart, 'ms');
          
          // DOM Content Loaded
          this.recordMetric('DOMContentLoaded', entry.domContentLoadedEventEnd - entry.navigationStart, 'ms');
          
          // Load Complete
          this.recordMetric('LoadComplete', entry.loadEventEnd - entry.navigationStart, 'ms');
        });
      });
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      // Navigation timing not supported
    }
  }

  /**
   * Observe resource timing for key resources
   */
  private observeResourceTiming(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceResourceTiming) => {
          // Track large resources
          if (entry.transferSize > 100000) { // > 100KB
            this.recordMetric(`Resource-${entry.name}`, entry.responseEnd - entry.startTime, 'ms', {
              size: entry.transferSize,
              type: entry.initiatorType,
            });
          }
        });
      });
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      // Resource timing not supported
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(name: string, value: number, unit: string, metadata?: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Send to analytics/error tracking in production (fire-and-forget)
    if (import.meta.env.PROD) {
      // Use dynamic import asynchronously to avoid blocking
      import('@/core/integrations/sentry')
        .then(({ sentryService }) => {
          sentryService.addBreadcrumb({
            category: 'performance',
            message: `${name}: ${value}${unit}`,
            level: 'info',
            data: metadata,
          });
        })
        .catch(() => {
          // Sentry not available, ignore
        });
    }
  }

  /**
   * Measure custom operation
   */
  measureOperation<T>(name: string, operation: () => T): T {
    const start = performance.now();
    try {
      const result = operation();
      const duration = performance.now() - start;
      this.recordMetric(`Custom-${name}`, duration, 'ms');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`Custom-${name}-Error`, duration, 'ms');
      throw error;
    }
  }

  /**
   * Measure async operation
   */
  async measureAsyncOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      this.recordMetric(`Custom-${name}`, duration, 'ms');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`Custom-${name}-Error`, duration, 'ms');
      throw error;
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  // Initialize after page load
  if (document.readyState === 'complete') {
    performanceMonitor.init();
  } else {
    window.addEventListener('load', () => {
      performanceMonitor.init();
    });
  }
}
