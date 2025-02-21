
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Text-to-speech function invoked');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
  const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah's voice

  try {
    const { text } = await req.json();
    console.log('Received text length:', text?.length);

    if (!text) {
      throw new Error('No text provided');
    }

    if (!ELEVEN_LABS_API_KEY) {
      throw new Error('ElevenLabs API key not found');
    }

    // Trim text to ElevenLabs limit
    const trimmedText = text.slice(0, 4000);
    console.log('Making request to ElevenLabs...');

    const elevenlabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVEN_LABS_API_KEY,
        },
        body: JSON.stringify({
          text: trimmedText,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
          }
        }),
      }
    );

    if (!elevenlabsResponse.ok) {
      const errorText = await elevenlabsResponse.text();
      console.error('ElevenLabs error:', errorText);
      throw new Error(`ElevenLabs API error: ${errorText}`);
    }

    console.log('Successfully received audio from ElevenLabs');
    const audioBuffer = await elevenlabsResponse.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in text-to-speech function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        details: error.toString()
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
