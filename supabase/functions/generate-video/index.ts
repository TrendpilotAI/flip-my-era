import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VideoRequest {
  text: string;
  template: 'story' | 'quote' | 'slideshow';
  userId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body
    const requestData = await req.json() as VideoRequest
    const { text, template, userId } = requestData
    
    if (!text || !template) {
      throw new Error('Missing required fields: text and template are required')
    }
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate a unique filename
    const timestamp = new Date().getTime()
    const randomId = Math.random().toString(36).substring(2, 10)
    const filename = `${timestamp}-${randomId}-${template}.mp4`
    
    // Create a record in the database to track the video generation
    const { data: videoRecord, error: dbError } = await supabase
      .from('videos')
      .insert({
        user_id: userId || 'anonymous',
        filename,
        template,
        text_prompt: text,
        status: 'processing'
      })
      .select()
      .single()
      
    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }
    
    // In a production environment, you would trigger an actual video generation service here
    // For example, sending a request to a video generation API or queuing a background job
    
    // For now, we'll simulate processing with a delay and then mark it as complete
    setTimeout(async () => {
      // Update the record to mark it as complete
      await supabase
        .from('videos')
        .update({ 
          status: 'completed',
          video_url: `${supabaseUrl}/storage/v1/object/public/videos/${filename}`
        })
        .eq('id', videoRecord.id)
    }, 5000) // Simulate 5 seconds of processing
    
    // Return a response with the video ID for the client to poll
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Video generation started',
        videoId: videoRecord.id,
        estimatedCompletionTime: '15 seconds'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202 // Accepted
      }
    )
  } catch (error) {
    console.error('Error generating video:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An unknown error occurred',
        details: error.stack || null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.status || 500
      }
    )
  }
})
