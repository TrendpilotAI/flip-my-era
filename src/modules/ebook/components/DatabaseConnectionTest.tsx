import React, { useEffect, useState } from 'react';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { createSupabaseClientWithClerkToken } from '@/core/integrations/supabase/client';

interface DatabaseConnectionTestProps {
  ebookId: string;
}

export const DatabaseConnectionTest: React.FC<DatabaseConnectionTestProps> = ({ ebookId }) => {
  const { isAuthenticated, getToken } = useClerkAuth();
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    const runTests = async () => {
      const results: any[] = [];
      
      try {
        console.log('🔍 DB TEST: Starting database connection tests...');
        
        // Test 1: Authentication status
        results.push({
          test: 'Authentication Status',
          result: isAuthenticated ? 'PASS' : 'FAIL',
          details: { isAuthenticated }
        });

        if (!isAuthenticated) {
          setTestResults(results);
          return;
        }

        // Test 2: Token retrieval
        console.log('🔍 DB TEST: Getting token...');
        const token = await getToken({ template: 'supabase' });
        results.push({
          test: 'Token Retrieval',
          result: token ? 'PASS' : 'FAIL',
          details: { tokenLength: token?.length || 0, hasToken: !!token }
        });

        if (!token) {
          setTestResults(results);
          return;
        }

        // Test 3: Supabase client creation
        console.log('🔍 DB TEST: Creating Supabase client...');
        const supabase = createSupabaseClientWithClerkToken(token);
        results.push({
          test: 'Supabase Client Creation',
          result: supabase ? 'PASS' : 'FAIL',
          details: { hasClient: !!supabase }
        });

        // Test 4: Basic connection test
        console.log('🔍 DB TEST: Testing basic connection...');
        const { data: connectionTest, error: connectionError } = await supabase
          .from('ebook_generations')
          .select('count(*)')
          .limit(1);
        
        results.push({
          test: 'Database Connection',
          result: connectionError ? 'FAIL' : 'PASS',
          details: { error: connectionError?.message, data: connectionTest }
        });

        // Test 5: Specific ebook query
        console.log('🔍 DB TEST: Querying specific ebook...');
        const { data: ebookData, error: ebookError } = await supabase
          .from('ebook_generations')
          .select('id, title, cover_image_url, images, chapters')
          .eq('id', ebookId)
          .single();
        
        results.push({
          test: 'Specific Ebook Query',
          result: ebookError ? 'FAIL' : 'PASS',
          details: { 
            error: ebookError?.message, 
            hasData: !!ebookData,
            dataKeys: ebookData ? Object.keys(ebookData) : [],
            title: ebookData?.title,
            coverUrl: ebookData?.cover_image_url,
            imagesType: typeof ebookData?.images,
            imagesLength: Array.isArray(ebookData?.images) ? ebookData.images.length : 'N/A',
            chaptersType: typeof ebookData?.chapters,
            chaptersLength: Array.isArray(ebookData?.chapters) ? ebookData.chapters.length : 'N/A'
          }
        });

        // Test 6: User-specific query (check if RLS is working)
        console.log('🔍 DB TEST: Testing user-specific access...');
        const { data: userEbooks, error: userError } = await supabase
          .from('ebook_generations')
          .select('id, title, user_id')
          .limit(5);
        
        results.push({
          test: 'User Access Test',
          result: userError ? 'FAIL' : 'PASS',
          details: { 
            error: userError?.message, 
            ebookCount: userEbooks?.length || 0,
            ebooks: userEbooks?.map(e => ({ id: e.id, title: e.title, user_id: e.user_id }))
          }
        });

      } catch (error) {
        console.error('🔍 DB TEST: Exception during tests:', error);
        results.push({
          test: 'Exception Handling',
          result: 'FAIL',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }

      setTestResults(results);
    };

    if (ebookId) {
      runTests();
    }
  }, [ebookId, isAuthenticated, getToken]);

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Database Connection Test Results</h3>
      <div className="space-y-2">
        {testResults.map((result, index) => (
          <div key={index} className={`p-3 rounded ${result.result === 'PASS' ? 'bg-green-100' : 'bg-red-100'}`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">{result.test}</span>
              <span className={`px-2 py-1 rounded text-sm ${result.result === 'PASS' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                {result.result}
              </span>
            </div>
            <pre className="text-xs mt-2 bg-white p-2 rounded overflow-auto">
              {JSON.stringify(result.details, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};