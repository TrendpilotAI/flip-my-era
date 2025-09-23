import { useState, useEffect } from 'react';
import { getEnvVar } from '@/modules/shared/utils/env';
import { Alert, AlertDescription, AlertTitle } from '@/modules/shared/components/ui/alert';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface EnvironmentCheck {
  name: string;
  key: string;
  required: boolean;
  status: 'missing' | 'present' | 'invalid';
  description: string;
}

export const EnvironmentValidator = () => {
  const [checks, setChecks] = useState<EnvironmentCheck[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const environmentChecks: Omit<EnvironmentCheck, 'status'>[] = [
    {
      name: 'Groq API Key',
      key: 'VITE_GROQ_API_KEY',
      required: true,
      description: 'Required for AI story generation'
    },
    {
      name: 'Supabase URL',
      key: 'VITE_SUPABASE_URL',
      required: true,
      description: 'Required for backend services'
    },
    {
      name: 'Supabase Anon Key',
      key: 'VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
      required: true,
      description: 'Required for database access'
    },
    {
      name: 'Clerk Publishable Key',
      key: 'VITE_CLERK_PUBLISHABLE_KEY',
      required: true,
      description: 'Required for user authentication'
    },
    {
      name: 'OpenAI API Key',
      key: 'VITE_OPENAI_API_KEY',
      required: false,
      description: 'Optional fallback for AI services'
    },
    {
      name: 'Runware API Key',
      key: 'VITE_RUNWARE_API_KEY',
      required: false,
      description: 'Optional for image generation'
    }
  ];

  const validateEnvironment = async () => {
    setIsValidating(true);
    
    const results = environmentChecks.map(check => {
      const value = getEnvVar(check.key);
      let status: EnvironmentCheck['status'] = 'missing';
      
      if (value) {
        status = 'present';
        
        // Additional validation for specific keys
        if (check.key === 'VITE_GROQ_API_KEY' && !value.startsWith('gsk_')) {
          status = 'invalid';
        } else if (check.key === 'VITE_SUPABASE_URL' && !value.startsWith('https://')) {
          status = 'invalid';
        } else if (check.key === 'VITE_CLERK_PUBLISHABLE_KEY' && !value.startsWith('pk_')) {
          status = 'invalid';
        }
      }
      
      return {
        ...check,
        status
      };
    });

    setChecks(results);
    setIsValidating(false);
  };

  useEffect(() => {
    validateEnvironment();
  }, []);

  const getStatusIcon = (status: EnvironmentCheck['status']) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'invalid':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'missing':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (status: EnvironmentCheck['status']) => {
    switch (status) {
      case 'present':
        return 'Configured';
      case 'invalid':
        return 'Invalid Format';
      case 'missing':
        return 'Missing';
    }
  };

  const getStatusColor = (status: EnvironmentCheck['status']) => {
    switch (status) {
      case 'present':
        return 'text-green-700';
      case 'invalid':
        return 'text-yellow-700';
      case 'missing':
        return 'text-red-700';
    }
  };

  const requiredMissing = checks.filter(check => check.required && check.status !== 'present').length;
  const hasInvalidKeys = checks.some(check => check.status === 'invalid');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Environment Configuration
          <Button
            variant="outline"
            size="sm"
            onClick={validateEnvironment}
            disabled={isValidating}
          >
            <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Verify that all required environment variables are properly configured
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {requiredMissing > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Configuration Required</AlertTitle>
            <AlertDescription>
              {requiredMissing} required environment variable{requiredMissing > 1 ? 's are' : ' is'} missing. 
              Story generation will not work until these are configured.
            </AlertDescription>
          </Alert>
        )}
        
        {hasInvalidKeys && (
          <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Invalid Configuration</AlertTitle>
            <AlertDescription>
              Some environment variables have invalid formats. Please check the values.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          {checks.map((check) => (
            <div
              key={check.key}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{check.name}</span>
                  {check.required && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{check.description}</p>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusIcon(check.status)}
                <span className={`text-sm font-medium ${getStatusColor(check.status)}`}>
                  {getStatusText(check.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {requiredMissing === 0 && !hasInvalidKeys && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Configuration Complete</AlertTitle>
            <AlertDescription>
              All required environment variables are properly configured. 
              Story generation should work correctly.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="text-sm text-gray-600 mt-4">
          <p><strong>Setup Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Copy <code>.env.example</code> to <code>.env.local</code></li>
            <li>Fill in your actual API keys and configuration values</li>
            <li>Restart the development server</li>
            <li>Click "Refresh" to validate your configuration</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

