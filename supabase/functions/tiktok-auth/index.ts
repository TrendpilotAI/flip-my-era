import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { 
  handleCors, 
  formatErrorResponse, 
  formatSuccessResponse 
} from "../_shared/utils.js"

interface TikTokAuthRequest {
  action: 'get_client_key' | 'handle_callback'
  code?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { action, code } = await req.json() as TikTokAuthRequest
    
    // Handle getting the client key
    if (action === 'get_client_key') {
      const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')
      if (!clientKey) {
        throw new Error('TikTok client key not found')
      }
      return formatSuccessResponse({ key: clientKey })
    }
    
    // Handle auth callback
    if (action === 'handle_callback') {
      // Validate code parameter
      if (!code || typeof code !== 'string' || code.trim() === '') {
        throw new Error('Valid authorization code is required')
      }

      const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')
      const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
      
      if (!clientKey || !clientSecret) {
        throw new Error('TikTok credentials not found')
      }

      const trimmedCode = code.trim()
      
      const tiktokResponse = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_key: clientKey,
          client_secret: clientSecret,
          code: trimmedCode,
          grant_type: 'authorization_code',
        }),
      })

      const data = await tiktokResponse.json()
      
      if (!tiktokResponse.ok) {
        throw new Error(`TikTok API error: ${JSON.stringify(data)}`)
      }
      
      return formatSuccessResponse(data)
    }
    
    throw new Error('Invalid action')
  } catch (error) {
    return formatErrorResponse(error instanceof Error ? error : new Error(String(error)))
  }
})
