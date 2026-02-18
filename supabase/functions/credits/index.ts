// Supabase Edge Function: Credits Management
// Credit Management API - Get Balance and Purchase History
// Phase 1A: Enhanced E-Book Generation System
// MODIFIED FOR CLERK INTEGRATION: Properly handles Clerk user IDs as TEXT fields

// @ts-expect-error - HTTPS imports are supported in Deno runtime
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-expect-error - HTTPS imports are supported in Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // More permissive for development
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// For production, we'll determine the correct origin
const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('Origin') || '*';
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:8084',
    'http://localhost:8085',
    'http://localhost:8086',
    'http://localhost:8087',
    'http://localhost:3000',
    'https://flip-my-era.netlify.app',
    'https://flipmyera.com',
    'https://www.flipmyera.com'
  ];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
};

interface CreditBalance {
  balance: number;
  subscription_type: string | null;
  last_updated: string;
}

interface CreditTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund';
  amount: number;
  description: string;
  transaction_date: string;
  stripe_payment_id?: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    balance: CreditBalance;
    recent_transactions?: CreditTransaction[];
  };
  error?: string;
}

// Function to extract user ID from Clerk JWT token
const extractUserIdFromClerkToken = (req: Request): string | null => {
  try {
    console.log('🔍 Edge Function: Extracting user ID from Clerk token...');

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    console.log('🔍 Edge Function: Auth header present:', !!authHeader);
    console.log('🔍 Edge Function: Auth header starts with Bearer:', authHeader?.startsWith('Bearer '));

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔍 Edge Function: No valid auth header found');
      return null;
    }

    const token = authHeader.substring(7);
    console.log('🔍 Edge Function: Token extracted, length:', token.length);
    console.log('🔍 Edge Function: Token preview:', token.substring(0, 20) + '...');

    const parts = token.split('.');
    console.log('🔍 Edge Function: Token parts:', parts.length);

    if (parts.length < 2) {
      console.log('🔍 Edge Function: Invalid JWT format');
      return null;
    }

    // Base64URL decode the payload without verifying signature (sufficient to read 'sub')
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    const payload = JSON.parse(json);

    console.log('🔍 Edge Function: Decoded payload keys:', Object.keys(payload));
    console.log('🔍 Edge Function: Payload sub:', payload?.sub);
    console.log('🔍 Edge Function: Payload user_id:', payload?.user_id);
    console.log('🔍 Edge Function: Payload uid:', payload?.uid);

    const userId = payload?.sub || payload?.user_id || payload?.uid || null;
    console.log('🔍 Edge Function: Extracted userId:', userId);

    return typeof userId === 'string' ? userId : null;
  } catch (error) {
    console.error('🔍 Edge Function: Error extracting user ID from token:', error);
    return null;
  }
};

// Function to get real credit data from Supabase
const getCreditDataFromSupabase = async (userId: string): Promise<{ balance: CreditBalance; transactions: CreditTransaction[] } | null> => {
  try {
    // Create Supabase client with service role key for edge function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Query user_credits table using Clerk user ID (TEXT field)
    const { data: creditData, error: creditError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId) // Using TEXT field, not UUID
      .single();

    // Check if user profile exists to determine subscription status
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', userId)
      .single();

    const userSubscriptionStatus = profileData?.subscription_status || 'free';

    // Handle free user monthly credit refresh
    if (creditData && userSubscriptionStatus === 'free') {
      const now = new Date();
      const currentPeriodEnd = creditData.current_period_end ? new Date(creditData.current_period_end) : null;

      // If no current period or period has ended, refresh credits
      if (!currentPeriodEnd || now >= currentPeriodEnd) {
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1); // Start of next month

        // Reset monthly credits for free users
        const { error: updateError } = await supabase
          .from('user_credits')
          .update({
            balance: 10, // Free users get 10 credits per month (generous!)
            monthly_credits_used: 0,
            current_period_start: periodStart.toISOString(),
            current_period_end: periodEnd.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('user_id', userId);

        if (!updateError) {
          // Create transaction record for monthly refresh
          await supabase
            .from('credit_transactions')
            .insert({
              user_id: userId,
              amount: 10,
              transaction_type: 'monthly_refresh',
              description: 'Monthly free credits refresh',
              balance_after_transaction: 10,
              metadata: { period_start: periodStart.toISOString(), period_end: periodEnd.toISOString() }
            });

          // Update creditData with refreshed values
          creditData.balance = 10;
          creditData.monthly_credits_used = 0;
          creditData.current_period_start = periodStart.toISOString();
          creditData.current_period_end = periodEnd.toISOString();
        }
      }
    }
    
    if (creditError) {
      console.error('Error fetching credit data:', creditError);
      return null;
    }
    
    // Query recent transactions
    const { data: transactions, error: transactionError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId) // Using TEXT field, not UUID
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (transactionError) {
      console.error('Error fetching transactions:', transactionError);
    }
    
    const balance: CreditBalance = {
      balance: creditData?.balance || 0,
      subscription_type: creditData?.subscription_type || null,
      last_updated: creditData?.updated_at || new Date().toISOString()
    };
    
    interface TransactionRow {
      id: string;
      amount: number;
      description: string;
      created_at: string;
      stripe_payment_id?: string;
    }
    
    const formattedTransactions: CreditTransaction[] = (transactions || []).map((tx: TransactionRow) => ({
      id: tx.id,
      type: tx.amount > 0 ? 'purchase' : 'usage',
      amount: Math.abs(tx.amount),
      description: tx.description,
      transaction_date: tx.created_at,
      stripe_payment_id: tx.stripe_payment_id
    }));
    
    return { balance, transactions: formattedTransactions };
  } catch (error) {
    console.error('Error in getCreditDataFromSupabase:', error);
    return null;
  }
};

// Mock credit data for testing (fallback)
const getMockCreditData = (): { balance: CreditBalance; transactions: CreditTransaction[] } => {
  const now = new Date().toISOString();
  
  return {
    balance: {
      balance: 10, // Give user 10 credits for testing
      subscription_type: 'monthly',
      last_updated: now
    },
    transactions: [
      {
        id: 'mock-tx-1',
        type: 'purchase',
        amount: 10,
        description: 'Welcome credits for testing',
        transaction_date: now,
        stripe_payment_id: 'mock-payment-123'
      }
    ]
  };
};

serve(async (req: Request) => {
  // Get dynamic CORS headers based on request
  const dynamicCorsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: dynamicCorsHeaders });
  }

  try {
    console.log('🔍 Edge Function: Received request');
    console.log('🔍 Edge Function: Method:', req.method);
    console.log('🔍 Edge Function: URL:', req.url);
    console.log('🔍 Edge Function: Authorization header present:', !!req.headers.get('authorization'));
    console.log('🔍 Edge Function: Authorization header value:', req.headers.get('authorization')?.substring(0, 20) + '...');
    console.log('🔍 Edge Function: Content-Type header:', req.headers.get('content-type'));

    // Extract user ID from Clerk token
    const userId = extractUserIdFromClerkToken(req);

    if (!userId) {
      console.log('🔍 Edge Function: No userId extracted, returning 401');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized - Invalid or missing token'
        }),
        {
          status: 401,
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🔍 Edge Function: Processing request for Clerk user: ${userId}`);

    if (req.method === 'GET' || req.method === 'POST') {
      // Parse query parameters
      const url = new URL(req.url);
      const includeTransactions = url.searchParams.get('include_transactions') === 'true';
      
      // Get credit data from Supabase
      const creditData = await getCreditDataFromSupabase(userId);
      
      if (!creditData) {
        console.error('Failed to fetch credit data for user:', userId);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to fetch credit data. Please try again.'
          }),
          {
            status: 500,
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      const response: ApiResponse = {
        success: true,
        data: {
          balance: creditData.balance,
          recent_transactions: includeTransactions ? creditData.transactions : undefined
        }
      };

      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else {
      // Method not allowed
      return new Response(
        JSON.stringify({
          success: false,
          error: `Method ${req.method} not allowed`
        }),
        { 
          status: 405, 
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Credits API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
      }
    );
  }
});