import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { 
  handleCors, 
  formatErrorResponse, 
  formatSuccessResponse 
} from "../_shared/utils.ts";

interface EmailRequest {
  to: string;
  templateId: number;
  params?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { to, templateId, params } = await req.json() as EmailRequest;

    console.log("Sending email to:", to);
    console.log("Using template:", templateId);
    console.log("With params:", params);

    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      throw new Error('Missing Brevo API key');
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        to: [{ email: to }],
        templateId: templateId,
        params: params,
      }),
    });

    const data = await response.json();
    console.log("Brevo API response:", data);

    if (!response.ok) {
      throw new Error(`Brevo API error: ${JSON.stringify(data)}`);
    }

    return formatSuccessResponse(data);
  } catch (error) {
    return formatErrorResponse(error);
  }
});
