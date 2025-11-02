/**
 * Production-safe logging utility
 * Only logs in development mode to avoid exposing sensitive information in production
 */

type LogLevel = 'log' | 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  private shouldLog(level: LogLevel): boolean {
    // Always log errors in production (for error tracking services)
    if (level === 'error') {
      return true;
    }
    // Only log other levels in development
    return this.isDevelopment;
  }

  log(...args: unknown[]): void {
    if (this.shouldLog('log')) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  }

  error(...args: unknown[]): void {
    // Always log errors (they'll be picked up by error tracking)
    // eslint-disable-next-line no-console
    console.error(...args);
    
    // In production, send to error tracking service
    if (this.isProduction) {
      // TODO: Integrate with Sentry or similar
      // Sentry.captureException(new Error(args.join(' ')));
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.info(...args);
    }
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.debug(...args);
    }
  }
}

export const logger = new Logger();
