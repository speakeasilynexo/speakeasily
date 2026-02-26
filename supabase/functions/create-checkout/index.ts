import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type PlanId = "mensual" | "trimestral" | "semestral";

interface PlanConfig {
  label: string;
  amount: number; // cents
  currency: string;
  intervalDisplay: string;
}

const PLANS: Record<PlanId, PlanConfig> = {
  mensual: {
    label: "SpeakEasily Mensual",
    amount: 799,
    currency: "eur",
    intervalDisplay: "1 mes",
  },
  trimestral: {
    label: "SpeakEasily Trimestral",
    amount: 1999,
    currency: "eur",
    intervalDisplay: "3 meses",
  },
  semestral: {
    label: "SpeakEasily Semestral",
    amount: 3499,
    currency: "eur",
    intervalDisplay: "6 meses",
  },
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${d}`);
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { plan, wa_id, lang, source } = (await req.json()) as {
      plan: string;
      wa_id: string | null;
      lang?: string;
      source?: string;
    };

    if (!plan || !(plan in PLANS)) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planConfig = PLANS[plan as PlanId];
    logStep("Plan selected", { plan, wa_id: wa_id?.slice(0, 4) ?? "none" });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const origin = req.headers.get("origin") || "https://speakeasilynexo-digitalapp.lovable.app";

    const successParams = new URLSearchParams({
      plan,
      ...(wa_id ? { wa_id } : {}),
      ...(lang ? { lang } : {}),
    });

    const cancelParams = new URLSearchParams({
      ...(wa_id ? { wa_id } : {}),
      ...(lang ? { lang } : {}),
      ...(source ? { source } : {}),
    });

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: planConfig.currency,
            product_data: {
              name: planConfig.label,
              description: `Acceso por ${planConfig.intervalDisplay}`,
            },
            unit_amount: planConfig.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/success?${successParams.toString()}`,
      cancel_url: `${origin}/subscribe?${cancelParams.toString()}`,
      metadata: {
        plan,
        wa_id: wa_id || "web_visitor",
        source: source || "subscribe_page",
      },
      payment_intent_data: {
        metadata: {
          plan,
          wa_id: wa_id || "web_visitor",
        },
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    // Track event
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("wa_events").insert({
        wa_id: wa_id || "web_visitor",
        event_type: "checkout_started",
        metadata: { plan, source: source || "subscribe_page", session_id: session.id },
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
