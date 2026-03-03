import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const ALLOWED_ORIGINS = [
  "https://speakeasilynexo-digitalapp.lovable.app",
  "https://speakeasily.nexo-digital.app",
  "https://id-preview--7e6cd3f6-c3cb-4553-8264-e3614eec45bc.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-token",
  };
}

interface ActivateRequest {
  wa_id: string;
  plan: "mensual" | "trimestral" | "semestral";
  source?: string;
}

serve(async (req: Request) => {
  console.log(`[ACTIVATE-SUBSCRIPTION] ${req.method} ${req.url}`);

  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate internal token
  const internalToken = Deno.env.get("INTERNAL_API_TOKEN");
  const providedToken = req.headers.get("x-internal-token");
  if (!internalToken || providedToken !== internalToken) {
    console.error("[ACTIVATE-SUBSCRIPTION] Invalid or missing x-internal-token");
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: ActivateRequest;
  try {
    body = await req.json();
  } catch (e) {
    console.error("[ACTIVATE-SUBSCRIPTION] Failed to parse body:", e);
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { wa_id, plan, source } = body;

  if (!wa_id || !plan) {
    return new Response(JSON.stringify({ error: "Missing wa_id or plan" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const validPlans = ["mensual", "trimestral", "semestral"];
  if (!validPlans.includes(plan)) {
    return new Response(JSON.stringify({ error: "Invalid plan" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    console.error("[ACTIVATE-SUBSCRIPTION] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from("wa_users")
      .select("wa_id, is_subscribed, subscription_plan")
      .eq("wa_id", wa_id)
      .maybeSingle();

    if (fetchError) {
      console.error("[ACTIVATE-SUBSCRIPTION] Error fetching user:", fetchError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!user) {
      console.log("[ACTIVATE-SUBSCRIPTION] User not found:", wa_id.slice(0, 4) + "****");
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update subscription status
    const { error: updateError } = await supabase
      .from("wa_users")
      .update({
        is_subscribed: true,
        subscription_plan: plan,
        subscription_status: "paid",
      })
      .eq("wa_id", wa_id);

    if (updateError) {
      console.error("[ACTIVATE-SUBSCRIPTION] Error updating user:", updateError);
      return new Response(JSON.stringify({ error: "Failed to activate subscription" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Track subscription_activated event
    await supabase.from("wa_events").insert({
      wa_id: wa_id,
      event_type: "subscription_activated",
      metadata: {
        plan,
        source: source || "subscribe_page",
        previous_plan: user.subscription_plan || null,
        was_subscribed: user.is_subscribed || false,
      },
    });

    console.log("[ACTIVATE-SUBSCRIPTION] Success for:", wa_id.slice(0, 4) + "****", "Plan:", plan);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Subscription activated",
      plan,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[ACTIVATE-SUBSCRIPTION] Unexpected error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
