import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Configuration type for Edge Functions
export interface Config {
  authRequired: boolean;
  cors: {
    enabled: boolean;
    origins: string[];
    methods: string[];
    allowedHeaders: string[];
  };
}

// Standard CORS headers for all functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to handle CORS preflight requests
export function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

// Initialize Supabase client with error handling
export function initSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Standard error response formatter
export function formatErrorResponse(error: Error, status = 500) {
  // Log error details for debugging (avoid logging sensitive data)
  console.error(`Function error occurred:`, error.message);
  
  // In production, avoid exposing detailed error information
  const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
  
  return new Response(
    JSON.stringify({
      success: false,
      error: isDevelopment ? error.message : 'An error occurred while processing your request',
      // Only include stack trace in development
      ...(isDevelopment && { details: error.stack })
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status
    }
  );
}

// Standard success response formatter
export function formatSuccessResponse<T>(data: T, status = 200) {
  return new Response(
    JSON.stringify({ 
      success: true,
      data
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status
    }
  );
} 