// Supabase Edge Function: Credits Management
// Credit Management API - Get Balance and Purchase History
// Phase 1A: Enhanced E-Book Generation System
// MODIFIED FOR CLERK INTEGRATION: Properly handles Clerk user IDs as TEXT fields

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCors, verifyAuth } from "../_shared/utils.ts";

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

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const dynamicCorsHeaders = getCorsHeaders(req);

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
      
      // Get credit data from Supabase
      const creditData = await getCreditDataFromSupabase(userId);
      
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
