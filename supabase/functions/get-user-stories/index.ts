import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract user ID from Clerk JWT token
    const token = authHeader.replace('Bearer ', '')
    let userId: string

    try {
      console.log('Received auth header:', authHeader.substring(0, 20) + '...')
      
      // Parse Clerk JWT token to get user ID
      const tokenParts = token.split('.')
      if (tokenParts.length !== 3) {
        console.error('Invalid token format: token does not have 3 parts')
        throw new Error('Invalid token format')
      }
      
      // Decode the JWT payload
      try {
        const base64Payload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')
        const decodedPayload = atob(base64Payload)
        const payload = JSON.parse(decodedPayload)
        console.log('JWT payload:', JSON.stringify(payload, null, 2))
        
        // Extract user ID from Clerk token (subject field)
        userId = payload.sub
        
        if (!userId) {
          console.error('No user ID (sub) found in token payload')
          throw new Error('No user ID in token')
        }
        
        console.log('Successfully extracted user ID from Clerk token:', userId)
      } catch (decodeError) {
        console.error('Error decoding JWT payload:', decodeError)
        throw new Error('Failed to decode JWT payload')
      }
    } catch (error) {
      console.error('Token parsing error:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid token', details: error instanceof Error ? error.message : 'Unknown error' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get URL parameters
    const url = new URL(req.url)
    const storyId = url.searchParams.get('storyId')

    if (storyId) {
      // Get specific story by ID
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({ error: 'Story not found' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        throw error
      }

      return new Response(
        JSON.stringify({ story: data }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      // Get all stories for the user
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ stories: data || [] }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Error fetching stories:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 