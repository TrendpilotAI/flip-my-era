
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MAILGUN_API_KEY = Deno.env.get('MAILGUN_API_KEY');
const MAILGUN_DOMAIN = 'flipmyera.com'; // This should match your verified domain in Mailgun
const MAILGUN_API_URL = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  params?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!MAILGUN_API_KEY) {
      throw new Error('MAILGUN_API_KEY is not set');
    }

    const { to, subject, html, params } = await req.json() as EmailRequest;
    console.log('Received request:', { to, subject, params });

    // Replace any parameters in the HTML content
    let processedHtml = html;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        processedHtml = processedHtml.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
    }

    // Create form data for Mailgun API
    const formData = new FormData();
    formData.append('from', `FlipMyEra <noreply@${MAILGUN_DOMAIN}>`);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', processedHtml);

    const response = await fetch(MAILGUN_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Mailgun API error:', error);
      throw new Error(`Mailgun API error: ${error}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in email function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
