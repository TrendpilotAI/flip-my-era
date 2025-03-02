import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { 
  handleCors, 
  formatErrorResponse, 
  formatSuccessResponse 
} from "../_shared/utils.ts"

interface TextToSpeechRequest {
  text: string;
}

serve(async (req) => {
  console.log('Text-to-speech function invoked');

  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { text } = await req.json() as TextToSpeechRequest;
    console.log('Received text length:', text?.length);

    if (!text) {
      throw new Error('No text provided');
    }

    const apiKey = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!apiKey) {
      throw new Error('ElevenLabs API key not found');
    }

    const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah's voice

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
          'xi-api-key': apiKey,
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

    return formatSuccessResponse({ audioContent: base64Audio });
  } catch (error) {
    return formatErrorResponse(error, 400);
  }
});
