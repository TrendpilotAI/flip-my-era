
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, code } = await req.json()
    
    // Handle getting the client key
    if (action === 'get_client_key') {
      return new Response(
        JSON.stringify({ key: Deno.env.get('TIKTOK_CLIENT_KEY') }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Handle auth callback
    if (action === 'handle_callback') {
      const tiktokResponse = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_key: Deno.env.get('TIKTOK_CLIENT_KEY'),
          client_secret: Deno.env.get('TIKTOK_CLIENT_SECRET'),
          code,
          grant_type: 'authorization_code',
        }),
      })

      const data = await tiktokResponse.json()
      
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    throw new Error('Invalid action')
  } catch (error) {
    console.error('Error in TikTok auth:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
