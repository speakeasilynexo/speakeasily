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

interface LessonProgress {
  lesson_number: number;
  correct_answers: number;
  attempts: number;
  consecutive_errors: number;
  current_exercise?: ExerciseData;
  lesson_history?: LessonHistoryItem[];
  goal?: LearningGoal;
  onboarding_complete?: boolean;
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

// deno-lint-ignore no-explicit-any
type SupabaseClientType = ReturnType<typeof createClient<any>>;

// ============== CONSTANTS ==============

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LEVEL_QUESTIONS = [
  {
    question: "🇬🇧 *Q1/3* — Complete:\n\n\"I ___ to the supermarket yesterday.\"\n\nA) go  B) went  C) going  D) gone",
    correctAnswer: "B",
    difficulty: 1,
  },
  {
    question: "🇬🇧 *Q2/3* — Which is correct?\n\nA) If I would have time, I will help.\nB) If I had time, I would help.\nC) If I have time, I would help.",
    correctAnswer: "B",
    difficulty: 2,
  },
  {
    question: "🇬🇧 *Q3/3* — Complete:\n\n\"By the time I arrived, she ___.\"\n\nA) has left  B) already left  C) had already left",
    correctAnswer: "C",
    difficulty: 3,
  },
];

const LEVEL_NAMES: Record<EnglishLevel, string> = {
  beginner: "Beginner 🌱",
  elementary: "Elementary 📗",
  pre_intermediate: "Pre-Intermediate 📘",
  intermediate: "Intermediate 📙",
  upper_intermediate: "Upper-Intermediate 📕",
  advanced: "Advanced 🎓",
};

const GOAL_NAMES: Record<LearningGoal, string> = {
  work: "🏢 Professional English",
  travel: "✈️ Travel English",
  conversation: "💬 Casual Conversation",
  general: "📚 General English",
};

const LESSON_TOPICS: Record<EnglishLevel, string[]> = {
  beginner: ["Present Simple", "Basic greetings", "Numbers & days", "Common verbs", "Simple questions"],
  elementary: ["Past Simple", "There is/are", "Comparatives", "Prepositions", "Countable nouns"],
  pre_intermediate: ["Present Perfect", "Future tenses", "Modal verbs", "First Conditional", "Adverbs"],
  intermediate: ["Second Conditional", "Present Perfect Continuous", "Passive Voice", "Reported Speech", "Relative clauses"],
  upper_intermediate: ["Third Conditional", "Mixed Conditionals", "Advanced Passive", "Complex clauses", "Inversion"],
  advanced: ["Subjunctive", "Cleft sentences", "Ellipsis", "Discourse markers", "Idioms"],
};

const GOAL_CONTEXTS: Record<LearningGoal, string> = {
  work: "professional contexts like meetings, emails, presentations, and business conversations",
  travel: "travel situations like airports, hotels, restaurants, and asking for directions",
  conversation: "everyday casual conversations with friends, family, and social situations",
  general: "various everyday situations",
};

// Micro-rewards for correct answers
const MICRO_REWARDS = [
  "🔥 Excelente!",
  "💪 Você está evoluindo!",
  "⭐ Mandou bem!",
  "🎯 Certinho!",
  "✨ Perfeito!",
  "🚀 Incrível!",
  "👏 Ótimo trabalho!",
  "🌟 Brilhante!",
];

// Progress milestones (every 5 lessons)
const MILESTONE_MESSAGES = [
  "📊 *5 lições!* Você já está mais preparado que 60% dos iniciantes!",
  "📊 *10 lições!* Seu inglês está tomando forma. Continue assim!",
  "📊 *15 lições!* Você está no ritmo certo para fluência!",
  "📊 *20 lições!* Impressionante dedicação! Poucos chegam aqui.",
  "📊 *25 lições!* Você é um exemplo de persistência!",
];

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
  simplified: boolean = false
): Promise<ExerciseData> {
  const topics = LESSON_TOPICS[level];
  const topic = topics[(lessonNumber - 1) % topics.length];
  const types: ExerciseData["type"][] = ["translation", "complete", "qa"];
  const type = types[lessonNumber % 3];
  const context = GOAL_CONTEXTS[goal];

  const difficultyNote = simplified 
    ? "Make it VERY SIMPLE. Use basic vocabulary. Short sentence."
    : "";

  const systemPrompt = `You're an English teacher for a ${LEVEL_NAMES[level]} student via WhatsApp.

CONTEXT: Student's goal is ${GOAL_NAMES[goal]} (${context}).
TOPIC: ${topic}
EXERCISE TYPE: ${type}
${difficultyNote}

RULES:
- MAX 3 lines total
- Simple, clear language
- Use context related to their goal
- No long explanations

Return ONLY JSON:
{"type":"${type}","prompt":"exercise text","expected_answer":"flexible answer","context":"${topic}"}`;

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
  simplified: boolean
): ExerciseData {
  const defaults: Record<ExerciseData["type"], ExerciseData> = {
    translation: {
      type: "translation",
      prompt: simplified 
        ? "🔄 Translate: \"Olá, tudo bem?\""
        : "🔄 Translate: \"Eu gosto de aprender inglês.\"",
      expected_answer: simplified ? "Hello, how are you?" : "I like to learn English.",
      context: topic,
      simplified,
    },
    complete: {
      type: "complete",
      prompt: simplified
        ? "✏️ Complete: \"She ___ happy.\" (is/are)"
        : "✏️ Complete: \"She ___ (go) to work every day.\"",
      expected_answer: simplified ? "is" : "goes",
      context: topic,
      simplified,
    },
    qa: {
      type: "qa",
      prompt: simplified
        ? "💬 Answer: \"What is your name?\""
        : "💬 Answer: \"What do you like to do on weekends?\"",
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
  consecutiveErrors: number
): Promise<{ correct: boolean; feedback: string; hint?: string }> {
  const needsHint = consecutiveErrors >= 1;
  
  const systemPrompt = `You're a friendly English teacher on WhatsApp for a ${LEVEL_NAMES[level]} student.

EXERCISE: ${exercise.prompt}
EXPECTED (flexible): ${exercise.expected_answer || "Accept reasonable answers"}
STUDENT SAID: ${userAnswer}
${exercise.simplified ? "This was already a simplified exercise." : ""}

RULES:
- Be VERY encouraging
- MAX 2 lines feedback
- Use emojis
- ${needsHint ? "Include a helpful HINT since student is struggling" : ""}

Return ONLY JSON:
{"correct":true/false,"feedback":"short message"${needsHint ? ',"hint":"helpful tip"' : ""}}`;

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
    feedback: "Good try! 👏 Keep practicing!",
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
      console.error("[WhatsApp] Error:", JSON.stringify(result));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[WhatsApp] Error:", error);
    return false;
  }
}

// Max 2 messages, wait for response
async function send(to: string, msg1: string, msg2?: string): Promise<void> {
  await sendWhatsAppText(to, msg1);
  if (msg2) {
    await new Promise(r => setTimeout(r, 600));
    await sendWhatsAppText(to, msg2);
  }
}

// ============== DATABASE FUNCTIONS ==============

async function getOrCreateUser(
  supabase: SupabaseClientType,
  waId: string,
  name: string | null
): Promise<{ wa_id: string; name: string | null; level: EnglishLevel | null } | null> {
  const { data: existing } = await supabase
    .from("wa_users")
    .select("wa_id, name, level")
    .eq("wa_id", waId)
    .maybeSingle();

  if (existing) {
    return {
      wa_id: existing.wa_id as string,
      name: existing.name as string | null,
      level: existing.level as EnglishLevel | null,
    };
  }

  const { data: newUser, error } = await supabase
    .from("wa_users")
    .insert({ wa_id: waId, name })
    .select("wa_id, name, level")
    .single();

  if (error) {
    console.error("[DB] Error:", error);
    return null;
  }

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
  const { data: existing } = await supabase
    .from("wa_state")
    .select("step, data")
    .eq("wa_id", waId)
    .maybeSingle();

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

async function updateState(
  supabase: SupabaseClientType,
  waId: string,
  step: string,
  data: StateData
): Promise<void> {
  await supabase.from("wa_state").update({ step, data }).eq("wa_id", waId);
}

async function updateUserLevel(
  supabase: SupabaseClientType,
  waId: string,
  level: EnglishLevel
): Promise<void> {
  await supabase.from("wa_users").update({ level }).eq("wa_id", waId);
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
  if (lower.includes("trabalho") || lower.includes("work") || lower.includes("business") || lower.includes("profissional")) {
    return "work";
  }
  if (lower.includes("viagem") || lower.includes("travel") || lower.includes("trip") || lower.includes("vacation")) {
    return "travel";
  }
  if (lower.includes("conversa") || lower.includes("conversation") || lower.includes("chat") || lower.includes("falar")) {
    return "conversation";
  }
  return null;
}

function getLevelEncouragement(level: EnglishLevel): string {
  const msgs: Record<EnglishLevel, string> = {
    beginner: "Todo mundo começa de algum lugar. Você já deu o primeiro passo! 🌱",
    elementary: "Boa base! Vamos construir juntos. 📗",
    pre_intermediate: "Você já tem uma base sólida! 📘",
    intermediate: "Impressionante! Você se comunica bem. 📙",
    upper_intermediate: "Excelente! Vamos polir os detalhes. 📕",
    advanced: "Incrível! Vamos dominar as nuances. 🎓",
  };
  return msgs[level];
}

// ============== ONBOARDING ==============

async function sendOnboarding(waId: string, level: EnglishLevel, displayName: string): Promise<void> {
  // Message 1: Method explanation
  await send(
    waId,
    `🎓 *Seu nível: ${LEVEL_NAMES[level]}*\n\n${getLevelEncouragement(level)}`
  );

  await new Promise(r => setTimeout(r, 1200));

  // Message 2: What they'll learn + how it works
  await send(
    waId,
    `📱 *Como funciona:*\n\n` +
    `• Lições de 5 min pelo WhatsApp\n` +
    `• Exercícios práticos com feedback IA\n` +
    `• Progresso salvo automaticamente\n\n` +
    `Qual seu objetivo? 👇`,
    `🏢 *trabalho*\n✈️ *viagem*\n💬 *conversação*\n\n_Ou digite "geral" para inglês completo_`
  );
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

  const displayName = userName?.split(" ")[0] || "friend";
  const normalized = messageText.trim().toUpperCase();
  const lower = messageText.toLowerCase().trim();

  // ========== GLOBAL COMMANDS ==========
  
  if (lower === "restart" || lower === "reiniciar") {
    await send(waId, "🔄 Vamos recomeçar!\n\nEnvie qualquer mensagem para iniciar.");
    await updateState(supabase, waId, "welcome", {});
    return;
  }

  if (lower === "help" || lower === "ajuda") {
    await send(
      waId,
      `📚 *Comandos:*\n\n` +
      `• *next* — próxima lição\n` +
      `• *repeat* — repetir exercício\n` +
      `• *progress* — ver progresso\n` +
      `• *goal* — mudar objetivo\n` +
      `• *restart* — recomeçar`
    );
    return;
  }

  if (lower === "progress" || lower === "progresso") {
    const p = state.data.progress;
    if (p && user.level) {
      const acc = p.attempts > 0 ? Math.round((p.correct_answers / p.attempts) * 100) : 0;
      await send(
        waId,
        `📊 *Seu progresso:*\n\n` +
        `🎯 Nível: ${LEVEL_NAMES[user.level]}\n` +
        `📖 Lições: ${p.lesson_number - 1}\n` +
        `✅ Acertos: ${p.correct_answers} (${acc}%)\n` +
        `🎯 Objetivo: ${GOAL_NAMES[p.goal || "general"]}`
      );
    } else {
      await send(waId, "Você ainda não começou! Envie qualquer mensagem. 🚀");
    }
    return;
  }

  if (lower === "goal" || lower === "objetivo") {
    await send(
      waId,
      `🎯 *Qual seu objetivo?*\n\n` +
      `🏢 *trabalho*\n✈️ *viagem*\n💬 *conversação*\n📚 *geral*`
    );
    await updateState(supabase, waId, "set_goal", state.data);
    return;
  }

  // ========== STEP-BASED FLOW ==========

  switch (state.step) {
    case "welcome": {
      await send(
        waId,
        `🎓 *Olá, ${displayName}!*\n\nSou seu coach de inglês. Vamos descobrir seu nível com 3 perguntas rápidas! 🚀`,
        LEVEL_QUESTIONS[0].question
      );
      await updateState(supabase, waId, "question_1", { answers: [], currentQuestion: 0, score: 0 });
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
        await send(waId, "Responda com *A*, *B* ou *C* 📝");
        return;
      }

      answers.push(normalized);
      if (normalized === q.correctAnswer) score += q.difficulty;

      if (qi < LEVEL_QUESTIONS.length - 1) {
        await send(waId, LEVEL_QUESTIONS[qi + 1].question);
        await updateState(supabase, waId, `question_${qi + 2}`, { answers, currentQuestion: qi + 1, score });
      } else {
        const level = calculateLevel(score);
        await updateUserLevel(supabase, waId, level);

        const progress: LessonProgress = {
          lesson_number: 1,
          correct_answers: 0,
          attempts: 0,
          consecutive_errors: 0,
          onboarding_complete: false,
          goal: "general",
        };

        await updateState(supabase, waId, "onboarding", { answers, score, progress });
        await sendOnboarding(waId, level, displayName);
      }
      break;
    }

    case "onboarding":
    case "set_goal": {
      const progress = state.data.progress || {
        lesson_number: 1,
        correct_answers: 0,
        attempts: 0,
        consecutive_errors: 0,
        goal: "general" as LearningGoal,
      };

      const detectedGoal = parseGoal(messageText);
      
      if (detectedGoal || lower === "geral" || lower === "general") {
        progress.goal = detectedGoal || "general";
        progress.onboarding_complete = true;

        await send(
          waId,
          `✅ *Objetivo: ${GOAL_NAMES[progress.goal]}*\n\nVou adaptar as lições para você!\n\nDigite *"next"* para começar. 🚀`
        );
        await updateState(supabase, waId, "ready", { ...state.data, progress });
      } else if (["next", "start", "go", "vamos", "bora", "sim", "yes"].includes(lower)) {
        progress.goal = "general";
        progress.onboarding_complete = true;
        await startLesson(supabase, waId, user.level!, { ...state.data, progress });
      } else {
        await send(
          waId,
          `Escolha seu objetivo:\n\n🏢 *trabalho*\n✈️ *viagem*\n💬 *conversação*\n📚 *geral*`
        );
      }
      break;
    }

    case "ready": {
      if (["next", "start", "go", "vamos", "bora"].includes(lower)) {
        await startLesson(supabase, waId, user.level!, state.data);
      } else {
        await send(waId, `Digite *"next"* para iniciar sua primeira lição! 📚`);
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

      if (lower === "next" || lower === "skip" || lower === "próximo") {
        progress.lesson_number++;
        progress.consecutive_errors = 0;
        await startLesson(supabase, waId, user.level!, { ...state.data, progress });
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
        progress.goal || "general",
        progress.consecutive_errors
      );

      progress.attempts++;

      if (evaluation.correct) {
        progress.correct_answers++;
        progress.consecutive_errors = 0;

        const reward = getRandomReward();
        const milestone = getMilestoneMessage(progress.lesson_number);

        if (milestone) {
          await send(waId, `${reward} ${evaluation.feedback}`, milestone + `\n\nDigite *"next"* para continuar!`);
        } else {
          await send(waId, `${reward} ${evaluation.feedback}\n\nDigite *"next"* para a próxima lição!`);
        }

        await updateState(supabase, waId, "feedback_correct", { ...state.data, progress });
      } else {
        progress.consecutive_errors++;

        // Frustration detection: 2+ consecutive errors
        if (progress.consecutive_errors >= 2) {
          const hint = evaluation.hint || `💡 Dica: A resposta esperada era algo como "${exercise.expected_answer}"`;
          
          await send(
            waId,
            `${evaluation.feedback}\n\n${hint}`,
            `Quer tentar de novo? Digite *"repeat"*\nOu *"next"* para uma versão mais simples! 💪`
          );
          
          // Mark that next lesson should be simplified
          progress.current_exercise = { ...exercise, simplified: true };
        } else {
          await send(
            waId,
            `${evaluation.feedback}`,
            `Tente novamente! Ou digite *"next"* para pular.`
          );
        }

        await updateState(supabase, waId, "feedback_wrong", { ...state.data, progress });
      }

      // Save history
      progress.lesson_history = progress.lesson_history || [];
      progress.lesson_history.push({
        lesson: progress.lesson_number,
        correct: evaluation.correct,
        answer: messageText,
        expected: exercise.expected_answer,
      });
      break;
    }

    case "feedback_correct":
    case "feedback_wrong": {
      const progress = state.data.progress!;

      if (lower === "next" || lower === "próximo" || lower === "continue") {
        progress.lesson_number++;
        
        // If coming from frustration, simplify next exercise
        const shouldSimplify = progress.consecutive_errors >= 2;
        progress.consecutive_errors = 0;
        
        await startLesson(supabase, waId, user.level!, { ...state.data, progress }, shouldSimplify);
      } else if (lower === "repeat" || lower === "repetir") {
        const exercise = progress.current_exercise;
        if (exercise) {
          progress.consecutive_errors = 0; // Reset on repeat
          await sendExercise(waId, exercise);
          await updateState(supabase, waId, "lesson", { ...state.data, progress });
        }
      } else {
        // Treat as another attempt
        await updateState(supabase, waId, "lesson", state.data);
        await processMessage(supabase, waId, userName, messageText);
      }
      break;
    }

    default: {
      if (user.level) {
        await send(waId, "Vamos continuar! 🚀", "Digite *\"next\"* para a próxima lição.");
        await updateState(supabase, waId, "ready", state.data);
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
  currentData: StateData,
  simplified: boolean = false
): Promise<void> {
  const progress = currentData.progress || {
    lesson_number: 1,
    correct_answers: 0,
    attempts: 0,
    consecutive_errors: 0,
    goal: "general" as LearningGoal,
  };

  const topics = LESSON_TOPICS[level];
  const topic = topics[(progress.lesson_number - 1) % topics.length];

  await send(
    waId,
    `📖 *Lição ${progress.lesson_number}* — ${topic}\n\n⏱️ ~5 min | Preparando exercício...`
  );

  const exercise = await generateExercise(level, progress.lesson_number, progress.goal || "general", simplified);
  progress.current_exercise = exercise;

  await updateState(supabase, waId, "lesson", { ...currentData, progress });

  await new Promise(r => setTimeout(r, 800));
  await sendExercise(waId, exercise);
}

async function sendExercise(waId: string, exercise: ExerciseData): Promise<void> {
  const emoji = { translation: "🔄", complete: "✏️", qa: "💬" };
  const label = { translation: "Tradução", complete: "Complete", qa: "Responda" };

  await send(
    waId,
    `${emoji[exercise.type]} *${label[exercise.type]}*\n\n${exercise.prompt}`
  );
}

// ============== MAIN HANDLER ==============

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === Deno.env.get("WHATSAPP_VERIFY_TOKEN")) {
      return new Response(challenge, { status: 200, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  if (req.method === "POST") {
    try {
      const body: WhatsAppWebhookPayload = await req.json();

      if (body.object !== "whatsapp_business_account") {
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (!supabaseUrl || !supabaseKey) {
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const supabase: SupabaseClientType = createClient(supabaseUrl, supabaseKey);

      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;
          if (!value.messages?.length) continue;

          for (const message of value.messages) {
            if (message.type !== "text" || !message.text) continue;

            const waId = message.from;
            const contact = value.contacts?.find(c => c.wa_id === waId);

            processMessage(supabase, waId, contact?.profile?.name ?? null, message.text.body)
              .catch(err => console.error("[Webhook] Error:", err));
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
