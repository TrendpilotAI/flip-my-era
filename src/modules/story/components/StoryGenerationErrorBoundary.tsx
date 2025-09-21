import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/modules/shared/components/ui/alert';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { AlertTriangle, RefreshCw, Settings } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class StoryGenerationErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Story Generation Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private getErrorMessage(error: Error): { title: string; description: string; suggestion: string } {
    const message = error.message.toLowerCase();
    
    if (message.includes('fetch') || message.includes('network')) {
      return {
        title: 'Network Connection Error',
        description: 'Unable to connect to the story generation service.',
        suggestion: 'Check your internet connection and try again.'
      };
    }
    
    if (message.includes('authentication') || message.includes('401')) {
      return {
        title: 'Authentication Error',
        description: 'You need to be signed in to generate stories.',
        suggestion: 'Please sign in and try again.'
      };
    }
    
    if (message.includes('rate limit') || message.includes('429')) {
      return {
        title: 'Rate Limit Exceeded',
        description: 'You have made too many requests recently.',
        suggestion: 'Please wait a few minutes before trying again.'
      };
    }
    
    if (message.includes('groq') || message.includes('api key')) {
      return {
        title: 'Service Configuration Error',
        description: 'The story generation service is not properly configured.',
        suggestion: 'Please check the environment configuration.'
      };
    }
    
    return {
      title: 'Story Generation Error',
      description: error.message || 'An unexpected error occurred during story generation.',
      suggestion: 'Please try again or contact support if the problem persists.'
    };
  }

  public render() {
    if (this.state.hasError) {
      const errorDetails = this.state.error ? this.getErrorMessage(this.state.error) : {
        title: 'Unknown Error',
        description: 'An unexpected error occurred.',
        suggestion: 'Please try again.'
      };

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                {errorDetails.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>
                  {errorDetails.description}
                </AlertDescription>
              </Alert>
              
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertTitle>Suggestion</AlertTitle>
                <AlertDescription>
                  {errorDetails.suggestion}
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-3 bg-gray-50 rounded text-xs">
                  <summary className="cursor-pointer font-medium">
                    Technical Details (Development)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

