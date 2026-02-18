// Supabase Edge Function: Credit Validation
// Validates and reserves credits for ebook generation
// Phase 1A: Enhanced E-Book Generation System
// MODIFIED FOR CLERK INTEGRATION: Properly handles Clerk user IDs as TEXT fields

// Using Deno's built-in HTTP server API
// @ts-expect-error -- HTTPS imports are supported in Deno Edge Functions runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import credit pricing logic (inlined for Edge Function compatibility)
const CREDIT_PRICING = {
  // Story Generation (LLM Models)
  story_generation: { basic: 1, advanced: 2, ultra: 4 },
  chapter_generation: { basic: 1.5, advanced: 3, ultra: 6 },
  novel_outline: { basic: 2, advanced: 4, ultra: 8 },
  character_development: { basic: 1, advanced: 2, ultra: 4 },
  plot_enhancement: { basic: 1.5, advanced: 3, ultra: 6 },

  // Image Generation (Visual Models)
  image_generation: {
    story_illustration: { basic: 0.5, advanced: 1, ultra: 2 },
    character_portrait: { basic: 1, advanced: 2, ultra: 4 },
    scene_background: { basic: 0.8, advanced: 1.5, ultra: 3 },
    cover_art: { basic: 1.5, advanced: 3, ultra: 6 },
    multi_panel_spread: { basic: 2, advanced: 4, ultra: 8 }
  },

  // Video Generation (A/V Models)
  video_generation: {
    story_recrap: { basic: 5, advanced: 10, ultra: 20 },
    character_intro: { basic: 8, advanced: 15, ultra: 30 },
    scene_animation: { basic: 12, advanced: 25, ultra: 50 },
    full_adaptation: { basic: 25, advanced: 50, ultra: 100 }
  },

  // Audio Generation (Text-to-Speech)
  audio_narration: { basic: 0.5, advanced: 1, ultra: 3 }, // per minute
  sound_effects: { basic: 0.3, advanced: 0.6, ultra: 1.2 },
  background_music: { basic: 0.8, advanced: 1.5, ultra: 3 }
};

function calculateCreditCost(operation: Operation): number {
  const { type, quality = 'basic', speedPriority = false, commercialLicense = false, quantity = 1 } = operation;

  let baseCost = 0;

  // Get base cost from pricing table
  if (type === 'image_generation') {
    baseCost = CREDIT_PRICING.image_generation[operation.subject || 'story_illustration'][quality] || 1;
  } else if (type === 'video_generation') {
    baseCost = CREDIT_PRICING.video_generation[operation.videoType || 'story_recrap'][quality] || 5;
  } else if (type.includes('audio')) {
    const duration = operation.durationMinutes || 1;
    if (type === 'audio_narration') {
      baseCost = CREDIT_PRICING.audio_narration[quality] * duration;
    } else {
      baseCost = CREDIT_PRICING[type][quality] || 1;
    }
  } else {
    baseCost = CREDIT_PRICING[type]?.[quality] || 1;
  }

  // Apply quantity
  baseCost *= quantity;

  // Speed priority (+25-50% based on operation)
  if (speedPriority) {
    const speedMultiplier = type.includes('image') ? 0.5 : type.includes('video') ? 0.4 : 0.25;
    baseCost += baseCost * speedMultiplier;
  }

  // Commercial license (+50%)
  if (commercialLicense) {
    baseCost *= 1.5;
  }

  // Bulk discount (10% off for 5+ items)
  if (quantity >= 5) {
    baseCost *= 0.9;
  }

  return Math.max(0.1, Math.round(baseCost * 100) / 100);
}

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

interface Operation {
  type: string;
  quality?: 'basic' | 'advanced' | 'ultra';
  speedPriority?: boolean;
  commercialLicense?: boolean;
  quantity?: number;
  subject?: string; // for image generation
  videoType?: string; // for video generation
  durationMinutes?: number; // for audio generation
}

interface ValidationRequest {
  credits_required?: number; // Legacy support
  story_type?: string; // Legacy support
  generation_id?: string;
  operations?: Operation[]; // New operation-based pricing
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
const extractUserIdFromClerkToken = (req: Request): string | null => {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const parts = token.split('.');
    if (parts.length < 2) return null;

    // Base64URL decode JWT payload and return 'sub'
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    const payload = JSON.parse(json);

    const userId = payload?.sub || payload?.user_id || payload?.uid || null;
    return typeof userId === 'string' ? userId : null;
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
    
    const currentBalance = creditData?.balance || 0;
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

// @ts-expect-error -- Deno.serve is available in Supabase Edge Functions runtime
Deno.serve(async (req: Request) => {
  // Get dynamic CORS headers based on request
  const dynamicCorsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: dynamicCorsHeaders });
  }

  try {
    // Extract user ID from Clerk token
    const userId = extractUserIdFromClerkToken(req);
    
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
      
      // Handle both legacy and new pricing systems
      let totalCreditsRequired = 0;
      const operations = body.operations || [];

      if (operations.length > 0) {
        // New operation-based pricing
        totalCreditsRequired = operations.reduce((total, operation) => {
          return total + calculateCreditCost(operation);
        }, 0);
        console.log(`Validating ${totalCreditsRequired} credits for ${operations.length} operations`);
      } else {
        // Legacy pricing (backward compatibility)
        totalCreditsRequired = body.credits_required || 1;
        const storyType = body.story_type || 'short_story';
        console.log(`Validating ${totalCreditsRequired} credits for ${storyType} (legacy)`);
      }

      const generationId = body.generation_id;

      // Validate credits with Supabase
      const validationData = await validateCreditsWithSupabase(userId, totalCreditsRequired);

      if (!validationData) {
        console.error('Failed to validate credits for user:', userId);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to validate credits. Please try again.'
          }),
          {
            status: 500,
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
          }
        );
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