import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

// Types for WhatsApp webhook payload
interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
}

interface WhatsAppContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: WhatsAppContact[];
        messages?: WhatsAppMessage[];
      };
      field: string;
    }>;
  }>;
}

interface StateData {
  answers?: string[];
  currentQuestion?: number;
  score?: number;
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Leveling questions
const LEVEL_QUESTIONS = [
  {
    question: "🇬🇧 *Question 1/3*\n\nComplete the sentence:\n\n\"I ___ to the supermarket yesterday.\"\n\nA) go\nB) went\nC) going\nD) gone",
    correctAnswer: "B",
    difficulty: 1,
  },
  {
    question: "🇬🇧 *Question 2/3*\n\nWhich sentence is correct?\n\nA) If I would have time, I will help you.\nB) If I had time, I would help you.\nC) If I have time, I would help you.\nD) If I had time, I will help you.",
    correctAnswer: "B",
    difficulty: 2,
  },
  {
    question: "🇬🇧 *Question 3/3*\n\nChoose the best option:\n\n\"By the time I arrived, she ___.\"\n\nA) has already left\nB) already left\nC) had already left\nD) was already leaving",
    correctAnswer: "C",
    difficulty: 3,
  },
];

// Mini lessons based on level
const MINI_LESSONS: Record<string, string> = {
  beginner: `🎯 *Your Level: Beginner*\n\n📚 *Today's Mini Lesson: Present Simple*\n\nWe use Present Simple for:\n✅ Habits: "I *drink* coffee every morning."\n✅ Facts: "The sun *rises* in the east."\n\n🏋️ *Exercise:*\nComplete: "She ___ (work) at a hospital."\n\nReply with your answer!`,
  
  elementary: `🎯 *Your Level: Elementary*\n\n📚 *Today's Mini Lesson: Past Simple*\n\nWe use Past Simple for finished actions:\n✅ "I *visited* London last year."\n✅ "They *didn't watch* the movie."\n\n🏋️ *Exercise:*\nComplete: "We ___ (go) to the beach yesterday."\n\nReply with your answer!`,
  
  pre_intermediate: `🎯 *Your Level: Pre-Intermediate*\n\n📚 *Today's Mini Lesson: Present Perfect*\n\nWe use it for:\n✅ Experiences: "I *have visited* Paris."\n✅ Recent actions: "She *has just* arrived."\n\n🏋️ *Exercise:*\nComplete: "They ___ never ___ (see) snow."\n\nReply with your answer!`,
  
  intermediate: `🎯 *Your Level: Intermediate*\n\n📚 *Today's Mini Lesson: Conditionals*\n\n*Second Conditional* (unreal situations):\n✅ "If I *had* more time, I *would* travel."\n\n🏋️ *Exercise:*\nComplete: "If she ___ (be) here, she ___ (help) us."\n\nReply with your answer!`,
  
  upper_intermediate: `🎯 *Your Level: Upper-Intermediate*\n\n📚 *Today's Mini Lesson: Passive Voice*\n\nWe use passive when the action is more important:\n✅ "The report *was written* by the team."\n✅ "Mistakes *have been made*."\n\n🏋️ *Exercise:*\nRewrite in passive: "Someone stole my wallet."\n\nReply with your answer!`,
  
  advanced: `🎯 *Your Level: Advanced*\n\n📚 *Today's Mini Lesson: Inversion*\n\nFor emphasis, we can invert subject and auxiliary:\n✅ "Never *have I seen* such beauty."\n✅ "Rarely *does she* complain."\n\n🏋️ *Exercise:*\nRewrite with inversion: "I had hardly sat down when the phone rang."\n\nReply with your answer!`,
};

// Calculate level based on score
function calculateLevel(score: number): string {
  if (score <= 0) return "beginner";
  if (score === 1) return "elementary";
  if (score === 2) return "pre_intermediate";
  return "intermediate";
}

// Send WhatsApp message
async function sendWhatsAppText(to: string, body: string): Promise<boolean> {
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    console.error("[WhatsApp] Missing credentials");
    return false;
  }

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
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
        text: { body },
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error("[WhatsApp] Send failed:", JSON.stringify(result));
      return false;
    }

    console.log("[WhatsApp] Message sent successfully to:", to);
    return true;
  } catch (error) {
    console.error("[WhatsApp] Error sending message:", error);
    return false;
  }
}

// Use explicit any for Supabase client to avoid complex generic issues
// deno-lint-ignore no-explicit-any
type SupabaseClientType = ReturnType<typeof createClient<any>>;

// Get or create user
async function getOrCreateUser(
  supabase: SupabaseClientType,
  waId: string,
  name: string | null
): Promise<{ wa_id: string; name: string | null; level: string | null } | null> {
  // Try to get existing user
  const { data: existingUser, error: fetchError } = await supabase
    .from("wa_users")
    .select("wa_id, name, level")
    .eq("wa_id", waId)
    .maybeSingle();

  if (fetchError) {
    console.error("[DB] Error fetching user:", fetchError);
    return null;
  }

  if (existingUser) {
    return {
      wa_id: existingUser.wa_id as string,
      name: existingUser.name as string | null,
      level: existingUser.level as string | null,
    };
  }

  // Create new user
  const { data: newUser, error: createError } = await supabase
    .from("wa_users")
    .insert({ wa_id: waId, name })
    .select("wa_id, name, level")
    .single();

  if (createError) {
    console.error("[DB] Error creating user:", createError);
    return null;
  }

  console.log("[DB] Created new user:", waId);
  return {
    wa_id: newUser.wa_id as string,
    name: newUser.name as string | null,
    level: newUser.level as string | null,
  };
}

// Get or create conversation state
async function getOrCreateState(
  supabase: SupabaseClientType,
  waId: string
): Promise<{ step: string; data: StateData } | null> {
  const { data: existingState, error: fetchError } = await supabase
    .from("wa_state")
    .select("step, data")
    .eq("wa_id", waId)
    .maybeSingle();

  if (fetchError) {
    console.error("[DB] Error fetching state:", fetchError);
    return null;
  }

  if (existingState) {
    return {
      step: existingState.step as string,
      data: (existingState.data || {}) as StateData,
    };
  }

  // Create new state
  const { data: newState, error: createError } = await supabase
    .from("wa_state")
    .insert({ wa_id: waId, step: "welcome", data: {} })
    .select("step, data")
    .single();

  if (createError) {
    console.error("[DB] Error creating state:", createError);
    return null;
  }

  return {
    step: newState.step as string,
    data: (newState.data || {}) as StateData,
  };
}

// Update conversation state
async function updateState(
  supabase: SupabaseClientType,
  waId: string,
  step: string,
  data: StateData
): Promise<void> {
  const { error } = await supabase
    .from("wa_state")
    .update({ step, data })
    .eq("wa_id", waId);

  if (error) {
    console.error("[DB] Error updating state:", error);
  }
}

// Update user level
async function updateUserLevel(
  supabase: SupabaseClientType,
  waId: string,
  level: string
): Promise<void> {
  const { error } = await supabase
    .from("wa_users")
    .update({ level })
    .eq("wa_id", waId);

  if (error) {
    console.error("[DB] Error updating user level:", error);
  }
}

// Process incoming message
async function processMessage(
  supabase: SupabaseClientType,
  waId: string,
  userName: string | null,
  messageText: string
): Promise<void> {
  const user = await getOrCreateUser(supabase, waId, userName);
  if (!user) {
    console.error("[Flow] Could not get/create user");
    return;
  }

  const state = await getOrCreateState(supabase, waId);
  if (!state) {
    console.error("[Flow] Could not get/create state");
    return;
  }

  console.log("[Flow] Current step:", state.step, "for user:", waId);

  const displayName = userName || "friend";
  const normalizedAnswer = messageText.trim().toUpperCase();

  switch (state.step) {
    case "welcome": {
      // Send welcome message and start leveling
      await sendWhatsAppText(
        waId,
        `🎓 *Welcome to SpeakEasily, ${displayName}!*\n\nI'm your English learning assistant. Let's start with a quick assessment to find your level.\n\nReady? Let's go! 🚀`
      );

      // Wait a moment, then send first question
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await sendWhatsAppText(waId, LEVEL_QUESTIONS[0].question);
      await updateState(supabase, waId, "question_1", { answers: [], currentQuestion: 0, score: 0 });
      break;
    }

    case "question_1":
    case "question_2":
    case "question_3": {
      const questionIndex = state.data.currentQuestion ?? 0;
      const currentQuestion = LEVEL_QUESTIONS[questionIndex];
      const answers = state.data.answers ?? [];
      let score = state.data.score ?? 0;

      // Check if answer is valid (A, B, C, or D)
      if (!["A", "B", "C", "D"].includes(normalizedAnswer)) {
        await sendWhatsAppText(
          waId,
          "Please reply with A, B, C, or D 📝"
        );
        return;
      }

      // Record answer
      answers.push(normalizedAnswer);
      
      // Check if correct
      if (normalizedAnswer === currentQuestion.correctAnswer) {
        score += currentQuestion.difficulty;
      }

      // Check if there are more questions
      if (questionIndex < LEVEL_QUESTIONS.length - 1) {
        const nextQuestion = LEVEL_QUESTIONS[questionIndex + 1];
        await sendWhatsAppText(waId, nextQuestion.question);
        await updateState(supabase, waId, `question_${questionIndex + 2}`, {
          answers,
          currentQuestion: questionIndex + 1,
          score,
        });
      } else {
        // Assessment complete - calculate level
        const level = calculateLevel(score);
        await updateUserLevel(supabase, waId, level);
        
        // Send result and mini lesson
        await sendWhatsAppText(waId, MINI_LESSONS[level]);
        await updateState(supabase, waId, "lesson", { answers, score });
      }
      break;
    }

    case "lesson": {
      // User replied to exercise
      await sendWhatsAppText(
        waId,
        `Great job practicing! 👏\n\nYour answer: "${messageText}"\n\nI'll check this and give you feedback soon. Keep practicing! 💪\n\nType "restart" to take the level test again, or just keep chatting to practice!`
      );
      await updateState(supabase, waId, "practice", state.data);
      break;
    }

    case "practice":
    default: {
      // General practice mode
      if (messageText.toLowerCase() === "restart") {
        await sendWhatsAppText(waId, "Let's start fresh! 🔄");
        await updateState(supabase, waId, "welcome", {});
        // Trigger welcome flow
        await processMessage(supabase, waId, userName, "start");
      } else {
        await sendWhatsAppText(
          waId,
          `Thanks for your message! 📩\n\nI'm still learning. Type "restart" to take the level test again.`
        );
      }
      break;
    }
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Handle GET request (webhook verification)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    console.log("[Webhook] Verification request received");

    if (mode === "subscribe" && token === verifyToken) {
      console.log("[Webhook] Verification successful");
      return new Response(challenge, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    console.error("[Webhook] Verification failed");
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // Handle POST request (incoming messages)
  if (req.method === "POST") {
    try {
      const body: WhatsAppWebhookPayload = await req.json();
      
      console.log("[Webhook] Received payload:", JSON.stringify(body).substring(0, 500));

      // Validate payload structure
      if (body.object !== "whatsapp_business_account") {
        console.log("[Webhook] Not a WhatsApp payload, ignoring");
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error("[Webhook] Missing Supabase credentials");
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const supabase: SupabaseClientType = createClient(supabaseUrl, supabaseServiceKey);

      // Process each entry
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // Only process message events
          if (!value.messages || value.messages.length === 0) {
            continue;
          }

          for (const message of value.messages) {
            // Only handle text messages
            if (message.type !== "text" || !message.text) {
              console.log("[Webhook] Skipping non-text message");
              continue;
            }

            const waId = message.from;
            const messageText = message.text.body;
            
            // Get contact name if available
            const contact = value.contacts?.find(c => c.wa_id === waId);
            const userName = contact?.profile?.name ?? null;

            console.log(`[Webhook] Processing message from ${waId}: "${messageText.substring(0, 50)}"`);

            // Process the message (fire and forget to respond quickly)
            processMessage(supabase, waId, userName, messageText).catch(err => {
              console.error("[Webhook] Error in processMessage:", err);
            });
          }
        }
      }

      // Respond quickly with 200
      return new Response("OK", { status: 200, headers: corsHeaders });
    } catch (error) {
      console.error("[Webhook] Error processing payload:", error);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
