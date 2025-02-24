
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MAILGUN_API_KEY = Deno.env.get('MAILGUN_API_KEY');
const MAILGUN_DOMAIN = 'flipmyera.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const templates = [
  {
    name: 'welcome_email',
    description: 'Welcome email for new users',
    template: `
      <h1>Welcome to FlipMyEra, {{username}}!</h1>
      <p>We're excited to have you join us on this journey.</p>
      <p>Get ready to explore all the amazing features {{app_name}} has to offer.</p>
      <p>Best regards,<br>The FlipMyEra Team</p>
    `,
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!MAILGUN_API_KEY) {
      throw new Error('MAILGUN_API_KEY is not set');
    }

    console.log('Starting template migration...');
    const results = [];

    for (const template of templates) {
      console.log(`Migrating template: ${template.name}`);
      
      const MAILGUN_API_URL = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/templates`;
      
      // First, try to create the template
      const response = await fetch(MAILGUN_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          template: template.template,
        }),
      });

      const responseText = await response.text();
      console.log(`Mailgun API response for ${template.name}:`, responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = { message: responseText };
      }

      results.push({
        template: template.name,
        success: response.ok,
        result,
      });
    }

    console.log('Migration completed:', results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in migrate-email-templates function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
