import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface SupabaseError {
  message: string;
  status?: number;
  details?: unknown;
}

const TestCreditsPage = () => {
  const { isSignedIn, getToken } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results: string[] = [];
    
    try {
      // Test 1: Check if signed in
      results.push(`✅ Signed in: ${isSignedIn}`);
      
      // Test 2: Get Clerk token with supabase template
      const tokenWithTemplate = await getToken({ template: 'supabase' });
      results.push(`${tokenWithTemplate ? '✅' : '❌'} Token with 'supabase' template: ${tokenWithTemplate ? tokenWithTemplate.substring(0, 20) + '...' : 'null'}`);
      
      // Test 3: Get Clerk token without template
      const tokenDefault = await getToken();
      results.push(`${tokenDefault ? '✅' : '❌'} Token without template: ${tokenDefault ? tokenDefault.substring(0, 20) + '...' : 'null'}`);
      
      // Test 4: Decode token to check structure
      const token = tokenWithTemplate || tokenDefault;
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            results.push(`✅ Token payload decoded:`);
            results.push(`  - sub: ${payload.sub}`);
            results.push(`  - aud: ${payload.aud}`);
            results.push(`  - iss: ${payload.iss}`);
            results.push(`  - exp: ${new Date(payload.exp * 1000).toISOString()}`);
          }
        } catch (e) {
          results.push(`❌ Could not decode token: ${e}`);
        }
      }
      
      // Test 5: Call credits function with token
      if (token) {
        results.push('📡 Calling credits function...');
        const { data, error } = await supabase.functions.invoke('credits', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (error) {
          const supabaseError = error as SupabaseError;
          results.push(`❌ Credits function error: ${error.message}`);
          results.push(`  - Status: ${supabaseError.status ?? 'unknown'}`);
          results.push(`  - Details: ${JSON.stringify(supabaseError.details ?? {})}`);
        } else {
          results.push(`✅ Credits function success:`);
          results.push(`  - Response: ${JSON.stringify(data, null, 2)}`);
        }
      }
      
      // Test 6: Direct API call to check CORS
      if (token) {
        results.push('📡 Testing direct API call...');
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/credits`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Content-Type': 'application/json',
            },
          });
          
          results.push(`  - Response status: ${response.status}`);
          results.push(`  - Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
          
          if (!response.ok) {
            const text = await response.text();
            results.push(`  - Response body: ${text}`);
          } else {
            const data = await response.json();
            results.push(`  - Response data: ${JSON.stringify(data, null, 2)}`);
          }
        } catch (e) {
          results.push(`❌ Direct API call error: ${e}`);
        }
      }
      
    } catch (error) {
      results.push(`❌ Test error: ${error}`);
    }
    
    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Credits System Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runTests} disabled={loading}>
              {loading ? 'Running Tests...' : 'Run Tests'}
            </Button>
            
            {testResults.length > 0 && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold mb-2">Test Results:</h3>
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {testResults.join('\n')}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestCreditsPage;

