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

type LearningGoal = "work" | "travel" | "conversation" | "general";
type TrialStatus = "active" | "ended";

interface TrialInfo {
  trial_started_at: string;
  lessons_completed: number;
  trial_status: TrialStatus;
}

interface LessonProgress {
  lesson_number: number;
  correct_answers: number;
  attempts: number;
  consecutive_errors: number;
  current_exercise?: ExerciseData;
  lesson_history?: LessonHistoryItem[];
  goal?: LearningGoal;
  onboarding_complete?: boolean;
  trial?: TrialInfo;
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
  simplified?: boolean;
}

interface StateData {
  answers?: string[];
  currentQuestion?: number;
  score?: number;
  progress?: LessonProgress;
}

type EnglishLevel = "beginner" | "elementary" | "pre_intermediate" | "intermediate" | "upper_intermediate" | "advanced";
type EventType =
  | "lesson_completed"
  | "exercise_failed"
  | "goal_selected"
  | "trial_ended"
  | "level_assessed"
  | "onboarding_complete"
  | "user_started";

// deno-lint-ignore no-explicit-any
type SupabaseClientType = ReturnType<typeof createClient<any>>;

// ============== CONSTANTS ==============

const TRIAL_DAYS = 7;
const TRIAL_LESSONS = 20;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LEVEL_QUESTIONS = [
  {
    question: '🇬🇧 *Q1/3* — Complete:\n\n"I ___ to the supermarket yesterday."\n\nA) go  B) went  C) going  D) gone',
    correctAnswer: "B",
    difficulty: 1,
  },
  {
    question:
      "🇬🇧 *Q2/3* — Which is correct?\n\nA) If I would have time, I will help.\nB) If I had time, I would help.\nC) If I have time, I would help.",
    correctAnswer: "B",
    difficulty: 2,
  },
  {
    question:
      '🇬🇧 *Q3/3* — Complete:\n\n"By the time I arrived, she ___."\n\nA) has left  B) already left  C) had already left',
    correctAnswer: "C",
    difficulty: 3,
  },
];

const LEVEL_NAMES: Record<EnglishLevel, string> = {
  beginner: "Principiante 🌱",
  elementary: "Elemental 📗",
  pre_intermediate: "Pre-Intermedio 📘",
  intermediate: "Intermedio 📙",
  upper_intermediate: "Intermedio-Alto 📕",
  advanced: "Avanzado 🎓",
};

const GOAL_NAMES: Record<LearningGoal, string> = {
  work: "🏢 Inglés Profesional",
  travel: "✈️ Inglés para Viajes",
  conversation: "💬 Conversación Casual",
  general: "📚 Inglés General",
};

const LESSON_TOPICS: Record<EnglishLevel, string[]> = {
  beginner: ["Present Simple", "Basic greetings", "Numbers & days", "Common verbs", "Simple questions"],
  elementary: ["Past Simple", "There is/are", "Comparatives", "Prepositions", "Countable nouns"],
  pre_intermediate: ["Present Perfect", "Future tenses", "Modal verbs", "First Conditional", "Adverbs"],
  intermediate: [
    "Second Conditional",
    "Present Perfect Continuous",
    "Passive Voice",
    "Reported Speech",
    "Relative clauses",
  ],
  upper_intermediate: ["Third Conditional", "Mixed Conditionals", "Advanced Passive", "Complex clauses", "Inversion"],
  advanced: ["Subjunctive", "Cleft sentences", "Ellipsis", "Discourse markers", "Idioms"],
};

const GOAL_CONTEXTS: Record<LearningGoal, string> = {
  work: "contextos profesionales como reuniones, correos electrónicos, presentaciones y conversaciones de negocios",
  travel: "situaciones de viaje como aeropuertos, hoteles, restaurantes y pedir direcciones",
  conversation: "conversaciones casuales cotidianas con amigos, familia y situaciones sociales",
  general: "varias situaciones cotidianas",
};

const MICRO_REWARDS = [
  "🔥 ¡Excelente!",
  "💪 ¡Estás mejorando!",
  "⭐ ¡Muy bien!",
  "🎯 ¡Correcto!",
  "✨ ¡Perfecto!",
  "🚀 ¡Increíble!",
  "👏 ¡Buen trabajo!",
  "🌟 ¡Brillante!",
];

const MILESTONE_MESSAGES = [
  "📊 *¡5 lecciones!* ¡Ya estás más preparado que el 60% de los principiantes!",
  "📊 *¡10 lecciones!* Tu inglés está tomando forma. ¡Sigue así!",
  "📊 *¡15 lecciones!* ¡Estás en el ritmo correcto hacia la fluidez!",
  "📊 *¡20 lecciones!* ¡Dedicación impresionante! Pocos llegan aquí.",
  "📊 *¡25 lecciones!* ¡Eres un ejemplo de persistencia!",
];

// ============== TELEMETRY ==============

async function trackEvent(
  supabase: SupabaseClientType,
  waId: string,
  eventType: EventType,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    await supabase.from("wa_events").insert({
      wa_id: waId,
      event_type: eventType,
      metadata,
    });
  } catch (e) {
    console.error("[Telemetry] Error:", e);
  }
}

// ============== TRIAL SYSTEM ==============

function initTrial(): TrialInfo {
  return {
    trial_started_at: new Date().toISOString(),
    lessons_completed: 0,
    trial_status: "active",
  };
}

function checkTrialStatus(trial: TrialInfo): { active: boolean; reason?: string } {
  if (trial.trial_status === "ended") {
    return { active: false, reason: "already_ended" };
  }

  // Check lessons limit
  if (trial.lessons_completed >= TRIAL_LESSONS) {
    return { active: false, reason: "lessons_limit" };
  }

  // Check days limit
  const startDate = new Date(trial.trial_started_at);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff >= TRIAL_DAYS) {
    return { active: false, reason: "time_limit" };
  }

  return { active: true };
}

function getTrialProgress(trial: TrialInfo): { lessonsLeft: number; daysLeft: number } {
  const startDate = new Date(trial.trial_started_at);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    lessonsLeft: Math.max(0, TRIAL_LESSONS - trial.lessons_completed),
    daysLeft: Math.max(0, TRIAL_DAYS - daysDiff),
  };
}

// ============== AI FUNCTIONS ==============

async function callAI(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");

  if (!apiKey) {
    console.error("[AI] Missing LOVABLE_API_KEY");
    return "";
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
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("[AI] Gateway error:", response.status);
      return "";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("[AI] Error:", error);
    return "";
  }
}

async function generateExercise(
  level: EnglishLevel,
  lessonNumber: number,
  goal: LearningGoal,
  simplified: boolean = false,
): Promise<ExerciseData> {
  const topics = LESSON_TOPICS[level];
  const topic = topics[(lessonNumber - 1) % topics.length];
  const types: ExerciseData["type"][] = ["translation", "complete", "qa"];
  const type = types[lessonNumber % 3];
  const context = GOAL_CONTEXTS[goal];

  const difficultyNote = simplified ? "Make it VERY SIMPLE. Use basic vocabulary. Short sentence." : "";

  const systemPrompt = `You're an English teacher for a ${LEVEL_NAMES[level]} Spanish-speaking student via WhatsApp.

CONTEXT: Student's goal is ${GOAL_NAMES[goal]} (${context}).
TOPIC: ${topic}
EXERCISE TYPE: ${type}
${difficultyNote}

RULES:
- MAX 3 lines total
- Simple, clear language
- Use context related to their goal
- No long explanations
- Instructions should be in SPANISH, but the English content stays in English

Return ONLY JSON:
{"type":"${type}","prompt":"exercise text in Spanish instructions with English content","expected_answer":"flexible answer","context":"${topic}"}`;

  const response = await callAI(systemPrompt, `Create ${type} exercise #${lessonNumber}`);

  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as ExerciseData;
      parsed.simplified = simplified;
      return parsed;
    }
  } catch (e) {
    console.error("[AI] Parse error:", e);
  }

  return getDefaultExercise(type, topic, goal, simplified);
}

function getDefaultExercise(
  type: ExerciseData["type"],
  topic: string,
  goal: LearningGoal,
  simplified: boolean,
): ExerciseData {
  const defaults: Record<ExerciseData["type"], ExerciseData> = {
    translation: {
      type: "translation",
      prompt: simplified ? '🔄 Traduce: "Hola, ¿cómo estás?"' : '🔄 Traduce: "Me gusta aprender inglés."',
      expected_answer: simplified ? "Hello, how are you?" : "I like to learn English.",
      context: topic,
      simplified,
    },
    complete: {
      type: "complete",
      prompt: simplified ? '✏️ Completa: "She ___ happy." (is/are)' : '✏️ Completa: "She ___ (go) to work every day."',
      expected_answer: simplified ? "is" : "goes",
      context: topic,
      simplified,
    },
    qa: {
      type: "qa",
      prompt: simplified ? '💬 Responde: "What is your name?"' : '💬 Responde: "What do you like to do on weekends?"',
      expected_answer: "",
      context: topic,
      simplified,
    },
  };
  return defaults[type];
}

async function evaluateAnswer(
  level: EnglishLevel,
  exercise: ExerciseData,
  userAnswer: string,
  goal: LearningGoal,
  consecutiveErrors: number,
): Promise<{ correct: boolean; feedback: string; hint?: string }> {
  const needsHint = consecutiveErrors >= 1;

  const systemPrompt = `You're a friendly English teacher on WhatsApp for a ${LEVEL_NAMES[level]} Spanish-speaking student.

EXERCISE: ${exercise.prompt}
EXPECTED (flexible): ${exercise.expected_answer || "Accept reasonable answers"}
STUDENT SAID: ${userAnswer}
${exercise.simplified ? "This was already a simplified exercise." : ""}

RULES:
- Be VERY encouraging
- MAX 2 lines feedback in SPANISH
- Use emojis
- ${needsHint ? "Include a helpful HINT in Spanish since student is struggling" : ""}

Return ONLY JSON:
{"correct":true/false,"feedback":"short message in Spanish"${needsHint ? ',"hint":"helpful tip in Spanish"' : ""}}`;

  const response = await callAI(systemPrompt, `Evaluate: "${userAnswer}"`);

  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      const result = JSON.parse(match[0]);
      return {
        correct: Boolean(result.correct),
        feedback: String(result.feedback),
        hint: result.hint,
      };
    }
  } catch (e) {
    console.error("[AI] Parse error:", e);
  }

  return {
    correct: false,
    feedback: "¡Buen intento! 👏 ¡Sigue practicando!",
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
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
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
    });

    if (!response.ok) {
      const result = await response.json();
      console.error("[WhatsApp] Error:", JSON.stringify(result));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[WhatsApp] Error:", error);
    return false;
  }
}

async function send(to: string, msg1: string, msg2?: string): Promise<void> {
  await sendWhatsAppText(to, msg1);
  if (msg2) {
    await new Promise((r) => setTimeout(r, 600));
    await sendWhatsAppText(to, msg2);
  }
}

// ============== DATABASE FUNCTIONS ==============

async function getOrCreateUser(
  supabase: SupabaseClientType,
  waId: string,
  name: string | null,
): Promise<{ wa_id: string; name: string | null; level: EnglishLevel | null; subscription_status: string } | null> {
  const { data: existing } = await supabase
    .from("wa_users")
    .select("wa_id, name, level, subscription_status")
    .eq("wa_id", waId)
    .maybeSingle();

  if (existing) {
    return {
      wa_id: existing.wa_id as string,
      name: existing.name as string | null,
      level: existing.level as EnglishLevel | null,
      subscription_status: existing.subscription_status as string,
    };
  }

  const { data: newUser, error } = await supabase
    .from("wa_users")
    .insert({ wa_id: waId, name, subscription_status: "trial" })
    .select("wa_id, name, level, subscription_status")
    .single();

  if (error) {
    console.error("[DB] Error:", error);
    return null;
  }

  return {
    wa_id: newUser.wa_id as string,
    name: newUser.name as string | null,
    level: newUser.level as EnglishLevel | null,
    subscription_status: newUser.subscription_status as string,
  };
}

async function getOrCreateState(
  supabase: SupabaseClientType,
  waId: string,
): Promise<{ step: string; data: StateData } | null> {
  const { data: existing } = await supabase.from("wa_state").select("step, data").eq("wa_id", waId).maybeSingle();

  if (existing) {
    return {
      step: existing.step as string,
      data: (existing.data || {}) as StateData,
    };
  }

  const { data: newState, error } = await supabase
    .from("wa_state")
    .insert({ wa_id: waId, step: "welcome", data: {} })
    .select("step, data")
    .single();

  if (error) {
    console.error("[DB] Error:", error);
    return null;
  }

  return {
    step: newState.step as string,
    data: (newState.data || {}) as StateData,
  };
}

async function updateState(supabase: SupabaseClientType, waId: string, step: string, data: StateData): Promise<void> {
  await supabase.from("wa_state").update({ step, data }).eq("wa_id", waId);
}

async function updateUserLevel(supabase: SupabaseClientType, waId: string, level: EnglishLevel): Promise<void> {
  await supabase.from("wa_users").update({ level }).eq("wa_id", waId);
}

async function updateUserSubscription(supabase: SupabaseClientType, waId: string, status: string): Promise<void> {
  await supabase.from("wa_users").update({ subscription_status: status }).eq("wa_id", waId);
}

// ============== HELPERS ==============

function calculateLevel(score: number): EnglishLevel {
  if (score <= 0) return "beginner";
  if (score === 1) return "elementary";
  if (score === 2) return "pre_intermediate";
  if (score === 3) return "intermediate";
  if (score >= 4) return "upper_intermediate";
  return "advanced";
}

function getRandomReward(): string {
  return MICRO_REWARDS[Math.floor(Math.random() * MICRO_REWARDS.length)];
}

function getMilestoneMessage(lessonNumber: number): string | null {
  if (lessonNumber % 5 !== 0) return null;
  const index = Math.min(Math.floor(lessonNumber / 5) - 1, MILESTONE_MESSAGES.length - 1);
  return MILESTONE_MESSAGES[index];
}

function parseGoal(text: string): LearningGoal | null {
  const lower = text.toLowerCase();
  if (
    lower.includes("trabajo") ||
    lower.includes("work") ||
    lower.includes("business") ||
    lower.includes("profesional") ||
    lower.includes("oficina")
  ) {
    return "work";
  }
  if (
    lower.includes("viaje") ||
    lower.includes("travel") ||
    lower.includes("trip") ||
    lower.includes("vacation") ||
    lower.includes("viajar")
  ) {
    return "travel";
  }
  if (
    lower.includes("conversa") ||
    lower.includes("conversation") ||
    lower.includes("chat") ||
    lower.includes("hablar") ||
    lower.includes("charlar")
  ) {
    return "conversation";
  }
  return null;
}

function getLevelEncouragement(level: EnglishLevel): string {
  const msgs: Record<EnglishLevel, string> = {
    beginner: "Todos empiezan en algún lugar. ¡Ya diste el primer paso! 🌱",
    elementary: "¡Buena base! Vamos a construir juntos. 📗",
    pre_intermediate: "¡Ya tienes una base sólida! 📘",
    intermediate: "¡Impresionante! Te comunicas bien. 📙",
    upper_intermediate: "¡Excelente! Vamos a pulir los detalles. 📕",
    advanced: "¡Increíble! Vamos a dominar los matices. 🎓",
  };
  return msgs[level];
}

// ============== TRIAL END MESSAGING ==============

async function sendTrialEndMessage(
  supabase: SupabaseClientType,
  waId: string,
  progress: LessonProgress,
  level: EnglishLevel,
  reason: string,
): Promise<void> {
  const accuracy = progress.attempts > 0 ? Math.round((progress.correct_answers / progress.attempts) * 100) : 0;

  await trackEvent(supabase, waId, "trial_ended", { reason, lessons: progress.trial?.lessons_completed });
  await updateUserSubscription(supabase, waId, "free");

  // Message 1: Progress summary
  await send(
    waId,
    `🎉 *¡Tu prueba gratuita ha terminado!*\n\n` +
      `📊 *Tu progreso:*\n` +
      `• Nivel: ${LEVEL_NAMES[level]}\n` +
      `• Lecciones: ${progress.trial?.lessons_completed || 0}\n` +
      `• Aciertos: ${progress.correct_answers} (${accuracy}%)`,
  );

  await new Promise((r) => setTimeout(r, 1000));

  // Message 2: Encouragement + what's next
  await send(
    waId,
    `💪 *¡Has mejorado mucho!*\n\n` +
      `La versión completa incluye:\n` +
      `• Lecciones ilimitadas\n` +
      `• Ejercicios de audio\n` +
      `• Certificado de progreso\n\n` +
      `🔜 *¡Pronto* tendremos más novedades!`,
    `Mientras tanto, usa *"progress"* para ver tu historial o *"help"* para comandos.`,
  );
}

// ============== ONBOARDING ==============

async function sendOnboarding(waId: string, level: EnglishLevel, displayName: string): Promise<void> {
  await send(waId, `🎓 *Tu nivel: ${LEVEL_NAMES[level]}*\n\n${getLevelEncouragement(level)}`);

  await new Promise((r) => setTimeout(r, 1200));

  await send(
    waId,
    `📱 *Cómo funciona:*\n\n` +
      `• Lecciones de 5 min por WhatsApp\n` +
      `• Ejercicios prácticos con feedback IA\n` +
      `• Progreso guardado automáticamente\n\n` +
      `¿Cuál es tu objetivo? 👇`,
    `🏢 *trabajo*\n✈️ *viaje*\n💬 *conversación*\n\n_O escribe "general" para inglés completo_`,
  );
}

// ============== MESSAGE PROCESSING ==============

async function processMessage(
  supabase: SupabaseClientType,
  waId: string,
  userName: string | null,
  messageText: string,
): Promise<void> {
  const user = await getOrCreateUser(supabase, waId, userName);
  if (!user) return;

  const state = await getOrCreateState(supabase, waId);
  if (!state) return;

  const displayName = userName?.split(" ")[0] || "friend";
  const normalized = messageText.trim().toUpperCase();
  const lower = messageText.toLowerCase().trim();

  // Initialize trial on first contact
  let progress = state.data.progress;
  if (!progress?.trial) {
    progress = progress || {
      lesson_number: 1,
      correct_answers: 0,
      attempts: 0,
      consecutive_errors: 0,
      goal: "general" as LearningGoal,
    };
    progress.trial = initTrial();
    await updateState(supabase, waId, state.step, { ...state.data, progress });
    await trackEvent(supabase, waId, "user_started", { name: userName });
  }

  // Check trial status for lesson-related steps
  const trialCheck = checkTrialStatus(progress.trial!);
  const isLessonStep = ["lesson", "feedback_correct", "feedback_wrong", "ready"].includes(state.step);

  if (
    !trialCheck.active &&
    isLessonStep &&
    lower !== "help" &&
    lower !== "progress" &&
    lower !== "ayuda" &&
    lower !== "progreso"
  ) {
    // Mark trial as ended
    if (progress.trial!.trial_status !== "ended") {
      progress.trial!.trial_status = "ended";
      await updateState(supabase, waId, "trial_ended", { ...state.data, progress });
      await sendTrialEndMessage(supabase, waId, progress, user.level!, trialCheck.reason!);
    } else {
      await send(waId, `⏰ Tu prueba ya terminó.\n\nUsa *"progress"* para ver tu historial o *"help"* para comandos.`);
    }
    return;
  }

  // ========== GLOBAL COMMANDS ==========

  if (lower === "restart" || lower === "reiniciar") {
    await send(waId, "🔄 ¡Vamos a empezar de nuevo!\n\nEnvía cualquier mensaje para iniciar.");

    const safeProgress = progress ?? {
      lesson_number: 1,
      correct_answers: 0,
      attempts: 0,
      consecutive_errors: 0,
      goal: "general" as LearningGoal,
      trial: initTrial(),
    };

    await updateState(supabase, waId, "welcome", { progress: safeProgress });
    return;
  }

  if (lower === "help" || lower === "ayuda") {
    const trialInfo = getTrialProgress(progress.trial!);
    const trialStatus = trialCheck.active
      ? `\n\n⏳ Prueba: ${trialInfo.lessonsLeft} lecciones / ${trialInfo.daysLeft} días restantes`
      : "\n\n⏰ Prueba terminada";

    await send(
      waId,
      `📚 *Comandos:*\n\n` +
        `• *next* — siguiente lección\n` +
        `• *repeat* — repetir ejercicio\n` +
        `• *progress* — ver progreso\n` +
        `• *goal* — cambiar objetivo\n` +
        `• *restart* — empezar de nuevo` +
        trialStatus,
    );
    return;
  }

  if (lower === "progress" || lower === "progreso") {
    const p = progress;
    if (p && user.level) {
      const acc = p.attempts > 0 ? Math.round((p.correct_answers / p.attempts) * 100) : 0;
      const trialInfo = getTrialProgress(p.trial!);
      const trialStatus = trialCheck.active
        ? `⏳ Prueba: ${trialInfo.lessonsLeft} lecciones / ${trialInfo.daysLeft} días`
        : "⏰ Prueba terminada";

      await send(
        waId,
        `📊 *Tu progreso:*\n\n` +
          `🎯 Nivel: ${LEVEL_NAMES[user.level]}\n` +
          `📖 Lecciones: ${p.trial?.lessons_completed || 0}\n` +
          `✅ Aciertos: ${p.correct_answers} (${acc}%)\n` +
          `🎯 Objetivo: ${GOAL_NAMES[p.goal || "general"]}\n\n` +
          trialStatus,
      );
    } else {
      await send(waId, "¡Aún no has empezado! Envía cualquier mensaje. 🚀");
    }
    return;
  }

  if (lower === "goal" || lower === "objetivo") {
    await send(waId, `🎯 *¿Cuál es tu objetivo?*\n\n` + `🏢 *trabajo*\n✈️ *viaje*\n💬 *conversación*\n📚 *general*`);
    await updateState(supabase, waId, "set_goal", state.data);
    return;
  }

  // ========== STEP-BASED FLOW ==========

  switch (state.step) {
    case "welcome": {
      await send(
        waId,
        `🎓 *¡Hola, ${displayName}!*\n\nSoy tu coach de inglés. ¡Vamos a descubrir tu nivel con 3 preguntas rápidas! 🚀`,
        LEVEL_QUESTIONS[0].question,
      );
      await updateState(supabase, waId, "question_1", { answers: [], currentQuestion: 0, score: 0, progress });
      break;
    }

    case "question_1":
    case "question_2":
    case "question_3": {
      const qi = state.data.currentQuestion ?? 0;
      const q = LEVEL_QUESTIONS[qi];
      const answers = state.data.answers ?? [];
      let score = state.data.score ?? 0;

      if (!["A", "B", "C", "D"].includes(normalized)) {
        await send(waId, "Responde con *A*, *B* o *C* 📝");
        return;
      }

      answers.push(normalized);
      if (normalized === q.correctAnswer) score += q.difficulty;

      if (qi < LEVEL_QUESTIONS.length - 1) {
        await send(waId, LEVEL_QUESTIONS[qi + 1].question);
        await updateState(supabase, waId, `question_${qi + 2}`, {
          ...state.data,
          answers,
          currentQuestion: qi + 1,
          score,
        });
      } else {
        const level = calculateLevel(score);
        await updateUserLevel(supabase, waId, level);
        await trackEvent(supabase, waId, "level_assessed", { level, score });

        const newProgress: LessonProgress = {
          lesson_number: 1,
          correct_answers: 0,
          attempts: 0,
          consecutive_errors: 0,
          onboarding_complete: false,
          goal: "general",
          trial: progress?.trial || initTrial(),
        };

        await updateState(supabase, waId, "onboarding", { answers, score, progress: newProgress });
        await sendOnboarding(waId, level, displayName);
      }
      break;
    }

    case "onboarding":
    case "set_goal": {
      const currentProgress = state.data.progress || {
        lesson_number: 1,
        correct_answers: 0,
        attempts: 0,
        consecutive_errors: 0,
        goal: "general" as LearningGoal,
        trial: progress?.trial || initTrial(),
      };

      const detectedGoal = parseGoal(messageText);

      if (detectedGoal || lower === "general") {
        currentProgress.goal = detectedGoal || "general";
        currentProgress.onboarding_complete = true;

        await trackEvent(supabase, waId, "goal_selected", { goal: currentProgress.goal });
        await trackEvent(supabase, waId, "onboarding_complete", {});

        const trialInfo = getTrialProgress(currentProgress.trial!);
        await send(
          waId,
          `✅ *Objetivo: ${GOAL_NAMES[currentProgress.goal]}*\n\n` +
            `🎁 *Tu prueba:* ${trialInfo.lessonsLeft} lecciones o ${trialInfo.daysLeft} días gratis!\n\n` +
            `Escribe *"next"* para empezar. 🚀`,
        );
        await updateState(supabase, waId, "ready", { ...state.data, progress: currentProgress });
      } else if (["next", "start", "go", "vamos", "dale", "si", "yes", "sí"].includes(lower)) {
        currentProgress.goal = "general";
        currentProgress.onboarding_complete = true;
        await trackEvent(supabase, waId, "goal_selected", { goal: "general" });
        await startLesson(supabase, waId, user.level!, { ...state.data, progress: currentProgress });
      } else {
        await send(waId, `Elige tu objetivo:\n\n🏢 *trabajo*\n✈️ *viaje*\n💬 *conversación*\n📚 *general*`);
      }
      break;
    }

    case "ready": {
      if (["next", "start", "go", "vamos", "dale"].includes(lower)) {
        await startLesson(supabase, waId, user.level!, state.data);
      } else {
        const trialInfo = getTrialProgress(progress.trial!);
        await send(
          waId,
          `Escribe *"next"* para iniciar tu próxima lección! 📚\n\n⏳ ${trialInfo.lessonsLeft} lecciones restantes en la prueba`,
        );
      }
      break;
    }

    case "lesson": {
      const lessonProgress = state.data.progress!;
      const exercise = lessonProgress.current_exercise;

      if (!exercise) {
        await startLesson(supabase, waId, user.level!, state.data);
        return;
      }

      if (lower === "next" || lower === "skip" || lower === "siguiente") {
        lessonProgress.lesson_number++;
        lessonProgress.consecutive_errors = 0;
        await startLesson(supabase, waId, user.level!, { ...state.data, progress: lessonProgress });
        return;
      }

      if (lower === "repeat" || lower === "repetir") {
        await sendExercise(waId, exercise);
        return;
      }

      // Evaluate answer
      const evaluation = await evaluateAnswer(
        user.level!,
        exercise,
        messageText,
        lessonProgress.goal || "general",
        lessonProgress.consecutive_errors,
      );

      lessonProgress.attempts++;

      if (evaluation.correct) {
        lessonProgress.correct_answers++;
        lessonProgress.consecutive_errors = 0;
        lessonProgress.trial!.lessons_completed++;

        await trackEvent(supabase, waId, "lesson_completed", {
          lesson: lessonProgress.lesson_number,
          correct: true,
        });

        const reward = getRandomReward();
        const milestone = getMilestoneMessage(lessonProgress.trial!.lessons_completed);
        const trialInfo = getTrialProgress(lessonProgress.trial!);

        if (milestone) {
          await send(waId, `${reward} ${evaluation.feedback}`, milestone + `\n\nEscribe *"next"* para continuar!`);
        } else {
          await send(
            waId,
            `${reward} ${evaluation.feedback}\n\n⏳ ${trialInfo.lessonsLeft} lecciones restantes\n\nEscribe *"next"* para la siguiente!`,
          );
        }

        await updateState(supabase, waId, "feedback_correct", { ...state.data, progress: lessonProgress });
      } else {
        lessonProgress.consecutive_errors++;
        await trackEvent(supabase, waId, "exercise_failed", { lesson: lessonProgress.lesson_number });

        if (lessonProgress.consecutive_errors >= 2) {
          const hint = evaluation.hint || `💡 Pista: La respuesta esperada era algo como "${exercise.expected_answer}"`;

          await send(
            waId,
            `${evaluation.feedback}\n\n${hint}`,
            `¿Quieres intentar de nuevo? Escribe *"repeat"*\nO *"next"* para una versión más simple! 💪`,
          );

          lessonProgress.current_exercise = { ...exercise, simplified: true };
        } else {
          await send(waId, `${evaluation.feedback}`, `¡Inténtalo de nuevo! O escribe *"next"* para saltar.`);
        }

        await updateState(supabase, waId, "feedback_wrong", { ...state.data, progress: lessonProgress });
      }

      lessonProgress.lesson_history = lessonProgress.lesson_history || [];
      lessonProgress.lesson_history.push({
        lesson: lessonProgress.lesson_number,
        correct: evaluation.correct,
        answer: messageText,
        expected: exercise.expected_answer,
      });
      break;
    }

    case "feedback_correct":
    case "feedback_wrong": {
      const fbProgress = state.data.progress!;

      if (lower === "next" || lower === "siguiente" || lower === "continue") {
        fbProgress.lesson_number++;

        const shouldSimplify = fbProgress.consecutive_errors >= 2;
        fbProgress.consecutive_errors = 0;

        await startLesson(supabase, waId, user.level!, { ...state.data, progress: fbProgress }, shouldSimplify);
      } else if (lower === "repeat" || lower === "repetir") {
        const exercise = fbProgress.current_exercise;
        if (exercise) {
          fbProgress.consecutive_errors = 0;
          await sendExercise(waId, exercise);
          await updateState(supabase, waId, "lesson", { ...state.data, progress: fbProgress });
        }
      } else {
        await updateState(supabase, waId, "lesson", state.data);
        await processMessage(supabase, waId, userName, messageText);
      }
      break;
    }

    case "trial_ended": {
      await send(waId, `⏰ Tu prueba ya terminó.\n\nUsa *"progress"* para ver tu historial o *"help"* para comandos.`);
      break;
    }

    default: {
      if (user.level) {
        await send(waId, "¡Vamos a continuar! 🚀", 'Escribe *"next"* para la próxima lección.');
        await updateState(supabase, waId, "ready", state.data);
      } else {
        await updateState(supabase, waId, "welcome", { progress });
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
  currentData: StateData,
  simplified: boolean = false,
): Promise<void> {
  const progress = currentData.progress || {
    lesson_number: 1,
    correct_answers: 0,
    attempts: 0,
    consecutive_errors: 0,
    goal: "general" as LearningGoal,
    trial: initTrial(),
  };

  const topics = LESSON_TOPICS[level];
  const topic = topics[(progress.lesson_number - 1) % topics.length];
  const trialInfo = getTrialProgress(progress.trial!);

  await send(
    waId,
    `📖 *Lección ${progress.lesson_number}* — ${topic}\n\n⏱️ ~5 min | ⏳ ${trialInfo.lessonsLeft} restantes`,
  );

  const exercise = await generateExercise(level, progress.lesson_number, progress.goal || "general", simplified);
  progress.current_exercise = exercise;

  await updateState(supabase, waId, "lesson", { ...currentData, progress });

  await new Promise((r) => setTimeout(r, 800));
  await sendExercise(waId, exercise);
}

async function sendExercise(waId: string, exercise: ExerciseData): Promise<void> {
  const emoji = { translation: "🔄", complete: "✏️", qa: "💬" };
  const label = { translation: "Traducción", complete: "Completa", qa: "Responde" };

  await send(waId, `${emoji[exercise.type]} *${label[exercise.type]}*\n\n${exercise.prompt}`);
}

// ============== UTILITIES ==============

function maskWaId(waId: string): string {
  if (waId.length <= 4) return "****";
  return waId.slice(0, 4) + "****" + waId.slice(-4);
}

// ============== BACKGROUND PROCESSING ==============

async function processWebhookPayload(
  body: WhatsAppWebhookPayload,
  supabase: SupabaseClientType
): Promise<void> {
  console.log("[WEBHOOK] Background processing started");

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const msgs = value.messages ?? [];
      
      if (!msgs.length) {
        console.log("[WEBHOOK] No messages in this change");
        continue;
      }

      for (const message of msgs) {
        console.log("[WEBHOOK] Processing message type:", message.type);
        
        if (message.type !== "text" || !message.text?.body) {
          console.log("[WEBHOOK] Skipping non-text message");
          continue;
        }

        const waId = message.from;
        const contact = value.contacts?.find((c) => c.wa_id === waId);
        const messageText = message.text.body;

        console.log("[WEBHOOK] Message from:", maskWaId(waId));

        // Processar mensagem completa
        try {
          await processMessage(supabase, waId, contact?.profile?.name ?? null, messageText);
          console.log("[WEBHOOK] processMessage completed for:", maskWaId(waId));
        } catch (processError) {
          console.error("[WEBHOOK] Error in processMessage for:", maskWaId(waId), processError);
        }
      }
    }
  }

  console.log("[WEBHOOK] Background processing completed");
}

// ============== MAIN HANDLER ==============

serve(async (req: Request) => {
  // Log IMEDIATO no início absoluto
  console.log(`[WEBHOOK] ${req.method} ${req.url}`);

  if (req.method === "OPTIONS") {
    console.log("[WEBHOOK] OPTIONS request - returning CORS headers");
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ====== VERIFY (GET) ======
  if (req.method === "GET") {
    console.log("[WEBHOOK] GET request - webhook verification");
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    console.log("[WEBHOOK] Verify params - mode:", mode, "token:", token ? "***" : "null");

    if (mode === "subscribe" && token === Deno.env.get("WHATSAPP_VERIFY_TOKEN")) {
      console.log("[WEBHOOK] Verification SUCCESS");
      return new Response(challenge, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    console.log("[WEBHOOK] Verification FAILED");
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // ====== WEBHOOK (POST) ======
  if (req.method === "POST") {
    console.log("[WEBHOOK] POST handler started");

    // 1. Ler o body como texto
    let raw: string;
    try {
      raw = await req.text();
      console.log("[WEBHOOK] Body read successfully, length:", raw.length);
    } catch (readError) {
      console.error("[WEBHOOK] Failed to read body:", readError);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // 2. Parse JSON
    let body: WhatsAppWebhookPayload;
    try {
      body = JSON.parse(raw);
      console.log("[WEBHOOK] JSON parsed, object:", body?.object);
    } catch (parseError) {
      console.error("[WEBHOOK] JSON parse failed:", parseError);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // 3. Validar payload
    if (body.object !== "whatsapp_business_account") {
      console.log("[WEBHOOK] Not a WhatsApp Business payload, ignoring");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // 4. Obter credenciais Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("[WEBHOOK] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const supabase: SupabaseClientType = createClient(supabaseUrl, supabaseKey);
    console.log("[WEBHOOK] Supabase client created");

    // 5. Processar em background usando EdgeRuntime.waitUntil
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      console.log("[WEBHOOK] Using EdgeRuntime.waitUntil for background processing");
      // @ts-ignore
      EdgeRuntime.waitUntil(processWebhookPayload(body, supabase));
    } else {
      // Fallback: processar inline (menos ideal, mas funciona)
      console.log("[WEBHOOK] EdgeRuntime not available, processing inline");
      try {
        await processWebhookPayload(body, supabase);
      } catch (processingError) {
        console.error("[WEBHOOK] Error in inline processing:", processingError);
      }
    }

    // 6. Retornar 200 IMEDIATAMENTE
    console.log("[WEBHOOK] Returning 200 OK to Meta");
    return new Response("OK", { status: 200, headers: corsHeaders });
  }

  console.log("[WEBHOOK] Unknown method:", req.method);
  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
