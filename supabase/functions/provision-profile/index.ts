import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCors, initSupabaseClient, verifyAuth } from "../_shared/utils.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authenticatedUserId = await verifyAuth(req);
    if (!authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body as Record<string, unknown>).length > 0
    ) {
      return new Response(JSON.stringify({ error: "Identity fields are server-managed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = initSupabaseClient();
    const { data, error } = await supabase.rpc("provision_betterauth_profile", {
      p_user_id: authenticatedUserId,
    });
    if (error) throw error;
    const provisioned = Array.isArray(data) ? data[0] : data;
    if (!provisioned) throw new Error("Profile provisioning returned no result");

    return new Response(JSON.stringify(provisioned), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[provision-profile] error", error);
    return new Response(JSON.stringify({ error: "Failed to provision profile" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
