// Supabase Edge Function: Credits Management
// Credit Management API - Get Balance and Purchase History
// Phase 1A: Enhanced E-Book Generation System
// MODIFIED FOR CLERK INTEGRATION: Properly handles Clerk user IDs as TEXT fields

// @ts-expect-error - HTTPS imports are supported in Deno runtime
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-expect-error - HTTPS imports are supported in Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-expect-error -- Deno Edge Function imports
import { verifyAuth } from "../_shared/utils.ts";

const ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'https://flip-my-era.netlify.app',
  'https://flipmyera.com',
  'https://www.flipmyera.com',
];

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
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
  samcart_order_id?: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    balance: CreditBalance;
    recent_transactions?: CreditTransaction[];
  };
  error?: string;
}

// verifyAuth is imported from _shared/utils.ts — cryptographically verifies JWT

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
      samcart_order_id?: string;
    }
    
    const formattedTransactions: CreditTransaction[] = (transactions || []).map((tx: TransactionRow) => ({
      id: tx.id,
      type: tx.amount > 0 ? 'purchase' : 'usage',
      amount: Math.abs(tx.amount),
      description: tx.description,
      transaction_date: tx.created_at,
      samcart_order_id: tx.samcart_order_id
    }));
    
    return { balance, transactions: formattedTransactions };
  } catch (error) {
    console.error('Error in getCreditDataFromSupabase:', error);
    return null;
  }
};

serve(async (req: Request) => {
  // Get dynamic CORS headers based on request
  const dynamicCorsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: dynamicCorsHeaders });
  }

  try {
    // Verify JWT and extract authenticated user ID
    const userId = await verifyAuth(req);

    if (!userId) {
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

    if (req.method === 'GET' || req.method === 'POST') {
      // Parse query parameters
      const url = new URL(req.url);
      const includeTransactions = url.searchParams.get('include_transactions') === 'true';
      
      // Try to get real data from Supabase first
      let creditData = await getCreditDataFromSupabase(userId);
      
      if (!creditData) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Unable to fetch credit data'
          }),
          {
            status: 503,
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