// Supabase Edge Function: Admin Credits Management
// Admin Credit Management API - Add credits to users
// Phase 1A: Enhanced E-Book Generation System

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('Origin') || '*';
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:8084',
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

interface AdminCreditRequest {
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

serve(async (req) => {
  const dynamicCorsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: dynamicCorsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized - Missing authorization header' 
        }),
        { 
          status: 401, 
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    let adminUserId: string;
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      console.log('JWT Payload:', JSON.stringify(payload));
      
      adminUserId = payload.sub || payload.user_id || payload.userId;
      
      if (!adminUserId) {
        console.error('No user ID found in JWT payload');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Unauthorized - No user ID in token' 
          }),
          { 
            status: 401, 
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      console.log('Admin user ID from JWT:', adminUserId);
    } catch (decodeError) {
      console.error('Error decoding JWT:', decodeError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized - Invalid token format' 
        }),
        { 
          status: 401, 
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify admin status
    const { data: adminProfile, error: adminError } = await supabaseClient
      .from('profiles')
      .select('email')
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

    // Check if user is admin
    const isAdmin = adminProfile.email === "admin@flipmyera.com" || 
                    adminProfile.email === "danny.ijdo@gmail.com" ||
                    adminProfile.email === "trendpilot.ai@gmail.com" ||
                    adminProfile.email?.includes("trendpilot");

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
      // Add credits to user
      const body: AdminCreditRequest = await req.json();
      
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

      // Verify target user exists
      const { data: targetUser, error: userError } = await supabaseClient
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', body.user_id)
        .single();

      if (userError) {
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

      // Get or create user's credit record
      const { data: creditData, error: creditError } = await supabaseClient
        .from('user_credits')
        .select('balance, subscription_type')
        .eq('user_id', body.user_id)
        .single();

      let currentBalance = 0;
      let subscriptionType = null;

      if (creditError && creditError.code === 'PGRST116') {
        // Create new credit record
        const { data: newCredit, error: createError } = await supabaseClient
          .from('user_credits')
          .insert({
            user_id: body.user_id,
            balance: body.credits_to_add,
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
              headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        currentBalance = newCredit.balance;
        subscriptionType = newCredit.subscription_type;
      } else if (!creditError) {
        // Update existing credit record
        currentBalance = creditData.balance + body.credits_to_add;
        subscriptionType = creditData.subscription_type;

        const { error: updateError } = await supabaseClient
          .from('user_credits')
          .update({
            balance: currentBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', body.user_id);

        if (updateError) {
          console.error('Error updating credit balance:', updateError);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to update credit balance'
            }),
            { 
              status: 500, 
              headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      } else {
        console.error('Error fetching credit record:', creditError);
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

      // Create credit transaction record
      const { data: transaction, error: transactionError } = await supabaseClient
        .from('credit_transactions')
        .insert({
          user_id: body.user_id,
          amount: body.credits_to_add,
          transaction_type: 'adjustment',
          description: `Admin credit addition: ${body.reason}`,
          metadata: {
            admin_user_id: adminUserId,
            admin_email: adminProfile.email,
            reason: body.reason,
            admin_note: body.admin_note || null
          }
        })
        .select('id')
        .single();

      if (transactionError) {
        console.error('Error creating credit transaction:', transactionError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to record transaction'
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
          new_balance: currentBalance,
          transaction_id: transaction.id
        }
      };

      console.log(`Admin ${adminProfile.email} added ${body.credits_to_add} credits to user ${targetUser.email}. New balance: ${currentBalance}`);

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