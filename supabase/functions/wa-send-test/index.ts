import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Public test endpoint - TEMPORARY for debugging
// Delete after testing is complete

serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const to = url.searchParams.get("to");
  const text = url.searchParams.get("text") || "Teste de conexão WhatsApp ✅";

  if (!to) {
    return new Response(JSON.stringify({ error: "Missing 'to' parameter" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  console.log("[WA-Send-Test] Starting...");
  console.log("[WA-Send-Test] Phone Number ID:", phoneNumberId);
  console.log("[WA-Send-Test] Access Token length:", accessToken?.length || 0);
  console.log("[WA-Send-Test] To:", to);

  if (!accessToken || !phoneNumberId) {
    console.error("[WA-Send-Test] Missing credentials");
    return new Response(JSON.stringify({ 
      error: "Missing WhatsApp credentials",
      hasAccessToken: !!accessToken,
      hasPhoneNumberId: !!phoneNumberId,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const graphUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  try {
    console.log(`[WA-Send-Test] Sending to ${to}: "${text}"`);

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

    console.log("[WA-Send-Test] Status:", response.status);
    console.log("[WA-Send-Test] Response:", JSON.stringify(result));

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "WhatsApp API error",
          status: response.status,
          details: result,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Message sent successfully!",
        messageId: result.messages?.[0]?.id,
        result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[WA-Send-Test] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
