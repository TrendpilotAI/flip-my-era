
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY')
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // Sarah's voice ID

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()

    if (!text) {
      console.error('No text provided');
      throw new Error('Text is required')
    }

    if (!ELEVEN_LABS_API_KEY) {
      console.error('ElevenLabs API key not found');
      throw new Error('API key not configured')
    }

    console.log('Sending request to ElevenLabs...');
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_LABS_API_KEY,
      },
      body: JSON.stringify({
        text: text.slice(0, 4000), // ElevenLabs has a text limit
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
          style: 0.5,
          speaking_rate: 0.85,
        }
      }),
    })

    if (!response.ok) {
      const errorData = await response.text();
      console.error('ElevenLabs API error:', errorData);
      throw new Error(`ElevenLabs API error: ${errorData}`);
    }

    console.log('Successfully received audio from ElevenLabs');
    const audioBuffer = await response.arrayBuffer()
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in text-to-speech function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString() 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
