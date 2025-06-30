// Supabase Edge Function: Credit Validation
// Validates and reserves credits for ebook generation
// Phase 1A: Enhanced E-Book Generation System

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  credits_required?: number;
  story_type?: string;
  generation_id?: string;
}

interface ValidationResponse {
  success: boolean;
  data?: {
    has_sufficient_credits: boolean;
    current_balance: number;
    subscription_type: string | null;
    transaction_id?: string;
    bypass_credits?: boolean;
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

    if (req.method === 'POST') {
      const body: ValidationRequest = await req.json();
      const creditsRequired = body.credits_required || 1;
      const storyType = body.story_type || 'short_story';
      const generationId = body.generation_id;

      // Fetch user's current credit status
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

      // Initialize credit record if it doesn't exist
      let currentBalance = 0;
      let subscriptionType = null;

      if (!creditData) {
        const { data: newCredit, error: createError } = await supabaseClient
          .from('user_credits')
          .insert({
            user_id: userId,
            balance: 0,
            subscription_type: null
          })
          .select('balance, subscription_type')
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

        currentBalance = newCredit.balance;
        subscriptionType = newCredit.subscription_type;
      } else {
        currentBalance = creditData.balance;
        subscriptionType = creditData.subscription_type;
      }

      // Check if user has unlimited subscription
      const hasUnlimitedSubscription = subscriptionType === 'monthly_unlimited' || 
                                       subscriptionType === 'annual_unlimited';

      let hasSufficientCredits = false;
      let transactionId = null;
      let bypassCredits = false;

      if (hasUnlimitedSubscription) {
        // User has unlimited subscription, bypass credit check
        hasSufficientCredits = true;
        bypassCredits = true;
        
        // Still create a transaction record for audit purposes
        const { data: transaction, error: transactionError } = await supabaseClient
          .from('credit_transactions')
          .insert({
            user_id: userId,
            type: 'usage',
            amount: 0, // No credits deducted for unlimited users
            description: `Ebook generation (${storyType}) - Unlimited subscription`,
            samcart_order_id: null,
            metadata: {
              story_type: storyType,
              generation_id: generationId,
              subscription_type: subscriptionType
            }
          })
          .select('id')
          .single();

        if (!transactionError && transaction) {
          transactionId = transaction.id;
        }

      } else {
        // Check if user has sufficient credits
        if (currentBalance >= creditsRequired) {
          hasSufficientCredits = true;

          // Reserve credits by creating a usage transaction
          const { data: transaction, error: transactionError } = await supabaseClient
            .from('credit_transactions')
            .insert({
              user_id: userId,
              type: 'usage',
              amount: -creditsRequired,
              description: `Ebook generation (${storyType})`,
              samcart_order_id: null,
              metadata: {
                story_type: storyType,
                generation_id: generationId
              }
            })
            .select('id')
            .single();

          if (transactionError) {
            console.error('Error creating usage transaction:', transactionError);
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Failed to reserve credits'
              }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }

          transactionId = transaction.id;

          // Update user's credit balance
          const { error: updateError } = await supabaseClient
            .from('user_credits')
            .update({ 
              balance: currentBalance - creditsRequired,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

          if (updateError) {
            console.error('Error updating credit balance:', updateError);
            // Try to rollback the transaction
            await supabaseClient
              .from('credit_transactions')
              .delete()
              .eq('id', transaction.id);

            return new Response(
              JSON.stringify({
                success: false,
                error: 'Failed to update credit balance'
              }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }

          // Update current balance for response
          currentBalance -= creditsRequired;
        }
      }

      const response: ValidationResponse = {
        success: true,
        data: {
          has_sufficient_credits: hasSufficientCredits,
          current_balance: currentBalance,
          subscription_type: subscriptionType,
          transaction_id: transactionId || undefined,
          bypass_credits: bypassCredits
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
    console.error('Credit validation error:', error);
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