
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseTemplates = {
  "confirm_signup": {
    subject: "Confirm Your Signup",
    content: `<h2>Confirm Your Email</h2>
      <p>Follow this link to confirm your email:</p>
      <p><a href="{{ .ConfirmationURL }}">Confirm your email address</a></p>`,
  },
  "invite": {
    subject: "You've Been Invited",
    content: `<h2>You've Been Invited</h2>
      <p>You've been invited to join. Follow this link to accept the invite:</p>
      <p><a href="{{ .ConfirmationURL }}">Accept invitation</a></p>`,
  },
  "magic_link": {
    subject: "Your Magic Link",
    content: `<h2>Magic Link Login</h2>
      <p>Follow this link to log in:</p>
      <p><a href="{{ .ConfirmationURL }}">Log in</a></p>`,
  },
  "reset_password": {
    subject: "Reset Your Password",
    content: `<h2>Reset Password</h2>
      <p>Follow this link to reset the password for your account:</p>
      <p><a href="{{ .ConfirmationURL }}">Reset password</a></p>`,
  },
  "change_email": {
    subject: "Confirm Email Change",
    content: `<h2>Confirm Email Change</h2>
      <p>Follow this link to confirm the email change for your account:</p>
      <p><a href="{{ .ConfirmationURL }}">Change email</a></p>`,
  }
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const templateResponses = [];

    // Create templates in Brevo
    for (const [name, template] of Object.entries(supabaseTemplates)) {
      console.log(`Creating template: ${name}`);
      
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
      templateResponses.push({ name, ...data });
    }

    return new Response(JSON.stringify(templateResponses), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error in migrate-email-templates function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

