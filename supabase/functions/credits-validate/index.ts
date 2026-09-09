// Supabase Edge Function: Credit Validation
// Validates credit availability without reserving or deducting credits.
// Phase 1A: Enhanced E-Book Generation System
// MODIFIED FOR CLERK INTEGRATION: Properly handles Clerk user IDs as TEXT fields

// Using Deno's built-in HTTP server API
// @ts-ignore -- HTTPS imports are supported in Deno Edge Functions runtime
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
// @ts-ignore -- Deno Edge Function imports
import { getCorsHeaders, handleCors, verifyAuth } from "../_shared/utils.ts";

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

type Quality = 'basic' | 'advanced' | 'ultra';
type TierPricing = Record<string, Record<Quality, number>>;

function calculateCreditCost(operation: Operation): number {
  const type = operation.operationType ?? operation.type ?? 'story_generation';
  const quality = operation.modelQuality ?? operation.quality ?? 'basic';
  const { speedPriority = false, commercialLicense = false, quantity = 1 } = operation;

  let baseCost = 0;

  // Get base cost from pricing table
  if (type === 'image_generation') {
    const pricing = CREDIT_PRICING.image_generation as TierPricing;
    baseCost = pricing[operation.subject || 'story_illustration']?.[quality] ?? 1;
  } else if (type === 'video_generation') {
    const pricing = CREDIT_PRICING.video_generation as TierPricing;
    baseCost = pricing[operation.videoType || 'story_recrap']?.[quality] ?? 5;
  } else if (type.includes('audio')) {
    const duration = operation.durationMinutes || 1;
    if (type === 'audio_narration') {
      baseCost = CREDIT_PRICING.audio_narration[quality] * duration;
    } else {
      const pricing = CREDIT_PRICING as unknown as TierPricing;
      baseCost = pricing[type]?.[quality] ?? 1;
    }
  } else {
    const pricing = CREDIT_PRICING as unknown as TierPricing;
    baseCost = pricing[type]?.[quality] ?? 1;
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

interface Operation {
  operationType?: string;
  modelQuality?: 'basic' | 'advanced' | 'ultra';
  type?: string;
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
  operationType?: string;
  modelQuality?: 'basic' | 'advanced' | 'ultra';
  operations?: Operation[]; // New operation-based pricing
}

interface ValidationResponse {
  success: boolean;
  data?: {
    has_sufficient_credits: boolean;
    current_balance: number;
    required_credits: number;
    subscription_type: string | null;
    bypass_credits?: boolean;
  };
  error?: string;
}

// verifyAuth is imported from _shared/utils.ts — cryptographically verifies JWT

// This endpoint is deliberately read-only. The generation function claims its
// idempotency key and charges in one database transaction immediately before it
// invokes the external model.
const validateCreditsWithSupabase = async (userId: string, creditsRequired: number): Promise<ValidationResponse['data'] | null> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First check current balance (read-only, for the response)
    const { data: creditData, error: creditError } = await supabase
      .from('user_credits')
      .select('balance, subscription_type')
      .eq('user_id', userId)
      .maybeSingle();

    if (creditError) {
      console.error('Error fetching credit data:', creditError);
      return null;
    }

    const currentBalance = Number(creditData?.balance ?? 0);

    return {
      has_sufficient_credits: currentBalance >= creditsRequired,
      current_balance: currentBalance,
      required_credits: creditsRequired,
      subscription_type: creditData?.subscription_type ?? null,
      bypass_credits: false
    };
  } catch (error) {
    console.error('Error in validateCreditsWithSupabase:', error);
    return null;
  }
};

Deno.serve(async (req: Request) => {
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

    console.log(`Validating credits for authenticated user: ${userId}`);

    if (req.method === 'POST') {
      let body: ValidationRequest;
      try {
        body = await req.json();
      } catch (err) {
        console.log('Empty request body received, using default values', err);
        body = { credits_required: 1, story_type: 'short_story' };
      }
      
      // Handle both legacy and new pricing systems
      let totalCreditsRequired = 0;
      const operations = body.operations?.length
        ? body.operations
        : body.operationType
          ? [{ operationType: body.operationType, modelQuality: body.modelQuality }]
          : [];

      if (operations.length > 0) {
        // New operation-based pricing
        totalCreditsRequired = operations.reduce((total, operation) => {
          return total + calculateCreditCost(operation);
        }, 0);
        console.log(`Validating ${totalCreditsRequired} credits for ${operations.length} operations`);
      } else {
        // Legacy pricing (backward compatibility)
        totalCreditsRequired = body.credits_required ?? 1;
        const storyType = body.story_type || 'short_story';
        console.log(`Validating ${totalCreditsRequired} credits for ${storyType} (legacy)`);
      }

      if (!Number.isFinite(totalCreditsRequired) || totalCreditsRequired <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Credit requirement must be greater than zero' }),
          { status: 400, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate credits with Supabase
      const validationData = await validateCreditsWithSupabase(userId, totalCreditsRequired);

      if (!validationData) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Unable to validate credits'
          }),
          {
            status: 503,
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
