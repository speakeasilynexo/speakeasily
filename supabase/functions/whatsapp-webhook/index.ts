import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

// ============== TYPES ==============

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

interface WhatsAppContact {
  profile: { name: string };
  wa_id: string;
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: WhatsAppContact[];
        messages?: WhatsAppMessage[];
      };
      field: string;
    }>;
  }>;
}

interface LessonProgress {
  lesson_number: number;
  correct_answers: number;
  attempts: number;
  current_exercise?: ExerciseData;
  lesson_history?: LessonHistoryItem[];
}

interface LessonHistoryItem {
  lesson: number;
  correct: boolean;
  answer: string;
  expected?: string;
}

interface ExerciseData {
  type: "translation" | "complete" | "qa";
  prompt: string;
  expected_answer?: string;
  context?: string;
}

interface StateData {
  answers?: string[];
  currentQuestion?: number;
  score?: number;
  progress?: LessonProgress;
}

type EnglishLevel = "beginner" | "elementary" | "pre_intermediate" | "intermediate" | "upper_intermediate" | "advanced";

// deno-lint-ignore no-explicit-any
type SupabaseClientType = ReturnType<typeof createClient<any>>;

// ============== CONSTANTS ==============

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

const LEVEL_DESCRIPTIONS: Record<EnglishLevel, string> = {
  beginner: "Beginner 🌱",
  elementary: "Elementary 📗",
  pre_intermediate: "Pre-Intermediate 📘",
  intermediate: "Intermediate 📙",
  upper_intermediate: "Upper-Intermediate 📕",
  advanced: "Advanced 🎓",
};

const LESSON_TOPICS: Record<EnglishLevel, string[]> = {
  beginner: [
    "Present Simple (I work, she works)",
    "Basic greetings and introductions",
    "Numbers and days of the week",
    "Common verbs (be, have, do)",
    "Simple questions (What, Where, Who)",
  ],
  elementary: [
    "Past Simple (I worked, she went)",
    "There is / There are",
    "Countable and uncountable nouns",
    "Comparatives (bigger, smaller)",
    "Prepositions of place (in, on, at)",
  ],
  pre_intermediate: [
    "Present Perfect (I have done)",
    "Future with 'will' and 'going to'",
    "Modal verbs (can, must, should)",
    "First Conditional (If + present, will)",
    "Adverbs of frequency",
  ],
  intermediate: [
    "Second Conditional (If + past, would)",
    "Present Perfect Continuous",
    "Passive Voice (is done, was made)",
    "Reported Speech basics",
    "Relative clauses (who, which, that)",
  ],
  upper_intermediate: [
    "Third Conditional (If + had, would have)",
    "Mixed Conditionals",
    "Passive with modals (should be done)",
    "Advanced Reported Speech",
    "Inversion for emphasis",
  ],
  advanced: [
    "Subjunctive mood",
    "Cleft sentences (It was... that)",
    "Ellipsis and substitution",
    "Discourse markers",
    "Advanced idiomatic expressions",
  ],
};

// ============== AI FUNCTIONS ==============

async function callAI(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  
  if (!apiKey) {
    console.error("[AI] Missing LOVABLE_API_KEY");
    return "I'm having trouble thinking right now. Please try again!";
  }

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI] Gateway error:", response.status, errorText);
      return "I'm having trouble right now. Let's try again!";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Let me think about that...";
  } catch (error) {
    console.error("[AI] Error calling AI:", error);
    return "Something went wrong. Please try again!";
  }
}

async function generateExercise(level: EnglishLevel, lessonNumber: number): Promise<ExerciseData> {
  const topics = LESSON_TOPICS[level];
  const topicIndex = (lessonNumber - 1) % topics.length;
  const topic = topics[topicIndex];
  
  const exerciseTypes: ExerciseData["type"][] = ["translation", "complete", "qa"];
  const exerciseType = exerciseTypes[lessonNumber % 3];

  const systemPrompt = `You are an English teacher creating exercises for a ${LEVEL_DESCRIPTIONS[level]} student learning via WhatsApp.

RULES:
- Keep everything SHORT (WhatsApp-friendly, max 3-4 lines)
- Use simple, clear language appropriate for the level
- Be encouraging and friendly
- Use emojis sparingly

Create a ${exerciseType} exercise about: ${topic}

Return ONLY a JSON object with this exact format:
{
  "type": "${exerciseType}",
  "prompt": "The exercise text to show the user",
  "expected_answer": "The expected answer (flexible, main idea)",
  "context": "Brief topic being practiced"
}`;

  const response = await callAI(systemPrompt, `Create a ${exerciseType} exercise for lesson ${lessonNumber} about ${topic}`);
  
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ExerciseData;
    }
  } catch (e) {
    console.error("[AI] Failed to parse exercise JSON:", e);
  }

  // Fallback exercise
  return {
    type: exerciseType,
    prompt: getDefaultExercise(level, exerciseType, topic),
    expected_answer: "",
    context: topic,
  };
}

function getDefaultExercise(level: EnglishLevel, type: ExerciseData["type"], topic: string): string {
  const defaults: Record<ExerciseData["type"], string> = {
    translation: `🔄 *Translate to English:*\n\n"Eu gosto de estudar inglês."\n\n_Reply with your translation!_`,
    complete: `✏️ *Complete the sentence:*\n\n"She ___ (go) to school every day."\n\n_Reply with the correct form!_`,
    qa: `💬 *Answer the question:*\n\n"What did you do yesterday?"\n\n_Reply with a short answer!_`,
  };
  return defaults[type];
}

async function evaluateAnswer(
  level: EnglishLevel,
  exercise: ExerciseData,
  userAnswer: string
): Promise<{ correct: boolean; feedback: string }> {
  const systemPrompt = `You are a friendly English teacher evaluating a ${LEVEL_DESCRIPTIONS[level]} student's answer on WhatsApp.

EXERCISE TYPE: ${exercise.type}
EXERCISE: ${exercise.prompt}
EXPECTED ANSWER (flexible): ${exercise.expected_answer || "Accept reasonable answers"}
STUDENT'S ANSWER: ${userAnswer}

RULES:
- Be encouraging and supportive
- Keep feedback SHORT (2-3 lines max, WhatsApp-friendly)
- Use emojis to make it friendly
- If wrong, explain briefly and show the correct answer
- If correct, celebrate briefly

Return ONLY a JSON object:
{
  "correct": true/false,
  "feedback": "Your short, encouraging feedback message"
}`;

  const response = await callAI(systemPrompt, `Evaluate: "${userAnswer}"`);
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        correct: Boolean(result.correct),
        feedback: String(result.feedback),
      };
    }
  } catch (e) {
    console.error("[AI] Failed to parse evaluation JSON:", e);
  }

  // Fallback
  return {
    correct: false,
    feedback: `Thanks for trying! 👏\n\nLet's keep practicing. The expected answer was similar to: "${exercise.expected_answer}"`,
  };
}

// ============== WHATSAPP FUNCTIONS ==============

async function sendWhatsAppText(to: string, body: string): Promise<boolean> {
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    console.error("[WhatsApp] Missing credentials");
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { body },
        }),
      }
    );

    if (!response.ok) {
      const result = await response.json();
      console.error("[WhatsApp] Send failed:", JSON.stringify(result));
      return false;
    }

    console.log("[WhatsApp] Message sent to:", to);
    return true;
  } catch (error) {
    console.error("[WhatsApp] Error:", error);
    return false;
  }
}

async function sendWithDelay(to: string, messages: string[], delayMs = 800): Promise<void> {
  for (const msg of messages) {
    await sendWhatsAppText(to, msg);
    if (messages.indexOf(msg) < messages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// ============== DATABASE FUNCTIONS ==============

async function getOrCreateUser(
  supabase: SupabaseClientType,
  waId: string,
  name: string | null
): Promise<{ wa_id: string; name: string | null; level: EnglishLevel | null } | null> {
  const { data: existing, error: fetchError } = await supabase
    .from("wa_users")
    .select("wa_id, name, level")
    .eq("wa_id", waId)
    .maybeSingle();

  if (fetchError) {
    console.error("[DB] Error fetching user:", fetchError);
    return null;
  }

  if (existing) {
    return {
      wa_id: existing.wa_id as string,
      name: existing.name as string | null,
      level: existing.level as EnglishLevel | null,
    };
  }

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
    level: newUser.level as EnglishLevel | null,
  };
}

async function getOrCreateState(
  supabase: SupabaseClientType,
  waId: string
): Promise<{ step: string; data: StateData } | null> {
  const { data: existing, error: fetchError } = await supabase
    .from("wa_state")
    .select("step, data")
    .eq("wa_id", waId)
    .maybeSingle();

  if (fetchError) {
    console.error("[DB] Error fetching state:", fetchError);
    return null;
  }

  if (existing) {
    return {
      step: existing.step as string,
      data: (existing.data || {}) as StateData,
    };
  }

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

async function updateUserLevel(
  supabase: SupabaseClientType,
  waId: string,
  level: EnglishLevel
): Promise<void> {
  const { error } = await supabase
    .from("wa_users")
    .update({ level })
    .eq("wa_id", waId);

  if (error) {
    console.error("[DB] Error updating level:", error);
  }
}

// ============== LEVEL CALCULATION ==============

function calculateLevel(score: number): EnglishLevel {
  if (score <= 0) return "beginner";
  if (score === 1) return "elementary";
  if (score === 2) return "pre_intermediate";
  if (score === 3) return "intermediate";
  if (score === 4) return "upper_intermediate";
  return "advanced";
}

// ============== MESSAGE PROCESSING ==============

async function processMessage(
  supabase: SupabaseClientType,
  waId: string,
  userName: string | null,
  messageText: string
): Promise<void> {
  const user = await getOrCreateUser(supabase, waId, userName);
  if (!user) return;

  const state = await getOrCreateState(supabase, waId);
  if (!state) return;

  console.log("[Flow] Step:", state.step, "User:", waId);

  const displayName = userName?.split(" ")[0] || "friend";
  const normalizedAnswer = messageText.trim().toUpperCase();
  const lowerMessage = messageText.toLowerCase().trim();

  // Global commands
  if (lowerMessage === "restart" || lowerMessage === "reiniciar") {
    await sendWhatsAppText(waId, "🔄 Let's start fresh!\n\nSend any message to begin your English journey again.");
    await updateState(supabase, waId, "welcome", {});
    return;
  }

  if (lowerMessage === "help" || lowerMessage === "ajuda") {
    await sendWhatsAppText(
      waId,
      `📚 *SpeakEasily Commands*\n\n` +
      `• *next* - Next lesson\n` +
      `• *repeat* - Repeat current lesson\n` +
      `• *progress* - See your progress\n` +
      `• *restart* - Start over\n\n` +
      `Just reply to exercises to practice! 💪`
    );
    return;
  }

  if (lowerMessage === "progress" || lowerMessage === "progresso") {
    const progress = state.data.progress;
    if (progress && user.level) {
      const accuracy = progress.attempts > 0 
        ? Math.round((progress.correct_answers / progress.attempts) * 100) 
        : 0;
      await sendWhatsAppText(
        waId,
        `📊 *Your Progress*\n\n` +
        `🎯 Level: ${LEVEL_DESCRIPTIONS[user.level]}\n` +
        `📖 Lessons completed: ${progress.lesson_number - 1}\n` +
        `✅ Correct answers: ${progress.correct_answers}\n` +
        `📈 Accuracy: ${accuracy}%\n\n` +
        `Keep going! 💪`
      );
    } else {
      await sendWhatsAppText(waId, "You haven't started lessons yet! Send any message to begin. 🚀");
    }
    return;
  }

  // Step-based flow
  switch (state.step) {
    case "welcome": {
      await sendWithDelay(waId, [
        `🎓 *Welcome to SpeakEasily, ${displayName}!*\n\nI'm your personal English coach. Let's discover your level with 3 quick questions! 🚀`,
        LEVEL_QUESTIONS[0].question,
      ]);
      await updateState(supabase, waId, "question_1", { 
        answers: [], 
        currentQuestion: 0, 
        score: 0 
      });
      break;
    }

    case "question_1":
    case "question_2":
    case "question_3": {
      const questionIndex = state.data.currentQuestion ?? 0;
      const currentQuestion = LEVEL_QUESTIONS[questionIndex];
      const answers = state.data.answers ?? [];
      let score = state.data.score ?? 0;

      if (!["A", "B", "C", "D"].includes(normalizedAnswer)) {
        await sendWhatsAppText(waId, "Please reply with *A*, *B*, *C*, or *D* 📝");
        return;
      }

      answers.push(normalizedAnswer);
      if (normalizedAnswer === currentQuestion.correctAnswer) {
        score += currentQuestion.difficulty;
      }

      if (questionIndex < LEVEL_QUESTIONS.length - 1) {
        await sendWhatsAppText(waId, LEVEL_QUESTIONS[questionIndex + 1].question);
        await updateState(supabase, waId, `question_${questionIndex + 2}`, {
          answers,
          currentQuestion: questionIndex + 1,
          score,
        });
      } else {
        // Assessment complete
        const level = calculateLevel(score);
        await updateUserLevel(supabase, waId, level);

        const progress: LessonProgress = {
          lesson_number: 1,
          correct_answers: 0,
          attempts: 0,
          lesson_history: [],
        };

        await updateState(supabase, waId, "level_confirmed", {
          answers,
          score,
          progress,
        });

        await sendWithDelay(waId, [
          `🎉 *Assessment Complete!*\n\nYour level: *${LEVEL_DESCRIPTIONS[level]}*\n\n${getEncouragingMessage(level)}`,
          `📱 *How SpeakEasily Works:*\n\n` +
          `1️⃣ You receive short micro-lessons (5 min)\n` +
          `2️⃣ Each lesson has an exercise\n` +
          `3️⃣ I give you instant feedback\n` +
          `4️⃣ You progress step by step!\n\n` +
          `Ready to start? Just say *"yes"* or *"next"*! 🚀`,
        ]);
      }
      break;
    }

    case "level_confirmed": {
      if (["yes", "sim", "next", "start", "go", "vamos", "bora"].includes(lowerMessage)) {
        await startLesson(supabase, waId, user.level!, state.data);
      } else {
        await sendWhatsAppText(waId, `Just say *"next"* when you're ready to start learning! 📚`);
      }
      break;
    }

    case "lesson": {
      const progress = state.data.progress!;
      const exercise = progress.current_exercise;

      if (!exercise) {
        await startLesson(supabase, waId, user.level!, state.data);
        return;
      }

      // Commands during lesson
      if (lowerMessage === "next" || lowerMessage === "próximo" || lowerMessage === "skip") {
        progress.lesson_number++;
        progress.attempts++;
        await startLesson(supabase, waId, user.level!, { ...state.data, progress });
        return;
      }

      if (lowerMessage === "repeat" || lowerMessage === "repetir") {
        await sendExercise(waId, exercise, progress.lesson_number);
        return;
      }

      // Evaluate answer
      const evaluation = await evaluateAnswer(user.level!, exercise, messageText);
      
      progress.attempts++;
      if (evaluation.correct) {
        progress.correct_answers++;
      }

      progress.lesson_history = progress.lesson_history || [];
      progress.lesson_history.push({
        lesson: progress.lesson_number,
        correct: evaluation.correct,
        answer: messageText,
        expected: exercise.expected_answer,
      });

      await updateState(supabase, waId, "feedback", { ...state.data, progress });

      await sendWithDelay(waId, [
        evaluation.feedback,
        `\n${evaluation.correct ? "🌟" : "📚"} Say *"next"* for the next lesson, or *"repeat"* to try again!`,
      ]);
      break;
    }

    case "feedback": {
      const progress = state.data.progress!;

      if (lowerMessage === "next" || lowerMessage === "próximo" || lowerMessage === "continue") {
        progress.lesson_number++;
        await startLesson(supabase, waId, user.level!, { ...state.data, progress });
      } else if (lowerMessage === "repeat" || lowerMessage === "repetir") {
        const exercise = progress.current_exercise;
        if (exercise) {
          await sendExercise(waId, exercise, progress.lesson_number);
          await updateState(supabase, waId, "lesson", state.data);
        } else {
          await startLesson(supabase, waId, user.level!, state.data);
        }
      } else {
        // Treat as another attempt
        await updateState(supabase, waId, "lesson", state.data);
        await processMessage(supabase, waId, userName, messageText);
      }
      break;
    }

    default: {
      // Unknown state - restart
      await sendWhatsAppText(waId, "Let's continue your learning journey! 🚀");
      if (user.level) {
        await startLesson(supabase, waId, user.level, state.data);
      } else {
        await updateState(supabase, waId, "welcome", {});
        await processMessage(supabase, waId, userName, "start");
      }
      break;
    }
  }
}

async function startLesson(
  supabase: SupabaseClientType,
  waId: string,
  level: EnglishLevel,
  currentData: StateData
): Promise<void> {
  const progress = currentData.progress || {
    lesson_number: 1,
    correct_answers: 0,
    attempts: 0,
    lesson_history: [],
  };

  const topics = LESSON_TOPICS[level];
  const topicIndex = (progress.lesson_number - 1) % topics.length;
  const topic = topics[topicIndex];

  await sendWhatsAppText(
    waId,
    `📖 *Lesson ${progress.lesson_number}*\n\n` +
    `Topic: *${topic}*\n\n` +
    `⏱️ ~5 minutes | Let me prepare your exercise...`
  );

  const exercise = await generateExercise(level, progress.lesson_number);
  progress.current_exercise = exercise;

  await updateState(supabase, waId, "lesson", { ...currentData, progress });

  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendExercise(waId, exercise, progress.lesson_number);
}

async function sendExercise(waId: string, exercise: ExerciseData, lessonNumber: number): Promise<void> {
  const typeEmoji = {
    translation: "🔄",
    complete: "✏️",
    qa: "💬",
  };

  const typeLabel = {
    translation: "Translation",
    complete: "Complete the sentence",
    qa: "Question & Answer",
  };

  await sendWhatsAppText(
    waId,
    `${typeEmoji[exercise.type]} *${typeLabel[exercise.type]}*\n\n` +
    `${exercise.prompt}\n\n` +
    `_Reply with your answer!_`
  );
}

function getEncouragingMessage(level: EnglishLevel): string {
  const messages: Record<EnglishLevel, string> = {
    beginner: "Everyone starts somewhere! You're taking the first step on an exciting journey. 🌱",
    elementary: "Great foundation! Let's build on what you already know. 📗",
    pre_intermediate: "Nice! You have a solid base. Time to level up! 📘",
    intermediate: "Impressive! You communicate well. Let's refine your skills. 📙",
    upper_intermediate: "Excellent! You're almost there. Let's polish those details. 📕",
    advanced: "Outstanding! You're at a high level. Let's master the nuances. 🎓",
  };
  return messages[level];
}

// ============== MAIN HANDLER ==============

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Webhook verification
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token === verifyToken) {
      console.log("[Webhook] Verification successful");
      return new Response(challenge, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // Incoming messages
  if (req.method === "POST") {
    try {
      const body: WhatsAppWebhookPayload = await req.json();

      if (body.object !== "whatsapp_business_account") {
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error("[Webhook] Missing Supabase credentials");
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const supabase: SupabaseClientType = createClient(supabaseUrl, supabaseServiceKey);

      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;
          if (!value.messages?.length) continue;

          for (const message of value.messages) {
            if (message.type !== "text" || !message.text) continue;

            const waId = message.from;
            const contact = value.contacts?.find(c => c.wa_id === waId);
            const userName = contact?.profile?.name ?? null;

            processMessage(supabase, waId, userName, message.text.body).catch(err => {
              console.error("[Webhook] Error in processMessage:", err);
            });
          }
        }
      }

      return new Response("OK", { status: 200, headers: corsHeaders });
    } catch (error) {
      console.error("[Webhook] Error:", error);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
