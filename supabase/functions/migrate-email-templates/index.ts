
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseTemplates = {
  "confirm_signup": {
    subject: "Confirm Your Email",
    content: `<h2>Confirm Your Email</h2>
      <p>Follow this link to confirm your user account: {{ .ConfirmationURL }}</p>`,
  },
  "invite": {
    subject: "You have been invited",
    content: `<h2>You have been invited</h2>
      <p>You have been invited to create a user account. Follow this link to accept the invite: {{ .ConfirmationURL }}</p>`,
  },
  "magic_link": {
    subject: "Your Login Link",
    content: `<h2>Magic Link</h2>
      <p>Follow this link to login: {{ .ConfirmationURL }}</p>`,
  },
  "recovery": {
    subject: "Reset Your Password",
    content: `<h2>Reset Password</h2>
      <p>Follow this link to reset the password for your user account: {{ .ConfirmationURL }}</p>`,
  },
  "email_change": {
    subject: "Confirm Email Change",
    content: `<h2>Confirm Email Change</h2>
      <p>Follow this link to confirm the update of your email address: {{ .ConfirmationURL }}</p>`,
  }
};

serve(async (req) => {
  console.log('Function started');
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY is not set');
      throw new Error('BREVO_API_KEY is not set');
    }

    console.log('Starting template migration');
    const templateResponses = [];

    // Create templates in Brevo
    for (const [name, template] of Object.entries(supabaseTemplates)) {
      console.log(`Creating template: ${name}`);
      
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/templates', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': BREVO_API_KEY,
          },
          body: JSON.stringify({
            name: name,
            subject: template.subject,
            htmlContent: template.content,
            isActive: true,
          }),
        });

        const data = await response.json();
        console.log(`Template ${name} response:`, data);
        
        if (!response.ok) {
          throw new Error(`Failed to create template ${name}: ${JSON.stringify(data)}`);
        }
        
        templateResponses.push({ name, ...data });
      } catch (error) {
        console.error(`Error creating template ${name}:`, error);
        throw error;
      }
    }

    console.log('All templates created successfully');
    return new Response(JSON.stringify(templateResponses), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error in migrate-email-templates function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        name: error.name 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
