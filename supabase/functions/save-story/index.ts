import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
}

interface StoryData {
  name: string;
  initial_story: string;
  birth_date?: string;
  prompt?: string;
  transformedName?: string;
  gender?: string;
  personalityType?: string;
  location?: string;
  characterDescription?: string;
  plotDescription?: string;
  [key: string]: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      throw new Error('Server configuration error')
    }
    
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

    // Parse request body
    const storyData: StoryData = await req.json()
    
    if (!storyData.name || !storyData.initial_story) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name and initial_story' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if the user exists in profiles table
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (userProfileError) {
      console.error('Error checking user profile:', userProfileError)
      
      // If the user doesn't exist, create a profile
      if (userProfileError.code === 'PGRST116') {
        console.log('User profile not found, creating a new one')
        
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: 'user@example.com', // Default email, will be updated by auth hook
            name: storyData.name,
            subscription_status: 'free',
            credits: 0
          })
        
        if (createProfileError) {
          console.error('Error creating user profile:', createProfileError)
          throw new Error('Failed to create user profile')
        }
      } else {
        throw userProfileError
      }
    }

    // Prepare story data for database
    const storyRecord = {
      user_id: userId,
      name: storyData.name,
      initial_story: storyData.initial_story,
      birth_date: storyData.birth_date ? new Date(storyData.birth_date).toISOString() : null,
      prompt: storyData.prompt,
      transformed_name: storyData.transformedName,
      gender: storyData.gender,
      personality_type: storyData.personalityType,
      location: storyData.location,
      character_description: storyData.characterDescription,
      plot_description: storyData.plotDescription,
      prompt_data: {
        transformedName: storyData.transformedName,
        gender: storyData.gender,
        personalityType: storyData.personalityType,
        location: storyData.location,
        characterDescription: storyData.characterDescription,
        plotDescription: storyData.plotDescription
      },
      generation_settings: {
        model: 'groq',
        timestamp: new Date().toISOString()
      },
      status: 'completed',
      generation_completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Inserting story record:', JSON.stringify({
      user_id: storyRecord.user_id,
      name: storyRecord.name,
      // Truncate long fields for logging
      initial_story: storyRecord.initial_story.substring(0, 50) + '...'
    }))

    // Insert story into database
    const { data, error } = await supabase
      .from('stories')
      .insert(storyRecord)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    console.log('Story saved successfully with ID:', data.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        story: data,
        message: 'Story saved successfully' 
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error saving story:', error)
    
    // More detailed error response
    let errorMessage = 'Unknown error'
    let errorDetails = {}
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Check for specific database errors
      if ('code' in error) {
        const dbError = error as any
        errorDetails = {
          code: dbError.code,
          hint: dbError.hint,
          details: dbError.details
        }
        
        // Handle specific database errors
        if (dbError.code === '42P01') {
          errorMessage = 'Table does not exist. Please run the database migrations.'
        } else if (dbError.code === '23503') {
          errorMessage = 'Foreign key constraint failed. The user ID may not exist in the profiles table.'
        } else if (dbError.code === '42501') {
          errorMessage = 'Permission denied. The service role may not have sufficient permissions.'
        }
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 