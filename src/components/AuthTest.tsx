import React, { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { createSupabaseClientWithClerkToken } from '@/core/integrations/supabase/client';

export default function AuthTest() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testClerkToken = async () => {
    setIsLoading(true);
    addResult('Starting Clerk token test...');
    
    try {
      // Get token with specific audience for Supabase
      const token = await getToken({ template: 'supabase' });
      addResult(`Clerk token received: ${token ? 'YES' : 'NO'}`);
      
      if (token) {
        addResult(`Token length: ${token.length} characters`);
        addResult(`Token starts with: ${token.substring(0, 20)}...`);
        
        // Try to decode the token to see its structure
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          addResult(`Token payload keys: ${Object.keys(payload).join(', ')}`);
          addResult(`Token sub (user ID): ${payload.sub}`);
          addResult(`Token aud: ${payload.aud}`);
          addResult(`Token iss: ${payload.iss}`);
        } catch (e) {
          addResult(`Could not decode token payload: ${e}`);
        }
      }
    } catch (error) {
      addResult(`Error getting token: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testSupabaseConnection = async () => {
    setIsLoading(true);
    addResult('Testing Supabase connection...');
    
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        addResult('No Clerk token available');
        setIsLoading(false);
        return;
      }

      const supabaseClient = createSupabaseClientWithClerkToken(token);
      
      // Test basic connection
      const { data, error } = await supabaseClient.from('profiles').select('count').limit(1);
      
      if (error) {
        addResult(`Supabase connection error: ${error.message}`);
        addResult(`Error code: ${error.code}`);
        addResult(`Error details: ${JSON.stringify(error)}`);
      } else {
        addResult('Supabase connection successful!');
      }
    } catch (error) {
      addResult(`Error testing Supabase: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testCreditsFunction = async () => {
    setIsLoading(true);
    addResult('Testing credits Edge Function...');
    
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        addResult('No Clerk token available');
        setIsLoading(false);
        return;
      }

      addResult(`Token received: ${token.substring(0, 50)}...`);
      
      // Test direct fetch to get more detailed error information
      // Prefer Supabase client invocation to avoid manual CORS pitfalls
      const { data, error } = await createSupabaseClientWithClerkToken(token)
        .functions.invoke('credits', { method: 'GET' });
      
      if (error) {
        addResult(`Credits function failed: ${error.message}`);
      } else {
        addResult(`Credits function success! Data: ${JSON.stringify(data)}`);
      }
      
          } catch (error) {
      addResult(`Error testing credits function: ${error}`);
      addResult(`Error details: ${JSON.stringify(error)}`);
    }
    
    setIsLoading(false);
  };

  const testJwtTemplate = async () => {
    setIsLoading(true);
    addResult('Testing JWT template configuration...');
    
    try {
      // Test getting token with supabase template
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) {
        addResult('ERROR: No supabase template token available');
        addResult('This means the Clerk JWT template is not configured');
        setIsLoading(false);
        return;
      }

      addResult('SUCCESS: Supabase template token received');
      
      // Decode and check the token structure
      try {
        const payload = JSON.parse(atob(supabaseToken.split('.')[1]));
        addResult(`Token aud (audience): ${payload.aud}`);
        addResult(`Token sub (user ID): ${payload.sub}`);
        addResult(`Token iss (issuer): ${payload.iss}`);
        addResult(`Token role: ${payload.role}`);
        
        if (payload.aud === 'authenticated') {
          addResult('SUCCESS: Token has correct audience for Supabase');
        } else {
          addResult(`WARNING: Token audience is '${payload.aud}', expected 'authenticated'`);
        }
        
        if (payload.role === 'authenticated') {
          addResult('SUCCESS: Token has correct role for Supabase');
        } else {
          addResult(`WARNING: Token role is '${payload.role}', expected 'authenticated'`);
        }
        
      } catch (e) {
        addResult(`ERROR: Could not decode token payload: ${e}`);
      }
      
    } catch (error) {
      addResult(`ERROR: Failed to get supabase template token: ${error}`);
      addResult('This indicates the Clerk JWT template is not properly configured');
    }
    
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (!isLoaded) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Auth Integration Test</h2>
      
      <div className="mb-4">
        <p><strong>User Status:</strong> {user ? 'Signed In' : 'Not Signed In'}</p>
        {user && (
          <div className="mt-2">
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
            <p><strong>Name:</strong> {user.fullName}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button 
          onClick={testClerkToken}
          disabled={isLoading || !user}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Test Clerk Token
        </button>
        
        <button 
          onClick={testSupabaseConnection}
          disabled={isLoading || !user}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
        >
          Test Supabase Connection
        </button>
        
        <button 
          onClick={testCreditsFunction}
          disabled={isLoading || !user}
          className="px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-300"
        >
          Test Credits Function
        </button>
        
        <button 
          onClick={testJwtTemplate}
          disabled={isLoading || !user}
          className="px-4 py-2 bg-pink-500 text-white rounded disabled:bg-gray-300"
        >
          Test JWT Template
        </button>
        
        <button 
          onClick={clearResults}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Clear Results
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">Test Results:</h3>
        {testResults.length === 0 ? (
          <p className="text-gray-500">No tests run yet. Click a test button above.</p>
        ) : (
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono bg-white p-2 rounded border">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 