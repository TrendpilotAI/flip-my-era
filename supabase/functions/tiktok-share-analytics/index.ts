import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { 
  handleCors, 
  initSupabaseClient, 
  formatErrorResponse, 
  formatSuccessResponse 
} from "../_shared/utils.ts"

interface ShareAnalyticsRequest {
  text: string;
  videoUrl: string;
  musicUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { text, videoUrl, musicUrl } = await req.json() as ShareAnalyticsRequest;

    if (!text || !videoUrl) {
      throw new Error('Missing required fields: text and videoUrl are required');
    }

    // Initialize Supabase client
    const supabase = initSupabaseClient();

    // Log the share event
    const { error } = await supabase
      .from('tiktok_shares')
      .insert([
        {
          text_snippet: text.substring(0, 255),
          video_url: videoUrl,
          music_url: musicUrl,
          created_at: new Date().toISOString(),
        }
      ]);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return formatSuccessResponse({ message: 'Share analytics recorded successfully' });
  } catch (error) {
    return formatErrorResponse(error);
  }
});
