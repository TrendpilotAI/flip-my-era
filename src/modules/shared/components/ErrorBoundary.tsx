import React, { Component, ErrorInfo, ReactNode, useState } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { sentryService } from '@/core/integrations/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface RouteErrorFallbackProps {
  title?: string;
  description?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export function RouteErrorFallback({
  title = 'This page hit a snag',
  description = "The page couldn't load properly. Try again, refresh, or head back home.",
}: RouteErrorFallbackProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-secondary/20">
      <Card className="max-w-xl w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => window.location.reload()} className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh this page
          </Button>
          <Button onClick={() => (window.location.href = '/')} variant="outline" className="flex-1">
            <Home className="mr-2 h-4 w-4" />
            Back to home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    try {
      sentryService.captureException(error, {
        component: 'ErrorBoundary',
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
      sentryService.addBreadcrumb({
        category: 'error-boundary',
        message: 'React error boundary caught an error',
        level: 'error',
        data: {
          errorMessage: error.message,
          errorName: error.name,
        },
      });
    } catch {
      if (import.meta.env.DEV) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
      }
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <CardTitle>Oops! Something went wrong</CardTitle>
              </div>
              <CardDescription>
                We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {import.meta.env.DEV && this.state.error && (
                <div className="p-4 bg-destructive/10 rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-destructive">Error Details (Development Only):</p>
                  <p className="text-xs font-mono text-destructive/80">{this.state.error.toString()}</p>
                  {this.state.errorInfo?.componentStack && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-destructive/60 hover:text-destructive/80">
                        Component Stack
                      </summary>
                      <pre className="mt-2 overflow-auto max-h-40 p-2 bg-background rounded text-destructive/60">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={this.handleReset} variant="default" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant="outline" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const ComponentWithBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return ComponentWithBoundary;
}

export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    throw error;
  }

  return (errorToThrow: Error) => {
    setError(errorToThrow);
  };
}
