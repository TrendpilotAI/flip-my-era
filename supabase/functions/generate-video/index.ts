import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { 
  handleCors, 
  initSupabaseClient, 
  formatErrorResponse, 
  formatSuccessResponse 
} from "../_shared/utils.ts";

interface VideoRequest {
  text: string;
  template: 'story' | 'quote' | 'slideshow';
  userId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Parse request body
    const requestData = await req.json() as VideoRequest;
    const { text, template, userId } = requestData;
    
    if (!text || !template) {
      throw new Error('Missing required fields: text and template are required');
    }
    
    // Initialize Supabase client
    const supabase = initSupabaseClient();

    // Get the Supabase URL early to ensure consistency
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('Missing Supabase URL environment variable');
    }

    // Generate a unique filename
    const timestamp = new Date().getTime();
    const randomId = Math.random().toString(36).substring(2, 10);
    const filename = `${timestamp}-${randomId}-${template}.mp4`;
    
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
      .single();
      
    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }
    
    // Prepare the video URL that will be used after processing
    const videoUrl = `${supabaseUrl}/storage/v1/object/public/videos/${filename}`;
    
    // In a production environment, you would trigger an actual video generation service here
    // For example, sending a request to a video generation API or queuing a background job
    
    // For now, we'll simulate processing with a delay and then mark it as complete
    setTimeout(async () => {
      // Update the record to mark it as complete
      await supabase
        .from('videos')
        .update({ 
          status: 'completed',
          video_url: videoUrl
        })
        .eq('id', videoRecord.id);
    }, 5000); // Simulate 5 seconds of processing
    
    // Return a response with the video ID for the client to poll
    return formatSuccessResponse({ 
      message: 'Video generation started',
      videoId: videoRecord.id,
      estimatedCompletionTime: '15 seconds'
    }, 202); // Accepted
  } catch (error) {
    return formatErrorResponse(error as Error);
  }
});
