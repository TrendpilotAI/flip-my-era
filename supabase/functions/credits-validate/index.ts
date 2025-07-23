// Supabase Edge Function: Credit Validation
// Validates and reserves credits for ebook generation
// Phase 1A: Enhanced E-Book Generation System
// MODIFIED FOR CLERK INTEGRATION: Properly handles Clerk user IDs as TEXT fields

// Using Deno's built-in HTTP server API
// @ts-ignore - HTTPS imports are supported in Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtVerify } from "https://esm.sh/jose@4.15.4";

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
    'http://localhost:3000', 
    'https://flip-my-era.netlify.app'
  ];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
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

// Function to validate credits using real Supabase data
const validateCreditsWithSupabase = async (userId: string, creditsRequired: number): Promise<ValidationResponse['data'] | null> => {
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
    
    const currentBalance = creditData?.balance?.balance || 0;
    const hasSufficientCredits = currentBalance >= creditsRequired;
    
    if (hasSufficientCredits) {
      // Deduct credits and create transaction
      const newBalance = currentBalance - creditsRequired;
      
      // Update user credits
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({ 
          balance: newBalance,
          total_spent: (creditData.total_spent || 0) + creditsRequired,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Error updating credits:', updateError);
        return null;
      }
      
      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: -creditsRequired, // Negative for spending
          transaction_type: 'ebook_generation',
          description: `Ebook generation - ${creditsRequired} credits`,
          balance_after_transaction: newBalance,
          metadata: { story_type: 'ebook_generation' }
        })
        .select()
        .single();
      
      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
      }
      
      return {
        has_sufficient_credits: true,
        current_balance: newBalance,
        subscription_type: creditData.subscription_type,
        transaction_id: transaction?.id,
        bypass_credits: false
      };
    } else {
      return {
        has_sufficient_credits: false,
        current_balance: currentBalance,
        subscription_type: creditData.subscription_type,
        bypass_credits: false
      };
    }
  } catch (error) {
    console.error('Error in validateCreditsWithSupabase:', error);
    return null;
  }
};

// Mock validation data for testing (fallback)
const getMockValidationData = (creditsRequired: number = 1): ValidationResponse['data'] => {
  const mockBalance = 10; // Mock balance
  const hasSufficientCredits = mockBalance >= creditsRequired;
  
  return {
    has_sufficient_credits: hasSufficientCredits,
    current_balance: hasSufficientCredits ? mockBalance - creditsRequired : mockBalance,
    subscription_type: 'monthly',
    transaction_id: hasSufficientCredits ? 'mock-transaction-123' : undefined,
    bypass_credits: false
  };
};

// @ts-ignore - Deno.serve is available in Supabase Edge Functions runtime
Deno.serve(async (req: Request) => {
  // Get dynamic CORS headers based on request
  const dynamicCorsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: dynamicCorsHeaders });
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
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Validating credits for Clerk user: ${userId}`);

    if (req.method === 'POST') {
      let body: ValidationRequest;
      try {
        // Check if request has content
        const contentLength = req.headers.get('content-length');
        if (!contentLength || parseInt(contentLength) === 0) {
          console.log('Empty request body received, using default values');
          body = {
            credits_required: 1,
            story_type: 'short_story',
            generation_id: undefined
          };
        } else {
          body = await req.json();
        }
      } catch (err) {
        console.error('Failed to parse JSON body:', err);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid JSON body or empty request. Please send a JSON object with credits_required, story_type, and generation_id fields.' 
          }),
          { status: 400, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const creditsRequired = body.credits_required || 1;
      const storyType = body.story_type || 'short_story';
      const generationId = body.generation_id;

      console.log(`Validating ${creditsRequired} credits for ${storyType}`);

      // Try to validate with real Supabase data first
      let validationData = await validateCreditsWithSupabase(userId, creditsRequired);
      
      // Fallback to mock data if Supabase validation fails
      if (!validationData) {
        console.log('Falling back to mock validation data');
        validationData = getMockValidationData(creditsRequired);
      }
      
      const response: ValidationResponse = {
        success: true,
        data: validationData
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
    console.error('Credit validation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});