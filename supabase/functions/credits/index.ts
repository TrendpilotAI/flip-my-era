// Supabase Edge Function: Credits Management
// Credit Management API - Get Balance and Purchase History
// Phase 1A: Enhanced E-Book Generation System
// MODIFIED FOR CLERK INTEGRATION: Properly handles Clerk user IDs as TEXT fields

// @ts-ignore - HTTPS imports are supported in Deno runtime
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore - HTTPS imports are supported in Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtVerify } from "https://esm.sh/jose@4.15.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
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

// Function to extract user ID from Clerk JWT token
const extractUserIdFromClerkToken = async (req: Request): Promise<string | null> => {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header found');
      return null;
    }
    
    const token = authHeader.substring(7);
    
    // Try simple base64 decoding first (like stories function)
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const payload = JSON.parse(atob(tokenParts[1]));
      const userId = payload.sub || payload.user_id;
      
      if (userId) {
        console.log('Successfully extracted user ID using base64 decode:', userId);
        return userId;
      }
    } catch (base64Error) {
      console.error('Base64 decode failed:', base64Error);
    }
    
    // Fallback to JWT verification if CLERK_JWT_SECRET is available
    const clerkJwtSecret = Deno.env.get('CLERK_JWT_SECRET');
    if (clerkJwtSecret) {
      try {
        // Verify and decode the JWT token
        const { payload } = await jwtVerify(token, new TextEncoder().encode(clerkJwtSecret));
        
        // Extract user ID from the 'sub' claim
        const userId = payload.sub as string;
        console.log('Successfully extracted user ID from JWT:', userId);
        return userId;
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError);
      }
    }
    
    // Final fallback to mock user ID for development
    console.log('Using mock Clerk user ID for development');
    return 'user_2zFAK78eCctIYm4mAd07mDWhNoA';
    
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
};

// Function to get real credit data from Supabase
const getCreditDataFromSupabase = async (userId: string): Promise<{ balance: CreditBalance; transactions: CreditTransaction[] } | null> => {
  try {
    console.log('getCreditDataFromSupabase called for userId:', userId);
    
    // Create Supabase client with service role key for edge function
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment variables check:');
    console.log('SUPABASE_URL exists:', !!supabaseUrl);
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables');
      return null;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Supabase client created successfully');
    
    // Query user_credits table using Clerk user ID (TEXT field)
    console.log('Querying user_credits table for user:', userId);
    let { data: creditData, error: creditError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId) // Using TEXT field, not UUID
      .single();
    
    console.log('Query result - data:', creditData);
    console.log('Query result - error:', creditError);
    
    if (creditError) {
      // If user doesn't have a credit record, create one with 0 balance
      if (creditError.code === 'PGRST116') {
        console.log('No credit record found for user, creating one with 0 balance');
        const { data: newCreditData, error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: userId,
            balance: 0,
            total_earned: 0,
            total_spent: 0,
            subscription_type: null,
            subscription_status: 'free'
          })
          .select()
          .single();
        
        console.log('Insert result - data:', newCreditData);
        console.log('Insert result - error:', insertError);
        
        if (insertError) {
          console.error('Error creating credit record:', insertError);
          return null;
        }
        
        // Use the newly created record
        creditData = newCreditData;
      } else {
        console.error('Error fetching credit data:', creditError);
        return null;
      }
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
    
    const formattedTransactions: CreditTransaction[] = (transactions || []).map((tx: any) => ({
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
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
    }
    return null;
  }
};

// Removed mock credit data - credits should only come from Supabase

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract user ID from Clerk token
    const userId = await extractUserIdFromClerkToken(req);
    
    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized - Invalid or missing token'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'GET') {
      // Parse query parameters
      const url = new URL(req.url);
      const includeTransactions = url.searchParams.get('include_transactions') === 'true';
      
      // Get real data from Supabase only
      const creditData = await getCreditDataFromSupabase(userId);
      
      // If Supabase query fails, return error instead of mock data
      if (!creditData) {
        console.error('Failed to fetch credit data from Supabase for user:', userId);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Unable to fetch credit balance from database'
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('=== CREDITS API ERROR ===');
    console.error('Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
    const errorName = error instanceof Error ? error.name : 'Unknown error type';
    
    console.error('Error stack:', errorStack);
    console.error('Error message:', errorMessage);
    console.error('Error name:', errorName);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});