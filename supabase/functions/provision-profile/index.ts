import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { initSupabaseClient, getCorsHeaders, verifyAuth } from "../_shared/utils.ts";

interface ProvisionProfileRequest {
  id?: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

const FREE_SIGNUP_CREDITS = 3;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

    const body = (await req.json().catch(() => ({}))) as ProvisionProfileRequest;
    if (body.id && body.id !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Cannot provision another user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = initSupabaseClient();
    const name = body.name?.trim() || body.email?.split("@")[0] || "";

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: authenticatedUserId,
        email: body.email || "",
        name,
        avatar_url: body.avatar_url || "",
        subscription_status: "free",
      }, { onConflict: "id" })
      .select("*")
      .single();

    if (profileError) throw profileError;

    const { error: creditsError } = await supabase
      .from("user_credits")
      .upsert({
        user_id: authenticatedUserId,
        balance: FREE_SIGNUP_CREDITS,
        total_earned: FREE_SIGNUP_CREDITS,
        subscription_status: "none",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id", ignoreDuplicates: true });

    if (creditsError) throw creditsError;

    const { data: existingBonus, error: bonusLookupError } = await supabase
      .from("credit_transactions")
      .select("id")
      .eq("user_id", authenticatedUserId)
      .eq("transaction_type", "adjustment")
      .eq("metadata->>source", "signup_bonus")
      .maybeSingle();

    if (bonusLookupError) throw bonusLookupError;

    if (!existingBonus) {
      const { error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: authenticatedUserId,
          amount: FREE_SIGNUP_CREDITS,
          transaction_type: "adjustment",
          description: "Welcome bonus: 3 free credits on signup",
          balance_after_transaction: FREE_SIGNUP_CREDITS,
          metadata: { source: "signup_bonus" },
        });

      if (transactionError) throw transactionError;
    }

    return new Response(JSON.stringify({ profile, credits: FREE_SIGNUP_CREDITS }), {
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
