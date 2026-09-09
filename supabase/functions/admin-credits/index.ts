// Supabase Edge Function: Admin Credits Management
// Admin Credit Management API - Add credits to users
// Phase 1A: Enhanced E-Book Generation System

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCors, verifyAuth } from "../_shared/utils.ts";

interface AdminCreditRequest {
  action?: 'list_users' | 'get_transactions' | 'adjust';
  user_id: string;
  credits_to_add: number;
  reason: string;
  admin_note?: string;
}

interface UserCreditInfo {
  user_id: string;
  email: string;
  name: string;
  current_balance: number;
  subscription_type: string | null;
  total_earned: number;
  total_spent: number;
  created_at: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    user_info?: UserCreditInfo;
    new_balance?: number;
    transaction_id?: string;
  };
  error?: string;
}

interface AdminCreditTransactionResult {
  success: boolean;
  new_balance: number;
  transaction_id: string;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const dynamicCorsHeaders = getCorsHeaders(req);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify JWT cryptographically via Supabase auth.getUser()
    const adminUserId = await verifyAuth(req);

    if (!adminUserId) {
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

    // Verify admin status using role column (set via migration 20251007000100)
    const { data: adminProfile, error: adminError } = await supabaseClient
      .from('profiles')
      .select('email, role')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminProfile) {
      console.error('Error fetching admin profile:', adminError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized - Admin profile not found'
        }),
        {
          status: 401,
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check admin via database role column — NOT email substring matching
    const isAdmin = adminProfile.role === 'admin';

    if (!isAdmin) {
      console.error('Non-admin user attempted to access admin credits function:', adminProfile.email);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Forbidden - Admin access required'
        }),
        {
          status: 403,
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'GET') {
      // Get user credit information
      const url = new URL(req.url);
      const targetUserId = url.searchParams.get('user_id');
      
      if (!targetUserId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing user_id parameter'
          }),
          { 
            status: 400, 
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Get user profile and credit information
      const { data: userProfile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('id, email, full_name, created_at')
        .eq('id', targetUserId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'User not found'
          }),
          { 
            status: 404, 
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const { data: creditData, error: creditError } = await supabaseClient
        .from('user_credits')
        .select('balance, subscription_type, total_earned, total_spent')
        .eq('user_id', targetUserId)
        .single();

      if (creditError && creditError.code !== 'PGRST116') {
        console.error('Error fetching credit data:', creditError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to fetch credit information'
          }),
          { 
            status: 500, 
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const userInfo: UserCreditInfo = {
        user_id: userProfile.id,
        email: userProfile.email,
        name: userProfile.full_name || 'Unknown',
        current_balance: creditData?.balance || 0,
        subscription_type: creditData?.subscription_type || null,
        total_earned: creditData?.total_earned || 0,
        total_spent: creditData?.total_spent || 0,
        created_at: userProfile.created_at
      };

      const response: ApiResponse = {
        success: true,
        data: {
          user_info: userInfo
        }
      };

      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else if (req.method === 'POST') {
      const body: AdminCreditRequest = await req.json();

      if (body.action === 'list_users') {
        const { data: profiles, error: profilesError } = await supabaseClient
          .from('profiles')
          .select('id, email, full_name, name, created_at')
          .order('created_at', { ascending: false });
        if (profilesError) throw profilesError;

        const { data: credits, error: creditsError } = await supabaseClient
          .from('user_credits')
          .select('user_id, balance, subscription_type, total_earned, total_spent');
        if (creditsError) throw creditsError;

        const creditByUser = new Map((credits || []).map((row) => [row.user_id, row]));
        const users = (profiles || []).map((profile) => {
          const credit = creditByUser.get(profile.id);
          return {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name || profile.name || 'Unknown',
            created_at: profile.created_at,
            credit_balance: credit?.balance || 0,
            subscription_type: credit?.subscription_type || null,
            total_earned: credit?.total_earned || 0,
            total_spent: credit?.total_spent || 0,
          };
        });

        return new Response(JSON.stringify({ success: true, data: { users } }), {
          status: 200,
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (body.action === 'get_transactions') {
        if (!body.user_id) {
          return new Response(JSON.stringify({ success: false, error: 'Missing user_id' }), {
            status: 400,
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const { data: transactions, error } = await supabaseClient
          .from('credit_transactions')
          .select('id, amount, description, created_at, metadata')
          .eq('user_id', body.user_id)
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: { transactions } }), {
          status: 200,
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Add credits to a user.
      
      if (!body.user_id || !body.credits_to_add || !body.reason) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing required fields: user_id, credits_to_add, reason'
          }),
          { 
            status: 400, 
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (body.credits_to_add <= 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Credits to add must be greater than 0'
          }),
          { 
            status: 400, 
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const requestIdempotencyKey = req.headers.get('Idempotency-Key')?.trim();
      if (!requestIdempotencyKey || requestIdempotencyKey.length > 200) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'A valid Idempotency-Key header is required for credit adjustments',
          }),
          {
            status: 400,
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      // Verify target user exists
      const { data: targetUser, error: userError } = await supabaseClient
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', body.user_id)
        .single();

      if (userError || !targetUser) {
        console.error('Error fetching target user:', userError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Target user not found'
          }),
          { 
            status: 404, 
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Balance mutation and ledger insertion are one database transaction.
      const { data: transactionData, error: transactionError } = await supabaseClient
        .rpc('apply_credit_transaction', {
          p_user_id: body.user_id,
          p_amount: body.credits_to_add,
          p_transaction_type: 'adjustment',
          p_description: `Admin credit addition: ${body.reason}`,
          p_metadata: {
            admin_user_id: adminUserId,
            admin_email: adminProfile.email,
            reason: body.reason,
            admin_note: body.admin_note || null,
          },
          p_idempotency_key: `admin:${adminUserId}:${body.user_id}:${requestIdempotencyKey}`,
        })
        .single();
      const transaction = transactionData as AdminCreditTransactionResult | null;

      if (transactionError || !transaction?.success) {
        console.error('Error applying credit transaction:', transactionError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to apply credit adjustment'
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
          new_balance: transaction.new_balance,
          transaction_id: transaction.transaction_id
        }
      };

      console.log(`Admin ${adminProfile.email} added ${body.credits_to_add} credits to user ${targetUser.email}. New balance: ${transaction.new_balance}`);

      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else {
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
    console.error('Admin credits API error:', error);
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
