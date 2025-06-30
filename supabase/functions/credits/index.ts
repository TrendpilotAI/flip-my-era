// Supabase Edge Function: Credits Management
// Credit Management API - Get Balance and Purchase History
// Phase 1A: Enhanced E-Book Generation System

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized - Authentication required' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userId = user.id;

    if (req.method === 'GET') {
      // Parse query parameters
      const url = new URL(req.url);
      const includeTransactions = url.searchParams.get('include_transactions') === 'true';
      
      // Fetch credit balance
      const { data: creditData, error: creditError } = await supabaseClient
        .from('user_credits')
        .select('balance, subscription_type, updated_at')
        .eq('user_id', userId)
        .single();

      if (creditError && creditError.code !== 'PGRST116') {
        console.error('Error fetching credit balance:', creditError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to fetch credit balance'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // If no credit record exists, create one with 0 balance
      let balance: CreditBalance;
      if (!creditData) {
        const { data: newCredit, error: createError } = await supabaseClient
          .from('user_credits')
          .insert({
            user_id: userId,
            balance: 0,
            subscription_type: null
          })
          .select('balance, subscription_type, updated_at')
          .single();

        if (createError) {
          console.error('Error creating credit record:', createError);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to initialize credit account'
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        balance = {
          balance: newCredit.balance,
          subscription_type: newCredit.subscription_type,
          last_updated: newCredit.updated_at
        };
      } else {
        balance = {
          balance: creditData.balance,
          subscription_type: creditData.subscription_type,
          last_updated: creditData.updated_at
        };
      }

      let recent_transactions: CreditTransaction[] | undefined;

      // Fetch recent transactions if requested
      if (includeTransactions) {
        const { data: transactionData, error: transactionError } = await supabaseClient
          .from('credit_transactions')
          .select('id, type, amount, description, created_at, samcart_order_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (transactionError) {
          console.error('Error fetching transactions:', transactionError);
          // Don't fail the request, just omit transactions
          recent_transactions = [];
        } else {
          recent_transactions = transactionData.map((tx: any) => ({
            id: tx.id,
            type: tx.type,
            amount: tx.amount,
            description: tx.description,
            transaction_date: tx.created_at,
            samcart_order_id: tx.samcart_order_id || undefined
          }));
        }
      }

      const response: ApiResponse = {
        success: true,
        data: {
          balance,
          recent_transactions
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
    console.error('Credits API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});