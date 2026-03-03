import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_DAYS: Record<string, number> = {
  mensual: 30,
  trimestral: 90,
  semestral: 180,
};

const log = (step: string, details?: Record<string, unknown>) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${d}`);
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeKey || !webhookSecret || !supabaseUrl || !supabaseKey) {
    log("ERROR", { message: "Missing env vars" });
    return new Response("Server config error", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabase = createClient(supabaseUrl, supabaseKey);

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    log("ERROR", { message: "Missing stripe-signature header" });
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("Signature verification failed", { error: msg });
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  log("Event received", { type: event.type, id: event.id });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const plan = session.metadata?.plan;
      const waId = session.metadata?.wa_id;
      const sessionId = session.id;
      const paymentIntentId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null;

      log("checkout.session.completed", { plan, wa_id: waId?.slice(0, 4), sessionId });

      if (!plan || !waId || waId === "web_visitor") {
        log("Skipping - missing plan or wa_id", { plan, waId });
        return new Response(JSON.stringify({ received: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const days = PLAN_DAYS[plan];
      if (!days) {
        log("Unknown plan", { plan });
        return new Response(JSON.stringify({ received: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Idempotency: check if this session was already processed
      const { data: existingUser } = await supabase
        .from("wa_users")
        .select("wa_id, stripe_session_id")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();

      if (existingUser) {
        log("Idempotent skip - session already processed", { sessionId });
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Calculate expiration
      const now = new Date();
      const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      // Update user subscription
      const { error: updateError } = await supabase
        .from("wa_users")
        .update({
          is_subscribed: true,
          subscription_status: "active",
          subscription_plan: plan,
          subscription_started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          stripe_session_id: sessionId,
          stripe_payment_intent_id: paymentIntentId,
        })
        .eq("wa_id", waId);

      if (updateError) {
        log("ERROR updating user", { error: updateError.message, waId: waId.slice(0, 4) });
        return new Response(JSON.stringify({ error: "DB update failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Track event
      await supabase.from("wa_events").insert({
        wa_id: waId,
        event_type: "subscription_activated",
        metadata: {
          plan,
          days,
          expires_at: expiresAt.toISOString(),
          stripe_session_id: sessionId,
          stripe_payment_intent_id: paymentIntentId,
          source: "stripe_webhook",
          stripe_event_id: event.id,
        },
      });

      log("Subscription activated", {
        waId: waId.slice(0, 4),
        plan,
        expiresAt: expiresAt.toISOString(),
      });

    } else if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      log("payment_intent.succeeded (log only)", {
        id: pi.id,
        amount: pi.amount,
        wa_id: pi.metadata?.wa_id?.slice(0, 4),
      });
    } else {
      log("Unhandled event type", { type: event.type });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR processing event", { error: msg, type: event.type });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
