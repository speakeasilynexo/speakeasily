import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const to = url.searchParams.get("to");
  const text = url.searchParams.get("text");

  if (!to || !text) {
    return new Response(
      JSON.stringify({ error: "Missing 'to' or 'text' query parameters" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    console.error("[WA-Test] Missing WhatsApp credentials");
    return new Response(
      JSON.stringify({ error: "WhatsApp credentials not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const graphUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  try {
    console.log(`[WA-Test] Sending message to ${to}: "${text.substring(0, 50)}..."`);

    const response = await fetch(graphUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: { body: text },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[WA-Test] WhatsApp API error:", JSON.stringify(result));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "WhatsApp API error",
          details: result 
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[WA-Test] Message sent successfully:", JSON.stringify(result));
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Message sent successfully",
        messageId: result.messages?.[0]?.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[WA-Test] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Failed to send message",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
