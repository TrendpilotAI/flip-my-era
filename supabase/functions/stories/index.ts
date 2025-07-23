import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    // Extract user ID from JWT token (Clerk token)
    const token = authHeader.replace('Bearer ', '')
    let userId: string

    try {
      // For Clerk tokens, we'll use a simpler approach
      // The token should contain the user ID in the payload
      // This is a simplified version - in production you'd want proper JWT verification
      const tokenParts = token.split('.')
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format')
      }
      
      const payload = JSON.parse(atob(tokenParts[1]))
      userId = payload.sub || payload.user_id
      
      if (!userId) {
        throw new Error('No user ID in token')
      }
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    switch (req.method) {
      case 'GET':
        if (path === 'stories') {
          // Get all stories for the user
          const { data, error } = await supabase
            .from('stories')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (error) throw error

          return new Response(
            JSON.stringify({ stories: data }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        } else {
          // Get specific story by ID
          const storyId = path
          const { data, error } = await supabase
            .from('stories')
            .select('*')
            .eq('id', storyId)
            .eq('user_id', userId)
            .single()

          if (error) throw error

          return new Response(
            JSON.stringify({ story: data }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

      case 'POST':
        // Create new story
        const storyData = await req.json()
        
        const { data, error } = await supabase
          .from('stories')
          .insert({
            ...storyData,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ story: data }),
          { 
            status: 201, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      case 'PUT':
        // Update story
        const updateData = await req.json()
        const storyId = path

        const { data: updatedData, error: updateError } = await supabase
          .from('stories')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', storyId)
          .eq('user_id', userId)
          .select()
          .single()

        if (updateError) throw updateError

        return new Response(
          JSON.stringify({ story: updatedData }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      case 'DELETE':
        // Delete story
        const deleteStoryId = path

        const { error: deleteError } = await supabase
          .from('stories')
          .delete()
          .eq('id', deleteStoryId)
          .eq('user_id', userId)

        if (deleteError) throw deleteError

        return new Response(
          JSON.stringify({ message: 'Story deleted successfully' }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 