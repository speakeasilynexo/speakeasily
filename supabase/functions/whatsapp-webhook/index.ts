import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

// ============== TYPES ==============

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  audio?: { id: string; mime_type: string };
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
type EnglishLevel = "beginner" | "elementary" | "pre_intermediate" | "intermediate" | "upper_intermediate" | "advanced";
type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1";

// Exercise types for MVP2
type ExerciseType = "fill_in_blank" | "reorder_words" | "choose_correct" | "correct_the_mistake" | "translation" | "written_production" | "shadowing";

interface TrialInfo {
  trial_started_at: string;
  lessons_completed: number;
  trial_status: TrialStatus;
}

interface MistakeTag {
  tag: string;
  count: number;
  last_seen: string;
}

interface PlacementState {
  part: 1 | 2 | 3;
  question_index: number;
  mcq_answers: Array<{ q_id: string; answer: string; correct: boolean }>;
  mcq_score: number;
  written_text?: string;
  written_score?: number;
  audio_received?: boolean;
  audio_media_id?: string;
}

interface DayLesson {
  day: number;
  lesson_id: string;
  title: string;
  objectives: string[];
  exercises: LessonExercise[];
  production_type: "text" | "audio";
  production_prompt: string;
}

interface LessonExercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  options?: string[];
  correct_answer: string;
  hint?: string;
  mistake_tag: string;
}

interface LessonProgress {
  current_day: number;
  current_exercise_index: number;
  day_score: number;
  day_attempts: number;
  exercises_completed: number;
  total_lessons_completed: number;
  goal?: LearningGoal;
  onboarding_complete?: boolean;
  trial?: TrialInfo;
  mistake_tags?: MistakeTag[];
  review_mode?: boolean;
  review_exercises?: LessonExercise[];
  review_index?: number;
}

interface StateData {
  placement?: PlacementState;
  progress?: LessonProgress;
}

type EventType =
  | "lesson_completed"
  | "exercise_failed"
  | "goal_selected"
  | "trial_ended"
  | "level_assessed"
  | "onboarding_complete"
  | "user_started"
  | "message_received"
  | "message_sent"
  | "placement_started"
  | "placement_question_answered"
  | "placement_written_submitted"
  | "placement_audio_received"
  | "placement_completed"
  | "lesson_started"
  | "exercise_answered"
  | "production_submitted"
  | "checkpoint_passed"
  | "checkpoint_failed"
  | "review_started"
  | "review_completed";

// deno-lint-ignore no-explicit-any
type SupabaseClientType = ReturnType<typeof createClient<any>>;

// ============== CONSTANTS ==============

const TRIAL_DAYS = 7;
const TRIAL_LESSONS = 20;
const PASSING_SCORE = 0.7; // 70% para passar checkpoint

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============== PLACEMENT TEST (MVP1) ==============

interface PlacementQuestion {
  id: string;
  part: 1;
  category: "verb_tense" | "preposition_collocation" | "sentence_structure";
  question: string;
  options: string[];
  correct: string;
  feedback_correct: string;
  feedback_wrong: string;
}

const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: "q1_verb",
    part: 1,
    category: "verb_tense",
    question: "📝 *Parte 1/3 — Diagnóstico*\n\n*Q1.* Lee el contexto y elige:\n\n_\"Yesterday, I ___ to the gym after work. It was a great session!\"_\n\nA) go\nB) went\nC) have gone\nD) was going",
    options: ["A", "B", "C", "D"],
    correct: "B",
    feedback_correct: "✅ ¡Correcto! *Went* es el pasado simple de 'go'. Usamos pasado simple para acciones completadas en un momento específico ('yesterday').",
    feedback_wrong: "❌ La respuesta correcta es *B) went*. Con 'yesterday', usamos el pasado simple porque es una acción completada en un momento específico del pasado."
  },
  {
    id: "q2_prep",
    part: 1,
    category: "preposition_collocation",
    question: "*Q2.* Elige la opción correcta:\n\n_\"She's very good ___ solving problems under pressure.\"_\n\nA) in\nB) for\nC) at\nD) with",
    options: ["A", "B", "C", "D"],
    correct: "C",
    feedback_correct: "✅ ¡Exacto! *Good at* es la colocación correcta para expresar habilidad en algo.",
    feedback_wrong: "❌ La respuesta correcta es *C) at*. En inglés decimos 'good at + gerund' para hablar de habilidades."
  },
  {
    id: "q3_structure",
    part: 1,
    category: "sentence_structure",
    question: "*Q3.* ¿Cuál frase está correcta?\n\nA) He doesn't never arrive on time.\nB) He never doesn't arrive on time.\nC) He never arrives on time.\nD) Never he arrives on time.",
    options: ["A", "B", "C", "D"],
    correct: "C",
    feedback_correct: "✅ ¡Perfecto! Los adverbios de frecuencia van antes del verbo principal. Y no usamos doble negación en inglés.",
    feedback_wrong: "❌ La respuesta correcta es *C*. 'Never' va antes del verbo principal, y en inglés no usamos doble negación (doesn't + never = ❌)."
  }
];

const LEVEL_MAPPING: Record<number, CEFRLevel> = {
  0: "A1",
  1: "A1",
  2: "A2",
  3: "B1",
  4: "B1",
  5: "B2",
  6: "C1"
};

const LEVEL_TO_INTERNAL: Record<CEFRLevel, EnglishLevel> = {
  "A1": "beginner",
  "A2": "elementary",
  "B1": "pre_intermediate",
  "B2": "intermediate",
  "C1": "upper_intermediate"
};

const LEVEL_NAMES: Record<EnglishLevel, string> = {
  beginner: "Principiante (A1) 🌱",
  elementary: "Elemental (A2) 📗",
  pre_intermediate: "Pre-Intermedio (B1) 📘",
  intermediate: "Intermedio (B2) 📙",
  upper_intermediate: "Intermedio-Alto (C1) 📕",
  advanced: "Avanzado (C2) 🎓",
};

const GOAL_NAMES: Record<LearningGoal, string> = {
  work: "🏢 Inglés Profesional",
  travel: "✈️ Viajes",
  conversation: "💬 Conversación",
  general: "📚 General",
};

// ============== 7-DAY PLAN (MVP2) ==============

const SEVEN_DAY_PLAN: DayLesson[] = [
  {
    day: 1,
    lesson_id: "day1_greetings",
    title: "Saludos y Presentaciones",
    objectives: ["Saludar formalmente e informalmente", "Presentarte en inglés"],
    exercises: [
      {
        id: "d1_ex1",
        type: "choose_correct",
        prompt: "¿Cómo respondes a 'How are you?' de manera natural?\n\nA) I'm fine, thank you. And you?\nB) I am very good health.\nC) Yes, I am.\nD) Good morning.",
        options: ["A", "B", "C", "D"],
        correct_answer: "A",
        hint: "Es una fórmula de cortesía, no una pregunta médica.",
        mistake_tag: "greetings_response"
      },
      {
        id: "d1_ex2",
        type: "fill_in_blank",
        prompt: "Completa: \"Nice ___ meet you!\"\n\n(Escribe solo la palabra que falta)",
        correct_answer: "to",
        hint: "Es una expresión fija: Nice ___ meet you.",
        mistake_tag: "nice_to_meet"
      },
      {
        id: "d1_ex3",
        type: "reorder_words",
        prompt: "Ordena las palabras para formar una frase correcta:\n\n*from / I / Spain / am*\n\n(Escribe la frase completa)",
        correct_answer: "I am from Spain",
        hint: "Estructura: Sujeto + Verbo + Complemento",
        mistake_tag: "word_order_basic"
      },
      {
        id: "d1_ex4",
        type: "correct_the_mistake",
        prompt: "Encuentra y corrige el error:\n\n*\"My name it is Carlos.\"*\n\n(Escribe la frase correcta)",
        correct_answer: "My name is Carlos",
        hint: "El 'it' no es necesario aquí.",
        mistake_tag: "redundant_pronoun"
      }
    ],
    production_type: "text",
    production_prompt: "✍️ *Producción final:*\n\nEscribe 2 frases presentándote:\n1. Tu nombre y de dónde eres\n2. A qué te dedicas"
  },
  {
    day: 2,
    lesson_id: "day2_present_simple",
    title: "Presente Simple - Rutinas",
    objectives: ["Hablar de rutinas diarias", "Usar adverbios de frecuencia"],
    exercises: [
      {
        id: "d2_ex1",
        type: "choose_correct",
        prompt: "She ___ coffee every morning.\n\nA) drink\nB) drinks\nC) drinking\nD) is drink",
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: "Tercera persona singular: he/she/it + verbo+s",
        mistake_tag: "third_person_s"
      },
      {
        id: "d2_ex2",
        type: "fill_in_blank",
        prompt: "I ___ (not/like) spicy food.\n\n(Escribe la forma correcta)",
        correct_answer: "don't like",
        hint: "Negativo en presente simple: don't/doesn't + verbo base",
        mistake_tag: "present_negative"
      },
      {
        id: "d2_ex3",
        type: "reorder_words",
        prompt: "Ordena:\n\n*usually / I / at / wake up / 7 AM*",
        correct_answer: "I usually wake up at 7 AM",
        hint: "Los adverbios de frecuencia van antes del verbo principal.",
        mistake_tag: "adverb_position"
      },
      {
        id: "d2_ex4",
        type: "correct_the_mistake",
        prompt: "Corrige:\n\n*\"He don't work on Saturdays.\"*",
        correct_answer: "He doesn't work on Saturdays",
        hint: "He/She/It → doesn't (no don't)",
        mistake_tag: "doesnt_vs_dont"
      }
    ],
    production_type: "text",
    production_prompt: "✍️ *Producción final:*\n\nDescribe tu rutina matutina en 3 frases usando presente simple."
  },
  {
    day: 3,
    lesson_id: "day3_past_simple",
    title: "Pasado Simple - Ayer",
    objectives: ["Narrar eventos pasados", "Usar verbos irregulares comunes"],
    exercises: [
      {
        id: "d3_ex1",
        type: "choose_correct",
        prompt: "Yesterday I ___ to the supermarket.\n\nA) go\nB) went\nC) gone\nD) going",
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: "go → went (irregular)",
        mistake_tag: "past_irregular_go"
      },
      {
        id: "d3_ex2",
        type: "fill_in_blank",
        prompt: "She ___ (not/call) me last night.\n\n(Escribe la forma correcta)",
        correct_answer: "didn't call",
        hint: "Negativo: didn't + verbo base",
        mistake_tag: "past_negative"
      },
      {
        id: "d3_ex3",
        type: "choose_correct",
        prompt: "___ you see the movie?\n\nA) Do\nB) Did\nC) Does\nD) Was",
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: "Pregunta en pasado: Did + sujeto + verbo base",
        mistake_tag: "past_question"
      },
      {
        id: "d3_ex4",
        type: "correct_the_mistake",
        prompt: "Corrige:\n\n*\"I didn't went to the party.\"*",
        correct_answer: "I didn't go to the party",
        hint: "Después de didn't usamos verbo base, no pasado.",
        mistake_tag: "didnt_base_verb"
      }
    ],
    production_type: "text",
    production_prompt: "✍️ *Producción final:*\n\nCuenta qué hiciste ayer después del trabajo/clases. Usa al menos 3 verbos en pasado."
  },
  {
    day: 4,
    lesson_id: "day4_questions",
    title: "Preguntas y Respuestas",
    objectives: ["Formar preguntas correctamente", "Responder de forma natural"],
    exercises: [
      {
        id: "d4_ex1",
        type: "reorder_words",
        prompt: "Forma una pregunta:\n\n*do / where / live / you / ?*",
        correct_answer: "Where do you live?",
        hint: "Wh-word + auxiliar + sujeto + verbo",
        mistake_tag: "wh_question_order"
      },
      {
        id: "d4_ex2",
        type: "choose_correct",
        prompt: "___  your brother work?\n\nA) Where do\nB) Where does\nC) Where is\nD) Where",
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: "brother = he → does",
        mistake_tag: "question_auxiliar"
      },
      {
        id: "d4_ex3",
        type: "fill_in_blank",
        prompt: "___ is your favorite color?\n\n(Escribe la palabra interrogativa)",
        correct_answer: "What",
        hint: "Para preguntar sobre cosas usamos What.",
        mistake_tag: "wh_words"
      },
      {
        id: "d4_ex4",
        type: "correct_the_mistake",
        prompt: "Corrige:\n\n*\"What means this word?\"*",
        correct_answer: "What does this word mean?",
        hint: "En preguntas: What + does + sujeto + verbo base",
        mistake_tag: "question_structure"
      }
    ],
    production_type: "text",
    production_prompt: "✍️ *Producción final:*\n\nEscribe 3 preguntas que le harías a un nuevo compañero de trabajo."
  },
  {
    day: 5,
    lesson_id: "day5_future",
    title: "Planes Futuros",
    objectives: ["Expresar planes con 'going to'", "Usar 'will' para decisiones"],
    exercises: [
      {
        id: "d5_ex1",
        type: "choose_correct",
        prompt: "I ___ visit my parents next weekend.\n\nA) going to\nB) am going to\nC) will going\nD) go to",
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: "Estructura: am/is/are + going to + verbo base",
        mistake_tag: "going_to_structure"
      },
      {
        id: "d5_ex2",
        type: "fill_in_blank",
        prompt: "Look at those clouds! It ___ rain.\n\n(Escribe: 's going to / will)",
        correct_answer: "'s going to",
        hint: "Cuando hay evidencia visible, usamos 'going to'.",
        mistake_tag: "going_to_vs_will"
      },
      {
        id: "d5_ex3",
        type: "choose_correct",
        prompt: "A: The phone is ringing!\nB: I ___ answer it.\n\nA) am going to\nB) will\nC) going to\nD) am will",
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: "Para decisiones espontáneas usamos 'will'.",
        mistake_tag: "will_spontaneous"
      },
      {
        id: "d5_ex4",
        type: "correct_the_mistake",
        prompt: "Corrige:\n\n*\"She will going to study medicine.\"*",
        correct_answer: "She is going to study medicine",
        hint: "No combinamos will + going to.",
        mistake_tag: "will_going_to_mix"
      }
    ],
    production_type: "text",
    production_prompt: "✍️ *Producción final:*\n\nDescribe 3 planes que tienes para este fin de semana usando 'going to'."
  },
  {
    day: 6,
    lesson_id: "day6_can_have",
    title: "Habilidades y Experiencias",
    objectives: ["Expresar habilidades con 'can'", "Hablar de experiencias con 'have'"],
    exercises: [
      {
        id: "d6_ex1",
        type: "choose_correct",
        prompt: "She ___ speak three languages.\n\nA) can\nB) cans\nC) can to\nD) is can",
        options: ["A", "B", "C", "D"],
        correct_answer: "A",
        hint: "Can no cambia: he/she/it can (sin 's')",
        mistake_tag: "can_no_s"
      },
      {
        id: "d6_ex2",
        type: "fill_in_blank",
        prompt: "I have ___ (be) to Paris twice.\n\n(Escribe el participio)",
        correct_answer: "been",
        hint: "be → was/were → been",
        mistake_tag: "been_participle"
      },
      {
        id: "d6_ex3",
        type: "choose_correct",
        prompt: "___ you ever tried sushi?\n\nA) Did\nB) Have\nC) Do\nD) Are",
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: "Para experiencias usamos Present Perfect: Have + ever + participle",
        mistake_tag: "present_perfect_experience"
      },
      {
        id: "d6_ex4",
        type: "correct_the_mistake",
        prompt: "Corrige:\n\n*\"I can't to swim.\"*",
        correct_answer: "I can't swim",
        hint: "Después de can/can't NO usamos 'to'.",
        mistake_tag: "can_no_to"
      }
    ],
    production_type: "audio",
    production_prompt: "🎤 *Producción final (audio):*\n\nGraba un audio de 10-15 segundos diciendo:\n\n_\"Hi, I'm [tu nombre]. I can [una habilidad]. I have [una experiencia].\"_\n\nO escribe *SKIP* para saltar."
  },
  {
    day: 7,
    lesson_id: "day7_review_conversation",
    title: "Conversación Práctica",
    objectives: ["Integrar todo lo aprendido", "Mantener una conversación simple"],
    exercises: [
      {
        id: "d7_ex1",
        type: "choose_correct",
        prompt: "A: What do you do?\nB: ___\n\nA) I'm fine, thanks.\nB) I work as a designer.\nC) I'm from Madrid.\nD) Nice to meet you.",
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: "'What do you do?' pregunta por tu trabajo.",
        mistake_tag: "what_do_you_do"
      },
      {
        id: "d7_ex2",
        type: "fill_in_blank",
        prompt: "I've been learning English ___ two years.\n\n(for / since)",
        correct_answer: "for",
        hint: "'for' + período de tiempo, 'since' + punto en el tiempo",
        mistake_tag: "for_vs_since"
      },
      {
        id: "d7_ex3",
        type: "reorder_words",
        prompt: "Ordena:\n\n*would / like / I / coffee / a / please*",
        correct_answer: "I would like a coffee please",
        hint: "Estructura: I would like + objeto",
        mistake_tag: "would_like_order"
      },
      {
        id: "d7_ex4",
        type: "correct_the_mistake",
        prompt: "Corrige:\n\n*\"I'm agree with you.\"*",
        correct_answer: "I agree with you",
        hint: "'Agree' es un verbo, no necesita 'am'.",
        mistake_tag: "agree_no_be"
      }
    ],
    production_type: "audio",
    production_prompt: "🎤 *Producción final (audio):*\n\nGraba 15-20 segundos presentándote como si estuvieras en una reunión de trabajo:\n\n_\"Hello everyone, my name is... I work as... I've been... Nice to meet you!\"_\n\nO escribe *SKIP* para saltar."
  }
];

// ============== GLOBAL STATE ==============

let globalSupabase: SupabaseClientType | null = null;

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

// ============== WHATSAPP FUNCTIONS ==============

async function sendWhatsAppText(to: string, body: string): Promise<{ success: boolean; messageId?: string }> {
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    console.error("[WhatsApp] Missing credentials");
    return { success: false };
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const response = await fetch(url, {
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

    const result = await response.json();

    if (response.ok) {
      const messageId = result.messages?.[0]?.id;
      console.log("[WhatsApp] ✅ Sent to:", to.slice(0, 4) + "****");
      return { success: true, messageId };
    } else {
      console.error("[WhatsApp] ❌ Error:", result);
      return { success: false };
    }
  } catch (error) {
    console.error("[WhatsApp] ❌ Exception:", error);
    return { success: false };
  }
}

async function send(to: string, msg1: string, msg2?: string): Promise<void> {
  const result1 = await sendWhatsAppText(to, msg1);

  if (globalSupabase && result1.success) {
    await trackEvent(globalSupabase, to, "message_sent", {
      text: msg1.slice(0, 500),
      message_id: result1.messageId || null,
    });
  }

  if (msg2) {
    await new Promise((r) => setTimeout(r, 600));
    const result2 = await sendWhatsAppText(to, msg2);

    if (globalSupabase && result2.success) {
      await trackEvent(globalSupabase, to, "message_sent", {
        text: msg2.slice(0, 500),
        message_id: result2.messageId || null,
      });
    }
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

  if (trial.lessons_completed >= TRIAL_LESSONS) {
    return { active: false, reason: "lessons_limit" };
  }

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
        model: "google/gemini-2.5-flash",
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

async function evaluateWrittenProduction(text: string): Promise<{ score: number; notes: string }> {
  const systemPrompt = `Eres un evaluador de inglés. Evalúa el siguiente texto escrito por un estudiante hispanohablante.

CRITERIOS:
- Gramática básica correcta
- Vocabulario apropiado
- Claridad del mensaje
- Esfuerzo comunicativo

Devuelve SOLO JSON:
{"score": 1-5, "notes": "feedback corto en español, máximo 2 líneas"}`;

  const response = await callAI(systemPrompt, text);

  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      const result = JSON.parse(match[0]);
      return {
        score: Math.min(5, Math.max(1, Number(result.score) || 3)),
        notes: String(result.notes || "Buen esfuerzo.")
      };
    }
  } catch (e) {
    console.error("[AI] Parse error:", e);
  }

  // Fallback: heurística simple
  const words = text.split(/\s+/).length;
  const hasCapital = /[A-Z]/.test(text);
  const hasPeriod = /[.!?]/.test(text);
  let score = 3;
  if (words >= 10) score++;
  if (hasCapital && hasPeriod) score++;
  
  return { score: Math.min(5, score), notes: "Gracias por tu respuesta. ¡Sigue practicando!" };
}

async function evaluateExerciseAnswer(
  exercise: LessonExercise,
  userAnswer: string
): Promise<{ correct: boolean; feedback: string }> {
  const normalizedAnswer = userAnswer.trim().toLowerCase().replace(/[.,!?]/g, "");
  const normalizedCorrect = exercise.correct_answer.toLowerCase().replace(/[.,!?]/g, "");

  // Para opciones múltiples, comparar directamente
  if (exercise.type === "choose_correct" && exercise.options) {
    const isCorrect = normalizedAnswer === normalizedCorrect || 
                      userAnswer.toUpperCase() === exercise.correct_answer.toUpperCase();
    
    return {
      correct: isCorrect,
      feedback: isCorrect 
        ? "✅ ¡Correcto! 🎯" 
        : `❌ La respuesta correcta era *${exercise.correct_answer}*. ${exercise.hint || ""}`
    };
  }

  // Para fill_in_blank y otros, ser flexible
  const isClose = normalizedAnswer.includes(normalizedCorrect) || 
                  normalizedCorrect.includes(normalizedAnswer) ||
                  normalizedAnswer === normalizedCorrect;

  if (isClose) {
    return { correct: true, feedback: "✅ ¡Muy bien! 🌟" };
  }

  // Intentar con AI para respuestas más complejas
  const systemPrompt = `Evalúa si la respuesta del estudiante es aceptable.

EJERCICIO: ${exercise.prompt}
RESPUESTA ESPERADA: ${exercise.correct_answer}
RESPUESTA DEL ESTUDIANTE: ${userAnswer}

Sé flexible con errores menores de ortografía.
Devuelve SOLO JSON: {"correct": true/false, "feedback": "1 línea en español"}`;

  const response = await callAI(systemPrompt, userAnswer);

  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      const result = JSON.parse(match[0]);
      return {
        correct: Boolean(result.correct),
        feedback: String(result.feedback)
      };
    }
  } catch (e) {
    console.error("[AI] Parse error:", e);
  }

  return {
    correct: false,
    feedback: `❌ Esperábamos algo como: *${exercise.correct_answer}*\n💡 ${exercise.hint || ""}`
  };
}

// ============== PLACEMENT TEST FLOW (MVP1) ==============

async function startPlacement(supabase: SupabaseClientType, waId: string, data: StateData): Promise<void> {
  await trackEvent(supabase, waId, "placement_started", {});

  const placement: PlacementState = {
    part: 1,
    question_index: 0,
    mcq_answers: [],
    mcq_score: 0
  };

  await updateState(supabase, waId, "placement_q1", { ...data, placement });
  await send(waId, 
    "🎓 *Placement Test*\n\n¡Vamos a descubrir tu nivel! Son 3 partes cortas:\n\n" +
    "📝 Parte 1: 3 preguntas rápidas\n" +
    "✍️ Parte 2: Escribe sobre ti\n" +
    "🎤 Parte 3: Audio opcional\n\n" +
    "_¡Tarda solo 2-4 minutos!_ ⏱️"
  );
  
  await new Promise(r => setTimeout(r, 1000));
  await send(waId, PLACEMENT_QUESTIONS[0].question);
}

async function handlePlacementQuestion(
  supabase: SupabaseClientType,
  waId: string,
  answer: string,
  state: { step: string; data: StateData }
): Promise<void> {
  const placement = state.data.placement!;
  const qIndex = placement.question_index;
  const question = PLACEMENT_QUESTIONS[qIndex];
  const normalized = answer.toUpperCase().trim();

  if (!["A", "B", "C", "D"].includes(normalized)) {
    await send(waId, "Responde con *A*, *B*, *C* o *D* 📝");
    return;
  }

  const isCorrect = normalized === question.correct;
  
  placement.mcq_answers.push({
    q_id: question.id,
    answer: normalized,
    correct: isCorrect
  });

  if (isCorrect) {
    placement.mcq_score++;
  }

  await trackEvent(supabase, waId, "placement_question_answered", {
    q_id: question.id,
    answer: normalized,
    correct: isCorrect,
    feedback: isCorrect ? question.feedback_correct : question.feedback_wrong
  });

  // Dar feedback inmediato
  await send(waId, isCorrect ? question.feedback_correct : question.feedback_wrong);
  await new Promise(r => setTimeout(r, 800));

  if (qIndex < PLACEMENT_QUESTIONS.length - 1) {
    // Siguiente pregunta
    placement.question_index++;
    await updateState(supabase, waId, `placement_q${qIndex + 2}`, { ...state.data, placement });
    await send(waId, PLACEMENT_QUESTIONS[qIndex + 1].question);
  } else {
    // Fin Parte 1, inicio Parte 2
    placement.part = 2;
    await updateState(supabase, waId, "placement_written", { ...state.data, placement });
    await send(waId,
      "✅ *Parte 1 completada!*\n\n" +
      "📝 *Parte 2/3 — Producción escrita*\n\n" +
      "Escribe 2 frases en inglés:\n" +
      "1. Quién eres y a qué te dedicas\n" +
      "2. Por qué quieres aprender inglés\n\n" +
      "_Ejemplo: \"I'm Ana, I work as a nurse. I want to learn English because...\"_"
    );
  }
}

async function handlePlacementWritten(
  supabase: SupabaseClientType,
  waId: string,
  text: string,
  state: { step: string; data: StateData }
): Promise<void> {
  const placement = state.data.placement!;
  
  // Evaluar texto
  const evaluation = await evaluateWrittenProduction(text);
  
  placement.written_text = text;
  placement.written_score = evaluation.score;

  await trackEvent(supabase, waId, "placement_written_submitted", {
    text: text.slice(0, 1000),
    score: evaluation.score,
    notes: evaluation.notes
  });

  await send(waId, `✅ *¡Recibido!* ${evaluation.notes}`);
  await new Promise(r => setTimeout(r, 800));

  // Parte 3: Audio opcional
  placement.part = 3;
  await updateState(supabase, waId, "placement_audio", { ...state.data, placement });
  
  await send(waId,
    "🎤 *Parte 3/3 — Audio (opcional)*\n\n" +
    "Graba un audio de 10-15 segundos diciendo:\n\n" +
    "_\"Hi, I'm [nombre]. I'm from [país]. I want to learn English because [motivo].\"_\n\n" +
    "📨 Envía el audio o escribe *SKIP* para saltar."
  );
}

async function handlePlacementAudio(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData },
  audioData?: { media_id: string }
): Promise<void> {
  const placement = state.data.placement!;

  if (audioData) {
    placement.audio_received = true;
    placement.audio_media_id = audioData.media_id;

    await trackEvent(supabase, waId, "placement_audio_received", {
      media_id: audioData.media_id,
      duration: null,
      transcript: null,
      score: null
    });

    await send(waId, "🎤 ¡Audio recibido! Gracias por el esfuerzo extra. 🌟");
  } else {
    placement.audio_received = false;
    await send(waId, "👍 Sin problema, continuamos.");
  }

  await new Promise(r => setTimeout(r, 500));
  await finishPlacement(supabase, waId, state);
}

async function finishPlacement(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData }
): Promise<void> {
  const placement = state.data.placement!;
  
  // Calcular nivel basado en puntuación
  let totalScore = placement.mcq_score;
  if (placement.written_score && placement.written_score >= 4) totalScore++;
  if (placement.audio_received) totalScore++;
  
  const cefrLevel = LEVEL_MAPPING[Math.min(6, totalScore)] || "A1";
  const internalLevel = LEVEL_TO_INTERNAL[cefrLevel];

  // Determinar fortalezas y debilidades
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  const q1Correct = placement.mcq_answers[0]?.correct;
  const q2Correct = placement.mcq_answers[1]?.correct;
  const q3Correct = placement.mcq_answers[2]?.correct;

  if (q1Correct) strengths.push("Uso de tiempos verbales básicos");
  else weaknesses.push("Tiempos verbales en contexto");

  if (q2Correct) strengths.push("Preposiciones y colocaciones");
  else weaknesses.push("Preposiciones y expresiones fijas");

  if (q3Correct) strengths.push("Estructura de oraciones");
  else weaknesses.push("Orden de palabras y negaciones");

  if (placement.written_score && placement.written_score >= 4) {
    strengths.push("Producción escrita");
  } else {
    weaknesses.push("Práctica de escritura");
  }

  // Guardar nivel
  await updateUserLevel(supabase, waId, internalLevel);

  await trackEvent(supabase, waId, "placement_completed", {
    level: cefrLevel,
    internal_level: internalLevel,
    total_score: totalScore,
    mcq_score: placement.mcq_score,
    written_score: placement.written_score,
    audio_received: placement.audio_received,
    strengths,
    weaknesses,
    recommended_plan: "Plan 7 días"
  });

  // Inicializar progreso para Plan 7 días
  const progress: LessonProgress = {
    current_day: 1,
    current_exercise_index: 0,
    day_score: 0,
    day_attempts: 0,
    exercises_completed: 0,
    total_lessons_completed: 0,
    goal: "general",
    onboarding_complete: false,
    trial: initTrial(),
    mistake_tags: []
  };

  await updateState(supabase, waId, "placement_result", { 
    ...state.data, 
    placement: undefined,
    progress 
  });

  // Mostrar resultado
  await send(waId,
    `🎓 *¡Resultado del Placement Test!*\n\n` +
    `📊 *Tu nivel: ${cefrLevel} — ${LEVEL_NAMES[internalLevel]}*\n\n` +
    `✅ *Puntos fuertes:*\n${strengths.map(s => `• ${s}`).join("\n")}\n\n` +
    `📈 *Por mejorar:*\n${weaknesses.map(w => `• ${w}`).join("\n")}`
  );

  await new Promise(r => setTimeout(r, 1200));

  await send(waId,
    `🚀 *Tu Plan Recomendado: 7 días*\n\n` +
    `• 7 lecciones estructuradas\n` +
    `• Ejercicios interactivos diarios\n` +
    `• Producción escrita y oral\n` +
    `• Checkpoints de progreso\n\n` +
    `Escribe *NEXT* para empezar el Día 1 🎯`
  );
}

// ============== DAY LESSON FLOW (MVP2) ==============

async function startDayLesson(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData }
): Promise<void> {
  const progress = state.data.progress!;
  const day = progress.current_day;
  const lesson = SEVEN_DAY_PLAN.find(l => l.day === day);

  if (!lesson) {
    await send(waId, "🎉 ¡Has completado el Plan de 7 días! Escribe *REVIEW* para repasar.");
    return;
  }

  progress.current_exercise_index = 0;
  progress.day_score = 0;
  progress.day_attempts = 0;

  await trackEvent(supabase, waId, "lesson_started", {
    lesson_id: lesson.lesson_id,
    day
  });

  await updateState(supabase, waId, "day_intro", { ...state.data, progress });

  const trialInfo = getTrialProgress(progress.trial!);

  await send(waId,
    `📖 *Día ${day}/7 — ${lesson.title}*\n\n` +
    `🎯 *Objetivos:*\n${lesson.objectives.map(o => `• ${o}`).join("\n")}\n\n` +
    `⏱️ ~5-8 min | ⏳ ${trialInfo.lessonsLeft} lecciones restantes`
  );

  await new Promise(r => setTimeout(r, 1000));
  await sendExercise(supabase, waId, state, lesson.exercises[0]);
}

async function sendExercise(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData },
  exercise: LessonExercise
): Promise<void> {
  const progress = state.data.progress!;
  const day = SEVEN_DAY_PLAN.find(l => l.day === progress.current_day)!;
  const total = day.exercises.length;
  const current = progress.current_exercise_index + 1;

  const emoji: Record<ExerciseType, string> = {
    fill_in_blank: "✏️",
    reorder_words: "🔀",
    choose_correct: "🅰️",
    correct_the_mistake: "🔧",
    translation: "🔄",
    written_production: "✍️",
    shadowing: "🎤"
  };

  await updateState(supabase, waId, "lesson_exercise", { ...state.data, progress });

  await send(waId,
    `${emoji[exercise.type] || "📝"} *Ejercicio ${current}/${total}*\n\n` +
    `${exercise.prompt}`
  );
}

async function handleExerciseAnswer(
  supabase: SupabaseClientType,
  waId: string,
  answer: string,
  state: { step: string; data: StateData }
): Promise<void> {
  const progress = state.data.progress!;
  const day = SEVEN_DAY_PLAN.find(l => l.day === progress.current_day)!;
  const exercise = day.exercises[progress.current_exercise_index];

  if (!exercise) {
    await startDayProduction(supabase, waId, state);
    return;
  }

  const evaluation = await evaluateExerciseAnswer(exercise, answer);
  progress.day_attempts++;

  if (evaluation.correct) {
    progress.day_score++;
    progress.exercises_completed++;
  } else {
    // Registrar mistake_tag
    progress.mistake_tags = progress.mistake_tags || [];
    const existingTag = progress.mistake_tags.find(t => t.tag === exercise.mistake_tag);
    if (existingTag) {
      existingTag.count++;
      existingTag.last_seen = new Date().toISOString();
    } else {
      progress.mistake_tags.push({
        tag: exercise.mistake_tag,
        count: 1,
        last_seen: new Date().toISOString()
      });
    }
  }

  await trackEvent(supabase, waId, "exercise_answered", {
    lesson_id: day.lesson_id,
    ex_id: exercise.id,
    user_answer: answer,
    correct: evaluation.correct,
    feedback: evaluation.feedback,
    mistake_tag: evaluation.correct ? null : exercise.mistake_tag
  });

  await send(waId, evaluation.feedback);
  await new Promise(r => setTimeout(r, 600));

  // Siguiente ejercicio o producción
  progress.current_exercise_index++;

  if (progress.current_exercise_index < day.exercises.length) {
    await sendExercise(supabase, waId, state, day.exercises[progress.current_exercise_index]);
  } else {
    await startDayProduction(supabase, waId, state);
  }
}

async function startDayProduction(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData }
): Promise<void> {
  const progress = state.data.progress!;
  const day = SEVEN_DAY_PLAN.find(l => l.day === progress.current_day)!;

  await updateState(supabase, waId, "day_production", { ...state.data, progress });

  await send(waId, day.production_prompt);
}

async function handleDayProduction(
  supabase: SupabaseClientType,
  waId: string,
  content: string,
  state: { step: string; data: StateData },
  isAudio: boolean = false,
  audioId?: string
): Promise<void> {
  const progress = state.data.progress!;
  const day = SEVEN_DAY_PLAN.find(l => l.day === progress.current_day)!;

  let score = 3;
  let notes = "¡Buen trabajo!";

  if (!isAudio && content.toUpperCase() !== "SKIP") {
    const evaluation = await evaluateWrittenProduction(content);
    score = evaluation.score;
    notes = evaluation.notes;
  } else if (isAudio) {
    score = 4;
    notes = "¡Excelente que practiques el audio! 🎤";
  }

  await trackEvent(supabase, waId, "production_submitted", {
    lesson_id: day.lesson_id,
    type: isAudio ? "audio" : "text",
    content: isAudio ? null : content.slice(0, 1000),
    media_id: audioId || null,
    score,
    notes
  });

  if (content.toUpperCase() !== "SKIP") {
    await send(waId, `${notes}\n\n⭐ Puntuación: ${score}/5`);
    await new Promise(r => setTimeout(r, 600));
  }

  await finishDayLesson(supabase, waId, state);
}

async function finishDayLesson(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData }
): Promise<void> {
  const progress = state.data.progress!;
  const day = SEVEN_DAY_PLAN.find(l => l.day === progress.current_day)!;
  
  const accuracy = progress.day_attempts > 0 
    ? progress.day_score / progress.day_attempts 
    : 0;
  
  const passed = accuracy >= PASSING_SCORE;

  await trackEvent(supabase, waId, passed ? "checkpoint_passed" : "checkpoint_failed", {
    lesson_id: day.lesson_id,
    day: day.day,
    score: progress.day_score,
    attempts: progress.day_attempts,
    accuracy: Math.round(accuracy * 100)
  });

  await trackEvent(supabase, waId, "lesson_completed", {
    lesson_id: day.lesson_id,
    day: day.day,
    score: progress.day_score,
    mistakes: progress.mistake_tags?.filter(t => t.last_seen === new Date().toISOString().slice(0, 10))
  });

  progress.trial!.lessons_completed++;
  progress.total_lessons_completed++;

  if (passed) {
    progress.current_day++;
    await updateState(supabase, waId, "day_complete", { ...state.data, progress });

    const hasNextDay = progress.current_day <= 7;
    
    await send(waId,
      `🎉 *¡Día ${day.day} completado!*\n\n` +
      `✅ Checkpoint: *APROBADO*\n` +
      `📊 Aciertos: ${progress.day_score}/${progress.day_attempts} (${Math.round(accuracy * 100)}%)\n\n` +
      (hasNextDay 
        ? `Escribe *NEXT* para el Día ${progress.current_day} 🚀`
        : `🏆 ¡Has completado los 7 días! Escribe *PROGRESO* para ver tu resumen.`)
    );
  } else {
    await updateState(supabase, waId, "day_failed", { ...state.data, progress });

    await send(waId,
      `📝 *Día ${day.day} — Necesitas más práctica*\n\n` +
      `📊 Aciertos: ${progress.day_score}/${progress.day_attempts} (${Math.round(accuracy * 100)}%)\n` +
      `🎯 Necesitas: ${Math.round(PASSING_SCORE * 100)}%\n\n` +
      `Escribe *REVIEW* para repasar tus errores 📚\n` +
      `O *NEXT* para reintentar el día.`
    );
  }
}

// ============== REVIEW SYSTEM (MVP2) ==============

async function startReview(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData }
): Promise<void> {
  const progress = state.data.progress!;
  const mistakeTags = progress.mistake_tags || [];

  if (mistakeTags.length === 0) {
    await send(waId, "✨ ¡No tienes errores registrados! Escribe *NEXT* para continuar.");
    return;
  }

  // Ordenar por frecuencia y recencia
  const sortedTags = [...mistakeTags].sort((a, b) => {
    const scoreA = a.count * 2 + (new Date().getTime() - new Date(a.last_seen).getTime()) / (1000 * 60 * 60 * 24);
    const scoreB = b.count * 2 + (new Date().getTime() - new Date(b.last_seen).getTime()) / (1000 * 60 * 60 * 24);
    return scoreB - scoreA;
  });

  // Encontrar hasta 3 ejercicios basados en los errores
  const reviewExercises: LessonExercise[] = [];
  
  for (const tag of sortedTags.slice(0, 3)) {
    for (const day of SEVEN_DAY_PLAN) {
      const exercise = day.exercises.find(e => e.mistake_tag === tag.tag);
      if (exercise && !reviewExercises.find(e => e.id === exercise.id)) {
        reviewExercises.push(exercise);
        break;
      }
    }
  }

  if (reviewExercises.length === 0) {
    await send(waId, "✨ ¡No hay ejercicios de repaso disponibles! Escribe *NEXT* para continuar.");
    return;
  }

  progress.review_mode = true;
  progress.review_exercises = reviewExercises;
  progress.review_index = 0;

  await trackEvent(supabase, waId, "review_started", {
    exercise_count: reviewExercises.length,
    tags: sortedTags.slice(0, 3).map(t => t.tag)
  });

  await updateState(supabase, waId, "review_exercise", { ...state.data, progress });

  await send(waId,
    `📚 *Modo Repaso*\n\n` +
    `Vamos a practicar ${reviewExercises.length} ejercicios basados en tus errores más frecuentes.\n\n` +
    `¡Vamos! 💪`
  );

  await new Promise(r => setTimeout(r, 800));
  await sendReviewExercise(supabase, waId, state);
}

async function sendReviewExercise(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData }
): Promise<void> {
  const progress = state.data.progress!;
  const exercises = progress.review_exercises!;
  const index = progress.review_index!;
  const exercise = exercises[index];

  await send(waId,
    `📝 *Repaso ${index + 1}/${exercises.length}*\n\n` +
    `${exercise.prompt}`
  );
}

async function handleReviewAnswer(
  supabase: SupabaseClientType,
  waId: string,
  answer: string,
  state: { step: string; data: StateData }
): Promise<void> {
  const progress = state.data.progress!;
  const exercises = progress.review_exercises!;
  const index = progress.review_index!;
  const exercise = exercises[index];

  const evaluation = await evaluateExerciseAnswer(exercise, answer);

  if (evaluation.correct) {
    // Reducir conteo del mistake_tag
    const tag = progress.mistake_tags?.find(t => t.tag === exercise.mistake_tag);
    if (tag && tag.count > 0) {
      tag.count--;
    }
  }

  await send(waId, evaluation.feedback);
  await new Promise(r => setTimeout(r, 600));

  progress.review_index!++;

  if (progress.review_index! < exercises.length) {
    await updateState(supabase, waId, "review_exercise", { ...state.data, progress });
    await sendReviewExercise(supabase, waId, state);
  } else {
    // Fin del repaso
    progress.review_mode = false;
    progress.review_exercises = undefined;
    progress.review_index = undefined;

    await trackEvent(supabase, waId, "review_completed", {});

    await updateState(supabase, waId, "ready", { ...state.data, progress });

    await send(waId,
      `✅ *¡Repaso completado!*\n\n` +
      `Escribe *NEXT* para continuar con tu plan 🚀`
    );
  }
}

// ============== COMMAND HANDLERS ==============

function parseGoal(text: string): LearningGoal | null {
  const lower = text.toLowerCase();
  if (lower.includes("trabajo") || lower.includes("work") || lower.includes("profesional")) return "work";
  if (lower.includes("viaje") || lower.includes("travel")) return "travel";
  if (lower.includes("conversa") || lower.includes("conversation") || lower.includes("chat")) return "conversation";
  return null;
}

async function handleProgressCommand(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData },
  user: { level: EnglishLevel | null }
): Promise<void> {
  const progress = state.data.progress;
  
  if (!progress || !user.level) {
    await send(waId, "¡Aún no has empezado! Envía cualquier mensaje para comenzar. 🚀");
    return;
  }

  const trialInfo = getTrialProgress(progress.trial!);
  const topMistakes = (progress.mistake_tags || [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(t => t.tag.replace(/_/g, " "));

  // Generar link a la página de progreso
  const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "https://speakeasilynexo-digitalapp.lovable.app";
  const progressUrl = `${baseUrl}/u/${waId}`;

  await send(waId,
    `📊 *Tu Progreso*\n\n` +
    `🎯 Nivel: ${LEVEL_NAMES[user.level]}\n` +
    `📖 Día actual: ${progress.current_day}/7\n` +
    `✅ Lecciones completadas: ${progress.total_lessons_completed}\n` +
    `⏳ Prueba: ${trialInfo.lessonsLeft} lecciones / ${trialInfo.daysLeft} días\n\n` +
    (topMistakes.length > 0 
      ? `📝 *Errores frecuentes:*\n${topMistakes.map(m => `• ${m}`).join("\n")}\n\n`
      : "") +
    `🔗 *Ver detalle:*\n${progressUrl}`
  );
}

async function handleRestartCommand(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData }
): Promise<void> {
  if (state.step !== "confirm_restart") {
    await updateState(supabase, waId, "confirm_restart", state.data);
    await send(waId, 
      "⚠️ *¿Seguro que quieres reiniciar?*\n\n" +
      "Esto borrará tu progreso actual.\n\n" +
      "Escribe *SI* para confirmar o *NO* para cancelar."
    );
    return;
  }
}

// ============== MAIN MESSAGE PROCESSOR ==============

async function processMessage(
  supabase: SupabaseClientType,
  waId: string,
  userName: string | null,
  messageText: string,
  audioData?: { media_id: string }
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
      current_day: 1,
      current_exercise_index: 0,
      day_score: 0,
      day_attempts: 0,
      exercises_completed: 0,
      total_lessons_completed: 0,
      goal: "general" as LearningGoal,
      trial: initTrial(),
      mistake_tags: []
    };
    progress.trial = initTrial();
    await updateState(supabase, waId, state.step, { ...state.data, progress });
    await trackEvent(supabase, waId, "user_started", { name: userName });
  }

  // ========== GLOBAL COMMANDS ==========

  // Handle confirm_restart step first
  if (state.step === "confirm_restart") {
    if (normalized === "SI" || normalized === "SÍ" || normalized === "YES") {
      await updateState(supabase, waId, "welcome", {});
      await send(waId, "🔄 ¡Reiniciado! Envía cualquier mensaje para empezar.");
    } else {
      await updateState(supabase, waId, "ready", state.data);
      await send(waId, "👍 Cancelado. Escribe *NEXT* para continuar.");
    }
    return;
  }

  if (lower === "restart" || lower === "reiniciar") {
    await handleRestartCommand(supabase, waId, state);
    return;
  }

  if (lower === "help" || lower === "ayuda") {
    await send(waId,
      `📚 *Comandos disponibles:*\n\n` +
      `• *NEXT* — Continuar con el plan\n` +
      `• *PROGRESO* — Ver tu avance y link\n` +
      `• *REVIEW* — Repasar errores\n` +
      `• *RESTART* — Reiniciar (con confirmación)\n\n` +
      `💬 ¡Escribe lo que necesites!`
    );
    return;
  }

  if (lower === "progress" || lower === "progreso") {
    await handleProgressCommand(supabase, waId, state, user);
    return;
  }

  if (lower === "review" || lower === "repaso" || lower === "repasar") {
    if (progress) {
      await startReview(supabase, waId, state);
    } else {
      await send(waId, "Primero completa el placement test. Envía cualquier mensaje para empezar.");
    }
    return;
  }

  // ========== STEP-BASED FLOW ==========

  switch (state.step) {
    case "welcome": {
      await send(waId,
        `🎓 *¡Hola, ${displayName}!*\n\n` +
        `Soy tu coach de inglés por WhatsApp. 💬\n\n` +
        `Primero, haremos un *Placement Test* rápido (2-4 min) para conocer tu nivel.\n\n` +
        `¿Listo? Escribe *OK* para empezar 🚀`
      );
      await updateState(supabase, waId, "pre_placement", { ...state.data, progress });
      break;
    }

    case "pre_placement": {
      await startPlacement(supabase, waId, state.data);
      break;
    }

    case "placement_q1":
    case "placement_q2":
    case "placement_q3": {
      await handlePlacementQuestion(supabase, waId, messageText, state);
      break;
    }

    case "placement_written": {
      await handlePlacementWritten(supabase, waId, messageText, state);
      break;
    }

    case "placement_audio": {
      if (audioData) {
        await handlePlacementAudio(supabase, waId, state, audioData);
      } else if (normalized === "SKIP" || normalized === "SALTAR") {
        await handlePlacementAudio(supabase, waId, state);
      } else {
        await send(waId, "🎤 Envía un audio o escribe *SKIP* para saltar.");
      }
      break;
    }

    case "placement_result": {
      if (["NEXT", "SIGUIENTE", "OK", "SI", "SÍ", "YES"].includes(normalized)) {
        // Preguntar objetivo antes de empezar
        await send(waId,
          `🎯 *¿Cuál es tu objetivo principal?*\n\n` +
          `🏢 *TRABAJO* — Inglés profesional\n` +
          `✈️ *VIAJE* — Inglés para viajes\n` +
          `💬 *CONVERSACIÓN* — Hablar con nativos\n` +
          `📚 *GENERAL* — Un poco de todo\n\n` +
          `_Escribe tu elección_`
        );
        await updateState(supabase, waId, "select_goal", state.data);
      } else {
        await send(waId, "Escribe *NEXT* para empezar el Plan de 7 días 🚀");
      }
      break;
    }

    case "select_goal": {
      const goal = parseGoal(messageText) || "general";
      progress!.goal = goal;
      progress!.onboarding_complete = true;
      
      await trackEvent(supabase, waId, "goal_selected", { goal });
      await trackEvent(supabase, waId, "onboarding_complete", {});
      
      await send(waId, `✅ *Objetivo: ${GOAL_NAMES[goal]}*\n\n¡Perfecto! Vamos a empezar. 🚀`);
      await new Promise(r => setTimeout(r, 800));
      await startDayLesson(supabase, waId, { ...state, data: { ...state.data, progress } });
      break;
    }

    case "ready":
    case "day_complete":
    case "day_failed": {
      if (["NEXT", "SIGUIENTE", "OK", "CONTINUAR"].includes(normalized)) {
        await startDayLesson(supabase, waId, state);
      } else {
        await send(waId, "Escribe *NEXT* para continuar o *REVIEW* para repasar. 📚");
      }
      break;
    }

    case "day_intro":
    case "lesson_exercise": {
      await handleExerciseAnswer(supabase, waId, messageText, state);
      break;
    }

    case "day_production": {
      if (audioData) {
        await handleDayProduction(supabase, waId, messageText, state, true, audioData.media_id);
      } else {
        await handleDayProduction(supabase, waId, messageText, state);
      }
      break;
    }

    case "review_exercise": {
      await handleReviewAnswer(supabase, waId, messageText, state);
      break;
    }

    default: {
      // Estado desconocido, reiniciar flujo
      if (user.level) {
        await send(waId, "¡Vamos a continuar! 🚀", 'Escribe *NEXT* para tu próxima lección.');
        await updateState(supabase, waId, "ready", state.data);
      } else {
        await updateState(supabase, waId, "welcome", { progress });
        await processMessage(supabase, waId, userName, "start");
      }
      break;
    }
  }
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
        
        const waId = message.from;
        const contact = value.contacts?.find((c) => c.wa_id === waId);

        // Track message_received for ALL message types
        try {
          await supabase.from("wa_events").insert({
            wa_id: waId,
            event_type: "message_received",
            metadata: {
              type: message.type,
              text: message.text?.body || null,
              audio_id: message.audio?.id || null,
              message_id: message.id,
              timestamp: message.timestamp,
              contact_name: contact?.profile?.name || null,
            },
          });
          console.log("[WEBHOOK] message_received tracked for:", maskWaId(waId));
        } catch (trackError) {
          console.error("[WEBHOOK] Error tracking message_received:", trackError);
        }

        // Process text messages
        if (message.type === "text" && message.text?.body) {
          const messageText = message.text.body;
          console.log("[WEBHOOK] Message from:", maskWaId(waId));

          try {
            await processMessage(supabase, waId, contact?.profile?.name ?? null, messageText);
            console.log("[WEBHOOK] processMessage completed for:", maskWaId(waId));
          } catch (processError) {
            console.error("[WEBHOOK] Error in processMessage for:", maskWaId(waId), processError);
          }
        }
        // Process audio messages
        else if (message.type === "audio" && message.audio?.id) {
          console.log("[WEBHOOK] Audio message from:", maskWaId(waId));
          
          try {
            await processMessage(
              supabase, 
              waId, 
              contact?.profile?.name ?? null, 
              "[AUDIO]",
              { media_id: message.audio.id }
            );
            console.log("[WEBHOOK] Audio processMessage completed for:", maskWaId(waId));
          } catch (processError) {
            console.error("[WEBHOOK] Error in audio processMessage for:", maskWaId(waId), processError);
          }
        }
        else {
          console.log("[WEBHOOK] Skipping unsupported message type (already tracked)");
        }
      }
    }
  }

  console.log("[WEBHOOK] Background processing completed");
}

// ============== MAIN HANDLER ==============

serve(async (req: Request) => {
  console.log(`[WEBHOOK] ${req.method} ${req.url}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ====== VERIFY (GET) ======
  if (req.method === "GET") {
    console.log("[WEBHOOK] GET request - webhook verification");
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

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

    let raw: string;
    try {
      raw = await req.text();
      console.log("[WEBHOOK] Body read successfully, length:", raw.length);
    } catch (readError) {
      console.error("[WEBHOOK] Failed to read body:", readError);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    let body: WhatsAppWebhookPayload;
    try {
      body = JSON.parse(raw);
      console.log("[WEBHOOK] JSON parsed, object:", body?.object);
    } catch (parseError) {
      console.error("[WEBHOOK] JSON parse failed:", parseError);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    if (body.object !== "whatsapp_business_account") {
      console.log("[WEBHOOK] Not a WhatsApp Business payload, ignoring");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("[WEBHOOK] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const supabase: SupabaseClientType = createClient(supabaseUrl, supabaseKey);
    globalSupabase = supabase;
    console.log("[WEBHOOK] Supabase client created");

    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      console.log("[WEBHOOK] Using EdgeRuntime.waitUntil for background processing");
      // @ts-ignore
      EdgeRuntime.waitUntil(processWebhookPayload(body, supabase));
    } else {
      console.log("[WEBHOOK] EdgeRuntime not available, processing inline");
      try {
        await processWebhookPayload(body, supabase);
      } catch (processingError) {
        console.error("[WEBHOOK] Error in inline processing:", processingError);
      }
    }

    console.log("[WEBHOOK] Returning 200 OK to Meta");
    return new Response("OK", { status: 200, headers: corsHeaders });
  }

  console.log("[WEBHOOK] Unknown method:", req.method);
  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
