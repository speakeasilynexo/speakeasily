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
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string };
  };
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
type Language = "pt" | "es" | "en";

// Exercise types for MVP2
type ExerciseType = "fill_in_blank" | "reorder_words" | "choose_correct" | "correct_the_mistake" | "translation" | "written_production" | "shadowing";

interface TrialInfo {
  trial_started_at: string;
  lessons_completed: number;
  trial_status: TrialStatus;
}

interface UserData {
  wa_id: string;
  name: string | null;
  level: EnglishLevel | null;
  subscription_status: string;
  trial_started_at: string | null;
  trial_expires_at: string | null;
  trial_completed: boolean;
  is_subscribed: boolean;
  subscription_plan: string | null;
  preferred_language: Language | null;
  show_translations: boolean;
  prefers_audio: boolean;
  expires_at: string | null;
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
  title: Record<Language, string>;
  objectives: Record<Language, string[]>;
  exercises: LessonExercise[];
  production_type: "text" | "audio";
  production_prompt: Record<Language, string>;
}

interface LessonExercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  prompt_translation?: Record<"pt" | "es", string>;
  options?: string[];
  correct_answer: string;
  hint?: Record<Language, string>;
  mistake_tag: string;
  feedback_correct?: Record<Language, string>;
  feedback_wrong?: Record<Language, string>;
}

interface ReviewCountToday {
  date: string;
  count: number;
}

interface LessonProgress {
  current_day: number;
  current_exercise_index: number;
  day_score: number;
  day_attempts: number;
  exercises_completed: number;
  total_lessons_completed: number;
  detected_level?: EnglishLevel;
  goal?: LearningGoal;
  onboarding_complete?: boolean;
  trial?: TrialInfo;
  mistake_tags?: MistakeTag[];
  review_mode?: boolean;
  review_exercises?: LessonExercise[];
  review_index?: number;
  review_count_today?: ReviewCountToday;
}

interface TranslationPayload {
  target_en: string;
  translation_native: string;
  corrected_en?: string;
  corrected_native?: string;
  natural_en?: string;
  natural_native?: string;
  explanation?: string;
  tip?: string;
}

interface StateData {
  placement?: PlacementState;
  progress?: LessonProgress;
  generated_lesson_cache?: Record<string, DayLesson>;
  // Audio practice state: tracks the current target sentence for repetition
  audio_practice?: {
    target_sentence: string;
    target_translation: string;
    attempts: number;
  };
  last_target?: {
    en: string;
    translation: string;
  };
  // Rich translation payload for "TRADUCAO" command
  last_translation_payload?: TranslationPayload;
  // Audio flags to prevent repetition within a session
  welcome_audio_sent?: boolean;
  translation_hint_sent?: boolean;
}

type EventType =
  | "lesson_completed"
  | "exercise_failed"
  | "goal_selected"
  | "trial_ended"
  | "trial_started"
  | "trial_completed"
  | "trial_expired"
  | "paywall_shown"
  | "review_limited_shown"
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
  | "exercise_shown"
  | "production_submitted"
  | "checkpoint_passed"
  | "checkpoint_failed"
  | "review_started"
  | "review_completed"
  | "admin_bypass_used"
  | "language_selected"
  | "subscribe_link_opened"
  | "audio_transcribed"
  | "audio_transcription_failed"
  | "audio_received"
  | "audio_preference_changed";

type SubscriptionPlan = "mensual" | "trimestral" | "semestral";

interface AccessStatus {
  isAdmin: boolean;
  isSubscribed: boolean;
  plan: SubscriptionPlan | null;
  trialActive: boolean;
  trialExpired: boolean;
}

// deno-lint-ignore no-explicit-any
type SupabaseClientType = ReturnType<typeof createClient<any>>;

// ============== CONSTANTS ==============

const TRIAL_DAYS = 7;
const TRIAL_LESSONS = 20;
const PASSING_SCORE = 0.7; // 70% para passar checkpoint
const FREE_REVIEW_LIMIT = 3; // 3 ejercicios de repaso gratis por día

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============== AUDIO ASSETS (PRE-RECORDED) ==============

const AUDIO_ASSETS = {
  // Legacy keys (kept for compatibility)
  AUDIO_COACH_YOUR_TURN: "coach/AUDIO_COACH_YOUR_TURN.ogg",
  AUDIO_COACH_REPEAT_AFTER_ME: "coach/AUDIO_COACH_REPEAT_AFTER_ME.ogg",
  AUDIO_COACH_GREAT_JOB: "coach/AUDIO_COACH_GREAT_JOB.ogg",
  AUDIO_COACH_TRY_AGAIN_SLOW: "coach/AUDIO_COACH_TRY_AGAIN_SLOW.ogg",
  AUDIO_PHRASE_NICE_TO_MEET_YOU: "phrases/AUDIO_PHRASE_NICE_TO_MEET_YOU.ogg",
  AUDIO_PHRASE_HOW_ARE_YOU: "phrases/AUDIO_PHRASE_HOW_ARE_YOU.ogg",
  AUDIO_PHRASE_IM_FINE: "phrases/AUDIO_PHRASE_IM_FINE.ogg",
  AUDIO_PHRASE_HELLO: "phrases/AUDIO_PHRASE_HELLO.ogg",
  // New structured assets (v2)
  COACH_WELCOME_01: "coach/welcome_01.ogg",
  COACH_YOUR_TURN_01: "coach/your_turn_01.ogg",
  COACH_REPEAT_AFTER_ME_01: "coach/repeat_after_me_01.ogg",
  COACH_GREAT_JOB_01: "coach/great_job_01.ogg",
  COACH_TRANSLATION_HINT_01: "coach/translation_hint_01.ogg",
  COACH_TRY_AGAIN_01: "coach/try_again_01.ogg",
  COACH_CORRECTION_01: "coach/correction_01.ogg",
  COACH_AUDIO_NOT_CLEAR_01: "coach/audio_not_clear_01.ogg",
  PHRASE_HELLO_01: "phrases/hello_01.ogg",
  PHRASE_MY_NAME_IS_01: "phrases/my_name_is_01.ogg",
  PHRASE_IM_FROM_01: "phrases/im_from_01.ogg",
  PHRASE_IM_A_01: "phrases/im_a_01.ogg",
  PHRASE_NICE_TO_MEET_YOU_01: "phrases/nice_to_meet_you_01.ogg",
  PHRASE_WHATS_YOUR_NAME_01: "phrases/whats_your_name_01.ogg",
} as const;

type AudioAssetKey = keyof typeof AUDIO_ASSETS;

const AUDIO_BUCKET = "speak-easily-audio";

// TTS flag — disabled by default, enable via env
const ENABLE_TTS = Deno.env.get("ENABLE_TTS") === "true";

// TODO: Integrate TTS provider (e.g. ElevenLabs) when ENABLE_TTS is true
async function ttsToAudioUrl(_text: string): Promise<string> {
  if (!ENABLE_TTS) {
    throw new Error("TTS disabled — set ENABLE_TTS=true to enable");
  }
  // TODO: Implement TTS integration here
  throw new Error("TTS not implemented yet");
}

// ============== WEBHOOK SIGNATURE VERIFICATION ==============

/**
 * Verifies the X-Hub-Signature-256 header from Meta webhooks.
 * Uses HMAC SHA-256 with APP_SECRET to validate payload integrity.
 * @param request The incoming request (to read header)
 * @param rawBody The raw body string
 * @returns true if signature is valid, false otherwise
 */
async function verifyMetaSignature(request: Request, rawBody: string): Promise<boolean> {
  const signature = request.headers.get("x-hub-signature-256");
  if (!signature) {
    console.log("[SIGNATURE] Missing x-hub-signature-256 header");
    return false;
  }

  const appSecret = Deno.env.get("APP_SECRET");
  if (!appSecret) {
    console.error("[SIGNATURE] APP_SECRET not configured");
    return false;
  }

  // Expected format: "sha256=HEX"
  if (!signature.startsWith("sha256=")) {
    console.log("[SIGNATURE] Invalid signature format, expected 'sha256=...'");
    return false;
  }

  const expectedHex = signature.slice(7); // Remove "sha256=" prefix

  try {
    // Create HMAC SHA-256 key from APP_SECRET
    const encoder = new TextEncoder();
    const keyData = encoder.encode(appSecret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    // Calculate HMAC of raw body
    const bodyData = encoder.encode(rawBody);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, bodyData);

    // Convert to hex
    const signatureArray = new Uint8Array(signatureBuffer);
    const calculatedHex = Array.from(signatureArray)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Timing-safe comparison (constant time)
    if (calculatedHex.length !== expectedHex.length) {
      console.log("[SIGNATURE] Length mismatch");
      return false;
    }

    let result = 0;
    for (let i = 0; i < calculatedHex.length; i++) {
      result |= calculatedHex.charCodeAt(i) ^ expectedHex.toLowerCase().charCodeAt(i);
    }

    const isValid = result === 0;
    console.log(`[SIGNATURE] Verification ${isValid ? "SUCCESS" : "FAILED"}`);
    return isValid;
  } catch (err) {
    console.error("[SIGNATURE] Verification error:", err);
    return false;
  }
}

// ============== I18N DICTIONARY ==============

const I18N: Record<string, Record<Language, string>> = {
  // Language picker
  language_picker: {
    pt: "🌍 Escolha seu idioma para começar:\n\n1️⃣ 🇧🇷 Português\n2️⃣ 🇪🇸 Español\n3️⃣ 🇺🇸 English\n\nResponda com 1, 2 ou 3.",
    es: "🌍 Elige tu idioma para empezar:\n\n1️⃣ 🇧🇷 Português\n2️⃣ 🇪🇸 Español\n3️⃣ 🇺🇸 English\n\nResponde con 1, 2 o 3.",
    en: "🌍 Choose your language to start:\n\n1️⃣ 🇧🇷 Português\n2️⃣ 🇪🇸 Español\n3️⃣ 🇺🇸 English\n\nReply with 1, 2, or 3.",
  },
  language_confirm_pt: {
    pt: "✅ Idioma definido para Português 🇧🇷",
    es: "✅ Idioma definido para Português 🇧🇷",
    en: "✅ Language set to Português 🇧🇷",
  },
  language_confirm_es: {
    pt: "✅ Idioma configurado a Español 🇪🇸",
    es: "✅ Idioma configurado a Español 🇪🇸",
    en: "✅ Language set to Español 🇪🇸",
  },
  language_confirm_en: {
    pt: "✅ Language set to English 🇺🇸",
    es: "✅ Language set to English 🇺🇸",
    en: "✅ Language set to English 🇺🇸",
  },
  invalid_language: {
    pt: "Por favor, responda com 1, 2 ou 3 para escolher seu idioma.",
    es: "Por favor, responde con 1, 2 o 3 para elegir tu idioma.",
    en: "Please reply with 1, 2, or 3 to choose your language.",
  },
  // Welcome
  welcome: {
    pt: "🎓 *Olá, {name}!*\n\nSou seu coach de inglês por WhatsApp. 💬\n\nPrimeiro, faremos um *Teste de Nível* rápido (2-4 min) para conhecer seu nível.\n\nPronto? Escreva *OK* para começar 🚀",
    es: "🎓 *¡Hola, {name}!*\n\nSoy tu coach de inglés por WhatsApp. 💬\n\nPrimero, haremos un *Placement Test* rápido (2-4 min) para conocer tu nivel.\n\n¿Listo? Escribe *OK* para empezar 🚀",
    en: "🎓 *Hello, {name}!*\n\nI'm your English coach on WhatsApp. 💬\n\nFirst, we'll do a quick *Placement Test* (2-4 min) to know your level.\n\nReady? Type *OK* to start 🚀",
  },
  // Placement test
  placement_intro: {
    pt: "🎓 *Teste de Nível*\n\nVamos descobrir seu nível! São 3 partes curtas:\n\n📝 Parte 1: 3 perguntas rápidas\n✍️ Parte 2: Escreva sobre você\n🎤 Parte 3: Áudio opcional\n\n_Leva só 2-4 minutos!_ ⏱️\n\n💡 Você pode responder por *texto* ou *áudio* a qualquer momento!",
    es: "🎓 *Placement Test*\n\n¡Vamos a descubrir tu nivel! Son 3 partes cortas:\n\n📝 Parte 1: 3 preguntas rápidas\n✍️ Parte 2: Escribe sobre ti\n🎤 Parte 3: Audio opcional\n\n_¡Tarda solo 2-4 minutos!_ ⏱️\n\n💡 ¡Puedes responder por *texto* o *audio* en cualquier momento!",
    en: "🎓 *Placement Test*\n\nLet's discover your level! It's 3 short parts:\n\n📝 Part 1: 3 quick questions\n✍️ Part 2: Write about yourself\n🎤 Part 3: Optional audio\n\n_Only takes 2-4 minutes!_ ⏱️\n\n💡 You can answer by *text* or *audio* anytime!",
  },
  answer_abcd: {
    pt: "Responda com *A*, *B*, *C* ou *D* 📝\n\n💡 Você também pode responder por áudio!",
    es: "Responde con *A*, *B*, *C* o *D* 📝\n\n💡 ¡También puedes responder por audio!",
    en: "Reply with *A*, *B*, *C*, or *D* 📝\n\n💡 You can also answer by audio!",
  },
  part1_complete: {
    pt: "✅ *Parte 1 completada!*\n\n📝 *Parte 2/3 — Produção escrita*\n\nEscreva 2 frases em inglês:\n1. Quem você é e o que faz\n2. Por que quer aprender inglês\n\n_Exemplo: \"I'm Ana, I work as a nurse. I want to learn English because...\"_\n\n💡 Pode responder por texto ou áudio!",
    es: "✅ *Parte 1 completada!*\n\n📝 *Parte 2/3 — Producción escrita*\n\nEscribe 2 frases en inglés:\n1. Quién eres y a qué te dedicas\n2. Por qué quieres aprender inglés\n\n_Ejemplo: \"I'm Ana, I work as a nurse. I want to learn English because...\"_\n\n💡 ¡Puedes responder por texto o audio!",
    en: "✅ *Part 1 complete!*\n\n📝 *Part 2/3 — Written production*\n\nWrite 2 sentences in English:\n1. Who you are and what you do\n2. Why you want to learn English\n\n_Example: \"I'm Ana, I work as a nurse. I want to learn English because...\"_\n\n💡 You can answer by text or audio!",
  },
  part3_audio: {
    pt: "🎤 *Parte 3/3 — Áudio (opcional)*\n\nGrave um áudio de 10-15 segundos dizendo:\n\n_\"Hi, I'm [nome]. I'm from [país]. I want to learn English because [motivo].\"_\n\n📨 Envie o áudio ou escreva *SKIP* para pular.",
    es: "🎤 *Parte 3/3 — Audio (opcional)*\n\nGraba un audio de 10-15 segundos diciendo:\n\n_\"Hi, I'm [nombre]. I'm from [país]. I want to learn English because [motivo].\"_\n\n📨 Envía el audio o escribe *SKIP* para saltar.",
    en: "🎤 *Part 3/3 — Audio (optional)*\n\nRecord a 10-15 second audio saying:\n\n_\"Hi, I'm [name]. I'm from [country]. I want to learn English because [reason].\"_\n\n📨 Send the audio or type *SKIP* to skip.",
  },
  audio_received: {
    pt: "🎤 Áudio recebido! Obrigado pelo esforço extra. 🌟",
    es: "🎤 ¡Audio recibido! Gracias por el esfuerzo extra. 🌟",
    en: "🎤 Audio received! Thanks for the extra effort. 🌟",
  },
  skip_audio: {
    pt: "👍 Sem problema, continuamos.",
    es: "👍 Sin problema, continuamos.",
    en: "👍 No problem, let's continue.",
  },
  send_audio_or_skip: {
    pt: "🎤 Envie um áudio ou escreva *SKIP* para pular.",
    es: "🎤 Envía un audio o escribe *SKIP* para saltar.",
    en: "🎤 Send an audio or type *SKIP* to skip.",
  },
  // Goal selection
  select_goal: {
    pt: "🎯 *Qual é seu objetivo principal?*\n\n🏢 *TRABALHO* — Inglês profissional\n✈️ *VIAGEM* — Inglês para viagens\n💬 *CONVERSAÇÃO* — Falar com nativos\n📚 *GERAL* — Um pouco de tudo\n\n_Escreva sua escolha_",
    es: "🎯 *¿Cuál es tu objetivo principal?*\n\n🏢 *TRABAJO* — Inglés profesional\n✈️ *VIAJE* — Inglés para viajes\n💬 *CONVERSACIÓN* — Hablar con nativos\n📚 *GENERAL* — Un poco de todo\n\n_Escribe tu elección_",
    en: "🎯 *What's your main goal?*\n\n🏢 *WORK* — Professional English\n✈️ *TRAVEL* — English for travel\n💬 *CONVERSATION* — Talk with natives\n📚 *GENERAL* — A bit of everything\n\n_Type your choice_",
  },
  goal_confirmed: {
    pt: "✅ *Objetivo: {goal}*\n\nPerfeito! Vamos começar. 🚀",
    es: "✅ *Objetivo: {goal}*\n\n¡Perfecto! Vamos a empezar. 🚀",
    en: "✅ *Goal: {goal}*\n\nPerfect! Let's begin. 🚀",
  },
  type_next: {
    pt: "Escreva *NEXT* para começar o Plano de 7 dias 🚀",
    es: "Escribe *NEXT* para empezar el Plan de 7 días 🚀",
    en: "Type *NEXT* to start the 7-day Plan 🚀",
  },
  // Day lessons
  day_header: {
    pt: "📖 *Dia {day}/7 — {title}*\n\n🎯 *Objetivos:*\n{objectives}\n\n⏱️ ~5-8 min | ⏳ {lessons_left} lições restantes\n\n💡 Você pode responder por *texto* ou *áudio*!",
    es: "📖 *Día {day}/7 — {title}*\n\n🎯 *Objetivos:*\n{objectives}\n\n⏱️ ~5-8 min | ⏳ {lessons_left} lecciones restantes\n\n💡 ¡Puedes responder por *texto* o *audio*!",
    en: "📖 *Day {day}/7 — {title}*\n\n🎯 *Objectives:*\n{objectives}\n\n⏱️ ~5-8 min | ⏳ {lessons_left} lessons left\n\n💡 You can answer by *text* or *audio*!",
  },
  exercise_header: {
    pt: "{emoji} *Exercício {current}/{total}*\n\n{prompt}",
    es: "{emoji} *Ejercicio {current}/{total}*\n\n{prompt}",
    en: "{emoji} *Exercise {current}/{total}*\n\n{prompt}",
  },
  correct: {
    pt: "✅ Muito bem! 🌟",
    es: "✅ ¡Muy bien! 🌟",
    en: "✅ Well done! 🌟",
  },
  correct_exact: {
    pt: "✅ Correto! 🎯",
    es: "✅ ¡Correcto! 🎯",
    en: "✅ Correct! 🎯",
  },
  wrong_answer: {
    pt: "❌ A resposta correta era *{answer}*. {hint}",
    es: "❌ La respuesta correcta era *{answer}*. {hint}",
    en: "❌ The correct answer was *{answer}*. {hint}",
  },
  expected_answer: {
    pt: "❌ Esperávamos algo como: *{answer}*\n💡 {hint}",
    es: "❌ Esperábamos algo como: *{answer}*\n💡 {hint}",
    en: "❌ We expected something like: *{answer}*\n💡 {hint}",
  },
  // Day complete
  day_complete: {
    pt: "🎉 *Dia {day} completado!*\n\n✅ Checkpoint: *APROVADO*\n📊 Acertos: {score}/{attempts} ({percent}%)\n\nEscreva *NEXT* para o Dia {next_day} 🚀",
    es: "🎉 *¡Día {day} completado!*\n\n✅ Checkpoint: *APROBADO*\n📊 Aciertos: {score}/{attempts} ({percent}%)\n\nEscribe *NEXT* para el Día {next_day} 🚀",
    en: "🎉 *Day {day} complete!*\n\n✅ Checkpoint: *PASSED*\n📊 Correct: {score}/{attempts} ({percent}%)\n\nType *NEXT* for Day {next_day} 🚀",
  },
  day_failed: {
    pt: "📝 *Dia {day} — Precisa mais prática*\n\n📊 Acertos: {score}/{attempts} ({percent}%)\n🎯 Necessário: {passing}%\n\nEscreva *REVIEW* para revisar seus erros 📚\nOu *NEXT* para tentar novamente.",
    es: "📝 *Día {day} — Necesitas más práctica*\n\n📊 Aciertos: {score}/{attempts} ({percent}%)\n🎯 Necesitas: {passing}%\n\nEscribe *REVIEW* para repasar tus errores 📚\nO *NEXT* para reintentar el día.",
    en: "📝 *Day {day} — Needs more practice*\n\n📊 Correct: {score}/{attempts} ({percent}%)\n🎯 Required: {passing}%\n\nType *REVIEW* to review your mistakes 📚\nOr *NEXT* to retry the day.",
  },
  plan_complete: {
    pt: "🎉🏆 *PARABÉNS!* 🏆🎉\n\nVocê completou o *Plano de 7 dias*.\n\n📊 *Seu resumo:*\n• Lições: {lessons}\n• Exercícios: {exercises}\n• Nível: {level}\n\nPara continuar aprendendo com áudios, revisão inteligente e novos módulos, ative sua assinatura:\n\n🔗 {link}\n\nEscreva *PROGRESO* para ver seu avanço completo.",
    es: "🎉🏆 *¡FELICIDADES!* 🏆🎉\n\nHas completado el *Plan de 7 días*.\n\n📊 *Tu resumen:*\n• Lecciones: {lessons}\n• Ejercicios: {exercises}\n• Nivel: {level}\n\nPara seguir aprendiendo con audios, revisión inteligente y nuevos módulos, activa tu suscripción:\n\n🔗 {link}\n\nEscribe *PROGRESO* para ver tu avance completo.",
    en: "🎉🏆 *CONGRATULATIONS!* 🏆🎉\n\nYou've completed the *7-day Plan*.\n\n📊 *Your summary:*\n• Lessons: {lessons}\n• Exercises: {exercises}\n• Level: {level}\n\nTo continue learning with audio, smart review and new modules, activate your subscription:\n\n🔗 {link}\n\nType *PROGRESS* to see your full progress.",
  },
  // Review
  review_intro: {
    pt: "📚 *Modo Revisão*\n\nVamos praticar {count} exercícios baseados nos seus erros mais frequentes.\n\n💡 Você pode responder por texto ou áudio!\n\nVamos! 💪",
    es: "📚 *Modo Repaso*\n\nVamos a practicar {count} ejercicios basados en tus errores más frecuentes.\n\n💡 ¡Puedes responder por texto o audio!\n\n¡Vamos! 💪",
    en: "📚 *Review Mode*\n\nLet's practice {count} exercises based on your most frequent mistakes.\n\n💡 You can answer by text or audio!\n\nLet's go! 💪",
  },
  review_header: {
    pt: "📝 *Revisão {current}/{total}*\n\n{prompt}",
    es: "📝 *Repaso {current}/{total}*\n\n{prompt}",
    en: "📝 *Review {current}/{total}*\n\n{prompt}",
  },
  review_complete: {
    pt: "✅ *Revisão completada!*\n\nEscreva *NEXT* para continuar com seu plano 🚀",
    es: "✅ *¡Repaso completado!*\n\nEscribe *NEXT* para continuar con tu plan 🚀",
    en: "✅ *Review complete!*\n\nType *NEXT* to continue with your plan 🚀",
  },
  no_mistakes: {
    pt: "✨ Você não tem erros registrados! Escreva *NEXT* para continuar.",
    es: "✨ ¡No tienes errores registrados! Escribe *NEXT* para continuar.",
    en: "✨ You don't have any recorded mistakes! Type *NEXT* to continue.",
  },
  no_review_exercises: {
    pt: "✨ Não há exercícios de revisão disponíveis! Escreva *NEXT* para continuar.",
    es: "✨ ¡No hay ejercicios de repaso disponibles! Escribe *NEXT* para continuar.",
    en: "✨ No review exercises available! Type *NEXT* to continue.",
  },
  // Paywall
  trial_ended: {
    pt: "✅ *Seu teste terminou*\n\nPara continuar com áudios + revisão inteligente + novos módulos, ative sua assinatura aqui:\n\n🔗 {link}\n\nVocê pode ver seu progresso com *PROGRESO*.",
    es: "✅ *Tu prueba terminó*\n\nPara seguir con audios + revisión inteligente + nuevos módulos, activa tu suscripción aquí:\n\n🔗 {link}\n\nPuedes ver tu progreso con *PROGRESO*.",
    en: "✅ *Your trial ended*\n\nTo continue with audio + smart review + new modules, activate your subscription here:\n\n🔗 {link}\n\nYou can view your progress with *PROGRESS*.",
  },
  subscription_expired: {
    pt: "⏳ *Sua assinatura expirou*\n\nRenove para continuar aprendendo:\n\n🔗 {link}\n\nVocê pode ver seu progresso com *PROGRESO*.",
    es: "⏳ *Tu suscripción ha expirado*\n\nRenueva para seguir aprendiendo:\n\n🔗 {link}\n\nPuedes ver tu progreso con *PROGRESO*.",
    en: "⏳ *Your subscription has expired*\n\nRenew to keep learning:\n\n🔗 {link}\n\nYou can view your progress with *PROGRESS*.",
  },
  review_limit: {
    pt: "🙌 *Você esgotou sua revisão grátis de hoje*\n\nAtive a assinatura para revisão ilimitada:\n🔗 {link}",
    es: "🙌 *Has agotado tu review gratis de hoy*\n\nActiva la suscripción para review ilimitado:\n🔗 {link}",
    en: "🙌 *You've used up your free review for today*\n\nActivate subscription for unlimited review:\n🔗 {link}",
  },
  // Progress
  progress_header: {
    pt: "📊 *Seu Progresso*\n\n🎯 Nível: {level}\n📖 Dia atual: {day}/7\n✅ Lições completadas: {lessons}\n{trial_message}\n\n{mistakes}🔗 *Ver detalhes:*\n{link}",
    es: "📊 *Tu Progreso*\n\n🎯 Nivel: {level}\n📖 Día actual: {day}/7\n✅ Lecciones completadas: {lessons}\n{trial_message}\n\n{mistakes}🔗 *Ver detalle:*\n{link}",
    en: "📊 *Your Progress*\n\n🎯 Level: {level}\n📖 Current day: {day}/7\n✅ Lessons completed: {lessons}\n{trial_message}\n\n{mistakes}🔗 *View details:*\n{link}",
  },
  subscription_active: {
    pt: "✨ *Assinatura ativa*",
    es: "✨ *Suscripción activa*",
    en: "✨ *Subscription active*",
  },
  trial_days_left: {
    pt: "⏳ *Teste:* {days} dias restantes",
    es: "⏳ *Prueba:* {days} días restantes",
    en: "⏳ *Trial:* {days} days left",
  },
  trial_expired_short: {
    pt: "❌ *Seu teste terminou*\n🔗 Ative sua assinatura: {link}",
    es: "❌ *Tu prueba terminó*\n🔗 Activa tu suscripción: {link}",
    en: "❌ *Your trial ended*\n🔗 Activate your subscription: {link}",
  },
  frequent_mistakes: {
    pt: "📝 *Erros frequentes:*\n{mistakes}\n\n",
    es: "📝 *Errores frecuentes:*\n{mistakes}\n\n",
    en: "📝 *Frequent mistakes:*\n{mistakes}\n\n",
  },
  not_started: {
    pt: "Você ainda não começou! Envie qualquer mensagem para iniciar. 🚀",
    es: "¡Aún no has empezado! Envía cualquier mensaje para comenzar. 🚀",
    en: "You haven't started yet! Send any message to begin. 🚀",
  },
  // Help
  help: {
    pt: "📚 *Comandos disponíveis:*\n\n• *NEXT* — Continuar com o plano\n• *PROGRESO* — Ver seu avanço e link\n• *REVIEW* — Revisar erros\n• *IDIOMA* — Mudar idioma\n• *AUDIO ON* — Ativar preferência de áudio\n• *AUDIO OFF* — Desativar preferência de áudio\n• *SUSCRIBIRME* — Ver planos\n• *RESTART* — Reiniciar (com confirmação)\n\n💬 Escreva o que precisar!\n\n🎤 *Dica:* Você pode responder por texto ou áudio a qualquer momento!",
    es: "📚 *Comandos disponibles:*\n\n• *NEXT* — Continuar con el plan\n• *PROGRESO* — Ver tu avance y link\n• *REVIEW* — Repasar errores\n• *IDIOMA* — Cambiar idioma\n• *AUDIO ON* — Activar preferencia de audio\n• *AUDIO OFF* — Desactivar preferencia de audio\n• *SUSCRIBIRME* — Ver planes\n• *RESTART* — Reiniciar (con confirmación)\n\n💬 ¡Escribe lo que necesites!\n\n🎤 *Tip:* ¡Puedes responder por texto o audio en cualquier momento!",
    en: "📚 *Available commands:*\n\n• *NEXT* — Continue with the plan\n• *PROGRESS* — View your progress and link\n• *REVIEW* — Review mistakes\n• *LANGUAGE* — Change language\n• *AUDIO ON* — Enable audio preference\n• *AUDIO OFF* — Disable audio preference\n• *SUBSCRIBE* — View plans\n• *RESTART* — Restart (with confirmation)\n\n💬 Type what you need!\n\n🎤 *Tip:* You can answer by text or audio anytime!",
  },
  // Restart
  restart_confirm: {
    pt: "⚠️ *Tem certeza que quer reiniciar?*\n\nIsso vai apagar seu progresso atual.\n\nEscreva *SIM* para confirmar ou *NÃO* para cancelar.",
    es: "⚠️ *¿Seguro que quieres reiniciar?*\n\nEsto borrará tu progreso actual.\n\nEscribe *SI* para confirmar o *NO* para cancelar.",
    en: "⚠️ *Are you sure you want to restart?*\n\nThis will erase your current progress.\n\nType *YES* to confirm or *NO* to cancel.",
  },
  restart_done: {
    pt: "🔄 Reiniciado! Envie qualquer mensagem para começar.",
    es: "🔄 ¡Reiniciado! Envía cualquier mensaje para empezar.",
    en: "🔄 Restarted! Send any message to begin.",
  },
  restart_cancelled: {
    pt: "👍 Cancelado. Escreva *NEXT* para continuar.",
    es: "👍 Cancelado. Escribe *NEXT* para continuar.",
    en: "👍 Cancelled. Type *NEXT* to continue.",
  },
  // Subscribe
  subscribe_info: {
    pt: "💳 *Planos de Assinatura*\n\nAcesse todos os benefícios:\n✅ Áudios e prática real\n✅ Correção imediata\n✅ Revisão inteligente ilimitada\n✅ Novos módulos toda semana\n\n🔗 Ver planos: {link}",
    es: "💳 *Planes de Suscripción*\n\nAccede a todos los beneficios:\n✅ Audios y práctica real\n✅ Corrección inmediata\n✅ Revisión inteligente ilimitada\n✅ Nuevos módulos cada semana\n\n🔗 Ver planes: {link}",
    en: "💳 *Subscription Plans*\n\nAccess all benefits:\n✅ Audio and real practice\n✅ Immediate feedback\n✅ Unlimited smart review\n✅ New modules every week\n\n🔗 View plans: {link}",
  },
  // Other
  lets_continue: {
    pt: "Vamos continuar! 🚀",
    es: "¡Vamos a continuar! 🚀",
    en: "Let's continue! 🚀",
  },
  type_next_or_review: {
    pt: "Escreva *NEXT* para continuar ou *REVIEW* para revisar. 📚",
    es: "Escribe *NEXT* para continuar o *REVIEW* para repasar. 📚",
    en: "Type *NEXT* to continue or *REVIEW* to review. 📚",
  },
  first_complete_placement: {
    pt: "Primeiro complete o teste de nível. Envie qualquer mensagem para começar.",
    es: "Primero completa el placement test. Envía cualquier mensaje para empezar.",
    en: "First complete the placement test. Send any message to start.",
  },
  plan_complete_notice: {
    pt: "🎉 Você completou o Plano de 7 dias! Escreva *REVIEW* para revisar.",
    es: "🎉 ¡Has completado el Plan de 7 días! Escribe *REVIEW* para repasar.",
    en: "🎉 You've completed the 7-day Plan! Type *REVIEW* to review.",
  },
  // Audio transcription
  audio_transcript_header: {
    pt: "📝 *Transcrição (o que eu entendi):* _{transcript}_",
    es: "📝 *Transcripción (lo que entendí):* _{transcript}_",
    en: "📝 *Transcript (what I heard):* _{transcript}_",
  },
  audio_pronunciation_tip: {
    pt: "🎧 *Pronúncia:* {tip}",
    es: "🎧 *Pronunciación:* {tip}",
    en: "🎧 *Pronunciation:* {tip}",
  },
  audio_repeat: {
    pt: "🔁 Tente novamente ou escreva sua resposta.",
    es: "🔁 Inténtalo de nuevo o escribe tu respuesta.",
    en: "🔁 Try again or type your answer.",
  },
  audio_next: {
    pt: "👏 Excelente! Continuando...",
    es: "👏 ¡Excelente! Continuando...",
    en: "👏 Excellent! Continuing...",
  },
  audio_transcription_failed: {
    pt: "🎤 Não consegui entender o áudio. Por favor, escreva sua resposta.",
    es: "🎤 No pude entender el audio. Por favor, escribe tu respuesta.",
    en: "🎤 Couldn't understand the audio. Please type your answer.",
  },
  audio_transcription_rate_limit: {
    pt: "🎤 Estou sobrecarregado agora. Tente novamente em 30 segundos ou escreva sua resposta.",
    es: "🎤 Estoy sobrecargado ahora. Inténtalo de nuevo en 30 segundos o escribe tu respuesta.",
    en: "🎤 I'm overloaded right now. Try again in 30 seconds or type your answer.",
  },
  audio_download_failed: {
    pt: "🎤 Erro ao processar o áudio. Por favor, escreva sua resposta.",
    es: "🎤 Error al procesar el audio. Por favor, escribe tu respuesta.",
    en: "🎤 Error processing audio. Please type your answer.",
  },
  // Conversational audio feedback - structured response
  audio_conv_transcript_pt: {
    pt: "🎧 *Transcrição (o que eu entendi):*\n\n\"{transcript}\"",
    es: "🎧 *Transcrição (o que eu entendi):*\n\n\"{transcript}\"",
    en: "🎧 *Transcrição (o que eu entendi):*\n\n\"{transcript}\"",
  },
  audio_conv_transcript_es: {
    pt: "🎧 *Transcripción (lo que entendí):*\n\n\"{transcript}\"",
    es: "🎧 *Transcripción (lo que entendí):*\n\n\"{transcript}\"",
    en: "🎧 *Transcripción (lo que entendí):*\n\n\"{transcript}\"",
  },
  audio_conv_feedback_pt: {
    pt: "✅ *Em inglês, uma forma correta seria:*\n\"{english_correct}\"\n\n💡 *Mais natural:*\n\"{english_natural}\"\n\n📝 *Ajustes:*\n{fixes}\n\n🔁 *Repete esta frase (curta = só 1 frase, 6-8 palavras):*\n\"{target_sentence}\"",
    es: "✅ *Em inglês, uma forma correta seria:*\n\"{english_correct}\"\n\n💡 *Mais natural:*\n\"{english_natural}\"\n\n📝 *Ajustes:*\n{fixes}\n\n🔁 *Repete esta frase (curta = só 1 frase, 6-8 palavras):*\n\"{target_sentence}\"",
    en: "✅ *Em inglês, uma forma correta seria:*\n\"{english_correct}\"\n\n💡 *Mais natural:*\n\"{english_natural}\"\n\n📝 *Ajustes:*\n{fixes}\n\n🔁 *Repete esta frase (curta = só 1 frase, 6-8 palavras):*\n\"{target_sentence}\"",
  },
  audio_conv_feedback_es: {
    pt: "✅ *En inglés, una forma correcta sería:*\n\"{english_correct}\"\n\n💡 *Más natural:*\n\"{english_natural}\"\n\n📝 *Ajustes:*\n{fixes}\n\n🔁 *Repite esta frase (corta = solo 1 frase, 6-8 palabras):*\n\"{target_sentence}\"",
    es: "✅ *En inglés, una forma correcta sería:*\n\"{english_correct}\"\n\n💡 *Más natural:*\n\"{english_natural}\"\n\n📝 *Ajustes:*\n{fixes}\n\n🔁 *Repite esta frase (corta = solo 1 frase, 6-8 palabras):*\n\"{target_sentence}\"",
    en: "✅ *En inglés, una forma correcta sería:*\n\"{english_correct}\"\n\n💡 *Más natural:*\n\"{english_natural}\"\n\n📝 *Ajustes:*\n{fixes}\n\n🔁 *Repite esta frase (corta = solo 1 frase, 6-8 palabras):*\n\"{target_sentence}\"",
  },
  // Audio practice success - when user correctly repeats the target sentence
  audio_practice_success_pt: {
    pt: "✅ *Perfeito!* Pronúncia ok. 👏\n\n🚀 Vamos continuar! Envie *NEXT* para avançar ou me mande outro áudio.",
    es: "✅ *Perfeito!* Pronúncia ok. 👏\n\n🚀 Vamos continuar! Envie *NEXT* para avançar ou me mande outro áudio.",
    en: "✅ *Perfeito!* Pronúncia ok. 👏\n\n🚀 Vamos continuar! Envie *NEXT* para avançar ou me mande outro áudio.",
  },
  audio_practice_success_es: {
    pt: "✅ *¡Perfecto!* Pronunciación ok. 👏\n\n🚀 ¡Vamos a continuar! Envía *NEXT* para avanzar o mándame otro audio.",
    es: "✅ *¡Perfecto!* Pronunciación ok. 👏\n\n🚀 ¡Vamos a continuar! Envía *NEXT* para avanzar o mándame otro audio.",
    en: "✅ *¡Perfecto!* Pronunciación ok. 👏\n\n🚀 ¡Vamos a continuar! Envía *NEXT* para avanzar o mándame otro audio.",
  },
  // Audio heard - simplified versions without redundant info
  audio_i_heard_pt: {
    pt: "🎧 *Eu ouvi:*\n\"{transcript}\"",
    es: "🎧 *Eu ouvi:*\n\"{transcript}\"",
    en: "🎧 *Eu ouvi:*\n\"{transcript}\"",
  },
  audio_i_heard_es: {
    pt: "🎧 *Escuché:*\n\"{transcript}\"",
    es: "🎧 *Escuché:*\n\"{transcript}\"",
    en: "🎧 *Escuché:*\n\"{transcript}\"",
  },
  audio_conv_not_understood_pt: {
    pt: "⚠️ Não consegui entender o áudio (muito baixo ou com ruído). Pode gravar de novo bem perto do microfone?",
    es: "⚠️ Não consegui entender o áudio (muito baixo ou com ruído). Pode gravar de novo bem perto do microfone?",
    en: "⚠️ Não consegui entender o áudio (muito baixo ou com ruído). Pode gravar de novo bem perto do microfone?",
  },
  audio_conv_not_understood_es: {
    pt: "⚠️ No pude entender el audio (muy bajo o con ruido). ¿Puedes grabarlo de nuevo más cerca del micrófono?",
    es: "⚠️ No pude entender el audio (muy bajo o con ruido). ¿Puedes grabarlo de nuevo más cerca del micrófono?",
    en: "⚠️ No pude entender el audio (muy bajo o con ruido). ¿Puedes grabarlo de nuevo más cerca del micrófono?",
  },
  // Post placement test prompt - gaming context
  post_placement_audio_prompt_pt: {
    pt: "Para começar, me manda um áudio dizendo (em português):\n\n_\"Meu nome é ___ e eu quero aprender inglês para jogar LoL.\"_",
    es: "Para começar, me manda um áudio dizendo (em português):\n\n_\"Meu nome é ___ e eu quero aprender inglês para jogar LoL.\"_",
    en: "Para começar, me manda um áudio dizendo (em português):\n\n_\"Meu nome é ___ e eu quero aprender inglês para jogar LoL.\"_",
  },
  post_placement_audio_prompt_es: {
    pt: "Para empezar, envíame un audio diciendo (en español):\n\n_\"Me llamo ___ y quiero aprender inglés para jugar LoL.\"_",
    es: "Para empezar, envíame un audio diciendo (en español):\n\n_\"Me llamo ___ y quiero aprender inglés para jugar LoL.\"_",
    en: "Para empezar, envíame un audio diciendo (en español):\n\n_\"Me llamo ___ y quiero aprender inglés para jugar LoL.\"_",
  },
  // Audio preference commands
  audio_on_confirmed: {
    pt: "🎤 *Preferência de áudio ativada!*\n\nAgora você pode responder todos os exercícios por áudio. Sua pronúncia será avaliada!",
    es: "🎤 *¡Preferencia de audio activada!*\n\n¡Ahora puedes responder todos los ejercicios por audio. Tu pronunciación será evaluada!",
    en: "🎤 *Audio preference enabled!*\n\nNow you can answer all exercises by audio. Your pronunciation will be evaluated!",
  },
  audio_off_confirmed: {
    pt: "📝 *Preferência de áudio desativada.*\n\nVocê pode continuar respondendo por texto. Lembre-se que ainda pode enviar áudios quando quiser!",
    es: "📝 *Preferencia de audio desactivada.*\n\nPuedes continuar respondiendo por texto. ¡Recuerda que aún puedes enviar audios cuando quieras!",
    en: "📝 *Audio preference disabled.*\n\nYou can continue answering by text. Remember you can still send audio anytime!",
  },
  // Admin commands
  admin_status: {
    pt: "🔧 *Status Admin*\n\n✅ Modo Admin: ATIVO\n📱 wa_id: {wa_id_masked}\n📍 Step atual: {step}\n📊 Progresso: Dia {day}, Exercício {exercise}/{total_exercises}\n💳 Subscrição: {subscription} ({plan})\n⏰ Trial: {trial_status}\n\n*Últimos eventos ({event_count}):*\n{events}\n\n*Comandos disponíveis:*\n• /admin reset - Reiniciar para welcome\n• /admin step [nome] - Ir para step específico",
    es: "🔧 *Status Admin*\n\n✅ Modo Admin: ACTIVO\n📱 wa_id: {wa_id_masked}\n📍 Step actual: {step}\n📊 Progreso: Día {day}, Ejercicio {exercise}/{total_exercises}\n💳 Suscripción: {subscription} ({plan})\n⏰ Trial: {trial_status}\n\n*Últimos eventos ({event_count}):*\n{events}\n\n*Comandos disponibles:*\n• /admin reset - Reiniciar a welcome\n• /admin step [nombre] - Ir a step específico",
    en: "🔧 *Admin Status*\n\n✅ Admin Mode: ACTIVE\n📱 wa_id: {wa_id_masked}\n📍 Current Step: {step}\n📊 Progress: Day {day}, Exercise {exercise}/{total_exercises}\n💳 Subscription: {subscription} ({plan})\n⏰ Trial: {trial_status}\n\n*Recent events ({event_count}):*\n{events}\n\n*Available commands:*\n• /admin reset - Reset to welcome\n• /admin step [name] - Jump to specific step",
  },
  admin_not_active: {
    pt: "❌ Modo admin não está ativo para este número.",
    es: "❌ Modo admin no está activo para este número.",
    en: "❌ Admin mode is not active for this number.",
  },
  admin_reset_done: {
    pt: "🔄 *Reset admin completo!*\n\nStep: welcome\nDados: limpos\n\nEnvie qualquer mensagem para começar.",
    es: "🔄 *¡Reset admin completo!*\n\nStep: welcome\nDatos: limpios\n\nEnvía cualquier mensaje para empezar.",
    en: "🔄 *Admin reset complete!*\n\nStep: welcome\nData: cleared\n\nSend any message to start.",
  },
  admin_step_changed: {
    pt: "✅ *Step alterado para:* {step}\n\nDados mantidos. Envie qualquer mensagem para continuar.",
    es: "✅ *Step cambiado a:* {step}\n\nDatos mantenidos. Envía cualquier mensaje para continuar.",
    en: "✅ *Step changed to:* {step}\n\nData preserved. Send any message to continue.",
  },
  admin_step_invalid: {
    pt: "❌ Step inválido: {step}\n\n*Steps válidos:*\n{valid_steps}",
    es: "❌ Step inválido: {step}\n\n*Steps válidos:*\n{valid_steps}",
    en: "❌ Invalid step: {step}\n\n*Valid steps:*\n{valid_steps}",
  },
  admin_help: {
    pt: "🔧 *Comandos Admin*\n\n• /admin ou /admin status - Ver diagnóstico\n• /admin reset - Reiniciar para welcome\n• /admin step [nome] - Ir para step\n\n*Steps válidos:*\n{valid_steps}",
    es: "🔧 *Comandos Admin*\n\n• /admin o /admin status - Ver diagnóstico\n• /admin reset - Reiniciar a welcome\n• /admin step [nombre] - Ir a step\n\n*Steps válidos:*\n{valid_steps}",
    en: "🔧 *Admin Commands*\n\n• /admin or /admin status - View diagnostics\n• /admin reset - Reset to welcome\n• /admin step [name] - Jump to step\n\n*Valid steps:*\n{valid_steps}",
  },
  admin_audio_debug: {
    pt: "\n\n🔍 *Debug Audio (Admin):*\n• request_id: {request_id}\n• step: {step}\n• transcript_completo: {transcript}",
    es: "\n\n🔍 *Debug Audio (Admin):*\n• request_id: {request_id}\n• step: {step}\n• transcripción_completa: {transcript}",
    en: "\n\n🔍 *Audio Debug (Admin):*\n• request_id: {request_id}\n• step: {step}\n• full_transcript: {transcript}",
  },
  // Audio beta errors - honest messages
  audio_beta_unavailable_pt: {
    pt: "⚠️ O modo de áudio está em beta e temporariamente indisponível.\nPor favor, envie a mesma frase por *texto*.",
    es: "⚠️ O modo de áudio está em beta e temporariamente indisponível.\nPor favor, envie a mesma frase por *texto*.",
    en: "⚠️ O modo de áudio está em beta e temporariamente indisponível.\nPor favor, envie a mesma frase por *texto*.",
  },
  audio_beta_unavailable_es: {
    pt: "⚠️ El modo de audio está en beta y temporalmente no disponible.\nPor favor, envía la misma frase por *texto*.",
    es: "⚠️ El modo de audio está en beta y temporalmente no disponible.\nPor favor, envía la misma frase por *texto*.",
    en: "⚠️ El modo de audio está en beta y temporalmente no disponible.\nPor favor, envía la misma frase por *texto*.",
  },
  audio_beta_limit_reached_pt: {
    pt: "⚠️ Limite do modo beta de áudio atingido por hoje.\nPor favor, envie sua resposta por *texto*.",
    es: "⚠️ Limite do modo beta de áudio atingido por hoje.\nPor favor, envie sua resposta por *texto*.",
    en: "⚠️ Limite do modo beta de áudio atingido por hoje.\nPor favor, envie sua resposta por *texto*.",
  },
  audio_beta_limit_reached_es: {
    pt: "⚠️ Límite del modo beta de audio alcanzado hoy.\nPor favor, envía tu respuesta por *texto*.",
    es: "⚠️ Límite del modo beta de audio alcanzado hoy.\nPor favor, envía tu respuesta por *texto*.",
    en: "⚠️ Límite del modo beta de audio alcanzado hoy.\nPor favor, envía tu respuesta por *texto*.",
  },
  // Audio transcription prefix - "I heard"
  audio_i_heard_pt: {
    pt: "🎧 *Eu ouvi:*\n\n\"{transcript}\"",
    es: "🎧 *Eu ouvi:*\n\n\"{transcript}\"",
    en: "🎧 *Eu ouvi:*\n\n\"{transcript}\"",
  },
  audio_i_heard_es: {
    pt: "🎧 *Escuché:*\n\n\"{transcript}\"",
    es: "🎧 *Escuché:*\n\n\"{transcript}\"",
    en: "🎧 *Escuché:*\n\n\"{transcript}\"",
  },
};

// Helper to get translated text
function t(lang: Language | null, key: string, vars: Record<string, string> = {}): string {
  const language = lang || "es"; // Default to Spanish
  const template = I18N[key]?.[language] || I18N[key]?.["es"] || key;
  return template.replace(/\{(\w+)\}/g, (_, varName) => vars[varName] || `{${varName}}`);
}

// ============== PLACEMENT TEST (MVP1) ==============

interface PlacementQuestion {
  id: string;
  part: 1;
  category: "verb_tense" | "preposition_collocation" | "sentence_structure";
  question: Record<Language, string>;
  options: string[];
  correct: string;
  feedback_correct: Record<Language, string>;
  feedback_wrong: Record<Language, string>;
}

const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: "q1_verb",
    part: 1,
    category: "verb_tense",
    question: {
      pt: "📝 *Parte 1/3 — Diagnóstico*\n\n*Q1.* Leia o contexto e escolha:\n\n_\"Yesterday, I ___ to the gym after work. It was a great session!\"_\n\nA) go\nB) went\nC) have gone\nD) was going",
      es: "📝 *Parte 1/3 — Diagnóstico*\n\n*Q1.* Lee el contexto y elige:\n\n_\"Yesterday, I ___ to the gym after work. It was a great session!\"_\n\nA) go\nB) went\nC) have gone\nD) was going",
      en: "📝 *Part 1/3 — Diagnosis*\n\n*Q1.* Read the context and choose:\n\n_\"Yesterday, I ___ to the gym after work. It was a great session!\"_\n\nA) go\nB) went\nC) have gone\nD) was going",
    },
    options: ["A", "B", "C", "D"],
    correct: "B",
    feedback_correct: {
      pt: "✅ Correto! *Went* é o passado simples de 'go'. Usamos o passado simples para ações completadas em um momento específico ('yesterday').",
      es: "✅ ¡Correcto! *Went* es el pasado simple de 'go'. Usamos pasado simple para acciones completadas en un momento específico ('yesterday').",
      en: "✅ Correct! *Went* is the simple past of 'go'. We use simple past for completed actions at a specific time ('yesterday').",
    },
    feedback_wrong: {
      pt: "❌ A resposta correta é *B) went*. Com 'yesterday', usamos o passado simples porque é uma ação completada em um momento específico do passado.",
      es: "❌ La respuesta correcta es *B) went*. Con 'yesterday', usamos el pasado simple porque es una acción completada en un momento específico del pasado.",
      en: "❌ The correct answer is *B) went*. With 'yesterday', we use simple past because it's a completed action at a specific past time.",
    }
  },
  {
    id: "q2_prep",
    part: 1,
    category: "preposition_collocation",
    question: {
      pt: "*Q2.* Escolha a opção correta:\n\n_\"She's very good ___ solving problems under pressure.\"_\n\nA) in\nB) for\nC) at\nD) with",
      es: "*Q2.* Elige la opción correcta:\n\n_\"She's very good ___ solving problems under pressure.\"_\n\nA) in\nB) for\nC) at\nD) with",
      en: "*Q2.* Choose the correct option:\n\n_\"She's very good ___ solving problems under pressure.\"_\n\nA) in\nB) for\nC) at\nD) with",
    },
    options: ["A", "B", "C", "D"],
    correct: "C",
    feedback_correct: {
      pt: "✅ Exato! *Good at* é a colocação correta para expressar habilidade em algo.",
      es: "✅ ¡Exacto! *Good at* es la colocación correcta para expresar habilidad en algo.",
      en: "✅ Exactly! *Good at* is the correct collocation to express skill at something.",
    },
    feedback_wrong: {
      pt: "❌ A resposta correta é *C) at*. Em inglês dizemos 'good at + gerúndio' para falar de habilidades.",
      es: "❌ La respuesta correcta es *C) at*. En inglés decimos 'good at + gerund' para hablar de habilidades.",
      en: "❌ The correct answer is *C) at*. In English we say 'good at + gerund' to talk about skills.",
    }
  },
  {
    id: "q3_structure",
    part: 1,
    category: "sentence_structure",
    question: {
      pt: "*Q3.* Qual frase está correta?\n\nA) He doesn't never arrive on time.\nB) He never doesn't arrive on time.\nC) He never arrives on time.\nD) Never he arrives on time.",
      es: "*Q3.* ¿Cuál frase está correcta?\n\nA) He doesn't never arrive on time.\nB) He never doesn't arrive on time.\nC) He never arrives on time.\nD) Never he arrives on time.",
      en: "*Q3.* Which sentence is correct?\n\nA) He doesn't never arrive on time.\nB) He never doesn't arrive on time.\nC) He never arrives on time.\nD) Never he arrives on time.",
    },
    options: ["A", "B", "C", "D"],
    correct: "C",
    feedback_correct: {
      pt: "✅ Perfeito! Os advérbios de frequência vão antes do verbo principal. E não usamos dupla negação em inglês.",
      es: "✅ ¡Perfecto! Los adverbios de frecuencia van antes del verbo principal. Y no usamos doble negación en inglés.",
      en: "✅ Perfect! Frequency adverbs go before the main verb. And we don't use double negation in English.",
    },
    feedback_wrong: {
      pt: "❌ A resposta correta é *C*. 'Never' vai antes do verbo principal, e em inglês não usamos dupla negação (doesn't + never = ❌).",
      es: "❌ La respuesta correcta es *C*. 'Never' va antes del verbo principal, y en inglés no usamos doble negación (doesn't + never = ❌).",
      en: "❌ The correct answer is *C*. 'Never' goes before the main verb, and in English we don't use double negation (doesn't + never = ❌).",
    }
  }
];

const LEVEL_MAPPING: Record<number, "A1" | "A2" | "B1" | "B2" | "C1"> = {
  0: "A1",
  1: "A1",
  2: "A2",
  3: "B1",
  4: "B1",
  5: "B2",
  6: "C1"
};

const LEVEL_TO_INTERNAL: Record<"A1" | "A2" | "B1" | "B2" | "C1", EnglishLevel> = {
  "A1": "beginner",
  "A2": "elementary",
  "B1": "pre_intermediate",
  "B2": "intermediate",
  "C1": "upper_intermediate"
};

function getStartingDayForLevel(level: EnglishLevel): number {
  switch (level) {
    case "beginner": return 1;
    case "elementary": return 1;
    case "pre_intermediate": return 3;
    case "intermediate": return 5;
    case "upper_intermediate": return 6;
    case "advanced": return 7;
    default: return 1;
  }
}

const LEVEL_NAMES: Record<EnglishLevel, Record<Language, string>> = {
  beginner: { pt: "Iniciante (A1) 🌱", es: "Principiante (A1) 🌱", en: "Beginner (A1) 🌱" },
  elementary: { pt: "Elementar (A2) 📗", es: "Elemental (A2) 📗", en: "Elementary (A2) 📗" },
  pre_intermediate: { pt: "Pré-Intermediário (B1) 📘", es: "Pre-Intermedio (B1) 📘", en: "Pre-Intermediate (B1) 📘" },
  intermediate: { pt: "Intermediário (B2) 📙", es: "Intermedio (B2) 📙", en: "Intermediate (B2) 📙" },
  upper_intermediate: { pt: "Intermediário-Alto (C1) 📕", es: "Intermedio-Alto (C1) 📕", en: "Upper-Intermediate (C1) 📕" },
  advanced: { pt: "Avançado (C2) 🎓", es: "Avanzado (C2) 🎓", en: "Advanced (C2) 🎓" },
};

const GOAL_NAMES: Record<LearningGoal, Record<Language, string>> = {
  work: { pt: "🏢 Inglês Profissional", es: "🏢 Inglés Profesional", en: "🏢 Professional English" },
  travel: { pt: "✈️ Viagens", es: "✈️ Viajes", en: "✈️ Travel" },
  conversation: { pt: "💬 Conversação", es: "💬 Conversación", en: "💬 Conversation" },
  general: { pt: "📚 Geral", es: "📚 General", en: "📚 General" },
};

// ============== 7-DAY PLAN (MVP2) ==============

const SEVEN_DAY_PLAN: DayLesson[] = [
  {
    day: 1,
    lesson_id: "day1_greetings",
    title: { pt: "Saudações e Apresentações", es: "Saludos y Presentaciones", en: "Greetings and Introductions" },
    objectives: {
      pt: ["Saudar formal e informalmente", "Se apresentar em inglês"],
      es: ["Saludar formalmente e informalmente", "Presentarte en inglés"],
      en: ["Greet formally and informally", "Introduce yourself in English"],
    },
    exercises: [
      {
        id: "d1_ex1",
        type: "choose_correct",
        prompt: "How do you respond to 'How are you?' naturally?\n\nA) I'm fine, thank you. And you?\nB) I am very good health.\nC) Yes, I am.\nD) Good morning.",
        prompt_translation: {
          pt: "(Como você responde a 'How are you?' naturalmente?)",
          es: "(¿Cómo respondes a 'How are you?' de manera natural?)",
        },
        options: ["A", "B", "C", "D"],
        correct_answer: "A",
        hint: {
          pt: "É uma fórmula de cortesia, não uma pergunta médica.",
          es: "Es una fórmula de cortesía, no una pregunta médica.",
          en: "It's a courtesy formula, not a medical question.",
        },
        mistake_tag: "greetings_response",
        feedback_correct: {
          pt: "✅ Correto! 'I'm fine, thank you. And you?' é a resposta natural e educada.",
          es: "✅ ¡Correcto! 'I'm fine, thank you. And you?' es la respuesta natural y educada.",
          en: "✅ Correct! 'I'm fine, thank you. And you?' is the natural polite response.",
        },
        feedback_wrong: {
          pt: "❌ A resposta correta é *A*. 'I'm fine, thank you. And you?' é a forma natural de responder.",
          es: "❌ La respuesta correcta es *A*. 'I'm fine, thank you. And you?' es la forma natural de responder.",
          en: "❌ The correct answer is *A*. 'I'm fine, thank you. And you?' is the natural way to respond.",
        },
      },
      {
        id: "d1_ex2",
        type: "fill_in_blank",
        prompt: "Complete: \"Nice ___ meet you!\"\n\n(Write only the missing word)",
        prompt_translation: {
          pt: "(Complete: \"Nice ___ meet you!\" - Escreva apenas a palavra que falta)",
          es: "(Completa: \"Nice ___ meet you!\" - Escribe solo la palabra que falta)",
        },
        correct_answer: "to",
        hint: {
          pt: "É uma expressão fixa: Nice ___ meet you.",
          es: "Es una expresión fija: Nice ___ meet you.",
          en: "It's a fixed expression: Nice ___ meet you.",
        },
        mistake_tag: "nice_to_meet"
      },
      {
        id: "d1_ex3",
        type: "reorder_words",
        prompt: "Reorder the words to form a correct sentence:\n\n*from / I / Spain / am*\n\n(Write the complete sentence)",
        prompt_translation: {
          pt: "(Ordene as palavras para formar uma frase correta - Escreva a frase completa)",
          es: "(Ordena las palabras para formar una frase correcta - Escribe la frase completa)",
        },
        correct_answer: "I am from Spain",
        hint: {
          pt: "Estrutura: Sujeito + Verbo + Complemento",
          es: "Estructura: Sujeto + Verbo + Complemento",
          en: "Structure: Subject + Verb + Complement",
        },
        mistake_tag: "word_order_basic"
      },
      {
        id: "d1_ex4",
        type: "correct_the_mistake",
        prompt: "Correct the mistake:\n\n*\"I am work in a hospital.\"*",
        prompt_translation: {
          pt: "(Corrija o erro: \"I am work in a hospital.\")",
          es: "(Corrige el error: \"I am work in a hospital.\")",
        },
        correct_answer: "I work in a hospital",
        hint: {
          pt: "Presente simples não usa 'am' com verbos de ação.",
          es: "El presente simple no usa 'am' con verbos de acción.",
          en: "Simple present doesn't use 'am' with action verbs.",
        },
        mistake_tag: "be_with_action_verb"
      },
      {
        id: "d1_ex5",
        type: "shadowing",
        prompt: "Listen and repeat:",
        prompt_translation: {
          pt: "(Ouça e repita a frase em voz alta)",
          es: "(Escucha y repite la frase en voz alta)",
        },
        correct_answer: "Nice to meet you",
        hint: {
          pt: "Frase de apresentação essencial.",
          es: "Frase de presentación esencial.",
          en: "Essential introduction phrase.",
        },
        mistake_tag: "pronunciation_drill",
      }
    ],
    production_type: "text",
    production_prompt: {
      pt: "✍️ *Produção final:*\n\nApresente-se em 2-3 frases em inglês:\n• Seu nome\n• O que você faz\n• De onde você é\n\n💡 Pode responder por texto ou áudio!",
      es: "✍️ *Producción final:*\n\nPreséntate en 2-3 frases en inglés:\n• Tu nombre\n• A qué te dedicas\n• De dónde eres\n\n💡 ¡Puedes responder por texto o audio!",
      en: "✍️ *Final production:*\n\nIntroduce yourself in 2-3 sentences in English:\n• Your name\n• What you do\n• Where you're from\n\n💡 You can answer by text or audio!",
    },
  },
  {
    day: 2,
    lesson_id: "day2_present_simple",
    title: { pt: "Presente Simples — Rotinas", es: "Presente Simple — Rutinas", en: "Simple Present — Routines" },
    objectives: {
      pt: ["Descrever rotinas diárias", "Usar corretamente a 3ª pessoa"],
      es: ["Describir rutinas diarias", "Usar correctamente la 3ª persona"],
      en: ["Describe daily routines", "Use 3rd person correctly"],
    },
    exercises: [
      {
        id: "d2_ex1",
        type: "choose_correct",
        prompt: "She ___ to the gym every day.\n\nA) go\nB) goes\nC) going\nD) is go",
        prompt_translation: {
          pt: "(Ela ___ à academia todo dia.)",
          es: "(Ella ___ al gimnasio todos los días.)",
        },
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: {
          pt: "Na 3ª pessoa (he/she/it) adicionamos -s ou -es ao verbo.",
          es: "En 3ª persona (he/she/it) añadimos -s o -es al verbo.",
          en: "In 3rd person (he/she/it) we add -s or -es to the verb.",
        },
        mistake_tag: "third_person_s"
      },
      {
        id: "d2_ex2",
        type: "fill_in_blank",
        prompt: "My brother ___ (not/like) coffee.\n\n(Write the complete verb form)",
        prompt_translation: {
          pt: "(Meu irmão ___ (não gostar) de café. - Escreva a forma verbal completa)",
          es: "(Mi hermano ___ (no gustar) el café. - Escribe la forma verbal completa)",
        },
        correct_answer: "doesn't like",
        hint: {
          pt: "Para negar na 3ª pessoa: doesn't + verbo base",
          es: "Para negar en 3ª persona: doesn't + verbo base",
          en: "To negate in 3rd person: doesn't + base verb",
        },
        mistake_tag: "doesnt_like"
      },
      {
        id: "d2_ex3",
        type: "reorder_words",
        prompt: "Reorder:\n\n*usually / I / breakfast / at / have / 8 AM*",
        prompt_translation: {
          pt: "(Ordene: usually / I / breakfast / at / have / 8 AM)",
          es: "(Ordena: usually / I / breakfast / at / have / 8 AM)",
        },
        correct_answer: "I usually have breakfast at 8 AM",
        hint: {
          pt: "Advérbios de frequência vão ANTES do verbo principal.",
          es: "Los adverbios de frecuencia van ANTES del verbo principal.",
          en: "Frequency adverbs go BEFORE the main verb.",
        },
        mistake_tag: "adverb_position"
      },
      {
        id: "d2_ex4",
        type: "correct_the_mistake",
        prompt: "Correct:\n\n*\"He don't work on weekends.\"*",
        prompt_translation: {
          pt: "(Corrija: \"He don't work on weekends.\")",
          es: "(Corrige: \"He don't work on weekends.\")",
        },
        correct_answer: "He doesn't work on weekends",
        hint: {
          pt: "Com he/she/it usamos DOESN'T, não DON'T.",
          es: "Con he/she/it usamos DOESN'T, no DON'T.",
          en: "With he/she/it we use DOESN'T, not DON'T.",
        },
        mistake_tag: "doesnt_vs_dont"
      },
      {
        id: "d2_ex5",
        type: "shadowing",
        prompt: "Listen and repeat:",
        prompt_translation: {
          pt: "(Ouça e repita a frase em voz alta)",
          es: "(Escucha y repite la frase en voz alta)",
        },
        correct_answer: "He doesn't work on weekends",
        hint: {
          pt: "Pratica a forma negativa da 3ª pessoa.",
          es: "Practica la forma negativa en 3ª persona.",
          en: "Practice 3rd person negative form.",
        },
        mistake_tag: "pronunciation_drill",
      }
    ],
    production_type: "text",
    production_prompt: {
      pt: "✍️ *Produção final:*\n\nDescreva sua rotina matinal em 3 frases usando presente simples.\n\n💡 Pode responder por texto ou áudio!",
      es: "✍️ *Producción final:*\n\nDescribe tu rutina matinal en 3 frases usando presente simple.\n\n💡 ¡Puedes responder por texto o audio!",
      en: "✍️ *Final production:*\n\nDescribe your morning routine in 3 sentences using simple present.\n\n💡 You can answer by text or audio!",
    },
  },
  {
    day: 3,
    lesson_id: "day3_past_simple",
    title: { pt: "Passado Simples — Eventos", es: "Pasado Simple — Eventos", en: "Simple Past — Events" },
    objectives: {
      pt: ["Falar sobre eventos passados", "Usar verbos regulares e irregulares"],
      es: ["Hablar sobre eventos pasados", "Usar verbos regulares e irregulares"],
      en: ["Talk about past events", "Use regular and irregular verbs"],
    },
    exercises: [
      {
        id: "d3_ex1",
        type: "choose_correct",
        prompt: "Yesterday I ___ a great movie.\n\nA) watch\nB) watched\nC) was watch\nD) watching",
        prompt_translation: {
          pt: "(Ontem eu ___ um ótimo filme.)",
          es: "(Ayer ___ una película genial.)",
        },
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: {
          pt: "Com 'yesterday' usamos passado simples. Verbos regulares terminam em -ed.",
          es: "Con 'yesterday' usamos pasado simple. Los verbos regulares terminan en -ed.",
          en: "With 'yesterday' we use simple past. Regular verbs end in -ed.",
        },
        mistake_tag: "past_simple_regular"
      },
      {
        id: "d3_ex2",
        type: "fill_in_blank",
        prompt: "She ___ (go) to Paris last summer.\n\n(Write the past form)",
        prompt_translation: {
          pt: "(Ela ___ (ir) para Paris no verão passado. - Escreva a forma no passado)",
          es: "(Ella ___ (ir) a París el verano pasado. - Escribe la forma en pasado)",
        },
        correct_answer: "went",
        hint: {
          pt: "Go é irregular: go → went",
          es: "Go es irregular: go → went",
          en: "Go is irregular: go → went",
        },
        mistake_tag: "went_irregular"
      },
      {
        id: "d3_ex3",
        type: "choose_correct",
        prompt: "___ you see the game last night?\n\nA) Do\nB) Did\nC) Was\nD) Were",
        prompt_translation: {
          pt: "(___ você viu o jogo ontem à noite?)",
          es: "(¿___ el partido anoche?)",
        },
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: {
          pt: "Para perguntas no passado: Did + sujeito + verbo base",
          es: "Para preguntas en pasado: Did + sujeto + verbo base",
          en: "For past questions: Did + subject + base verb",
        },
        mistake_tag: "did_question"
      },
      {
        id: "d3_ex4",
        type: "correct_the_mistake",
        prompt: "Correct:\n\n*\"I didn't went to the party.\"*",
        prompt_translation: {
          pt: "(Corrija: \"I didn't went to the party.\")",
          es: "(Corrige: \"I didn't went to the party.\")",
        },
        correct_answer: "I didn't go to the party",
        hint: {
          pt: "Depois de DIDN'T usamos o verbo BASE, não o passado.",
          es: "Después de DIDN'T usamos el verbo BASE, no el pasado.",
          en: "After DIDN'T we use the BASE verb, not the past.",
        },
        mistake_tag: "didnt_base_verb"
      }
    ],
    production_type: "text",
    production_prompt: {
      pt: "✍️ *Produção final:*\n\nConte algo interessante que você fez no último fim de semana (2-3 frases).\n\n💡 Pode responder por texto ou áudio!",
      es: "✍️ *Producción final:*\n\nCuenta algo interesante que hiciste el último fin de semana (2-3 frases).\n\n💡 ¡Puedes responder por texto o audio!",
      en: "✍️ *Final production:*\n\nTell something interesting you did last weekend (2-3 sentences).\n\n💡 You can answer by text or audio!",
    },
  },
  {
    day: 4,
    lesson_id: "day4_present_continuous",
    title: { pt: "Presente Contínuo — Agora", es: "Presente Continuo — Ahora", en: "Present Continuous — Now" },
    objectives: {
      pt: ["Descrever ações em progresso", "Diferenciar de presente simples"],
      es: ["Describir acciones en progreso", "Diferenciar del presente simple"],
      en: ["Describe actions in progress", "Differentiate from simple present"],
    },
    exercises: [
      {
        id: "d4_ex1",
        type: "choose_correct",
        prompt: "Look! She ___ the piano right now.\n\nA) plays\nB) play\nC) is playing\nD) playing",
        prompt_translation: {
          pt: "(Olha! Ela ___ piano agora.)",
          es: "(¡Mira! Ella ___ el piano ahora mismo.)",
        },
        options: ["A", "B", "C", "D"],
        correct_answer: "C",
        hint: {
          pt: "Para ações acontecendo AGORA: am/is/are + verbo-ing",
          es: "Para acciones que pasan AHORA: am/is/are + verbo-ing",
          en: "For actions happening NOW: am/is/are + verb-ing",
        },
        mistake_tag: "present_continuous"
      },
      {
        id: "d4_ex2",
        type: "fill_in_blank",
        prompt: "I ___ (study) English at the moment.\n\n(Write: am/is/are + verb-ing)",
        prompt_translation: {
          pt: "(Eu ___ (estudar) inglês no momento. - Escreva: am/is/are + verbo-ing)",
          es: "(Yo ___ (estudiar) inglés en este momento. - Escribe: am/is/are + verbo-ing)",
        },
        correct_answer: "am studying",
        hint: {
          pt: "I + am + verb-ing",
          es: "I + am + verb-ing",
          en: "I + am + verb-ing",
        },
        mistake_tag: "am_verbing"
      },
      {
        id: "d4_ex3",
        type: "choose_correct",
        prompt: "They ___ TV every evening. (routine)\n\nA) are watching\nB) watch\nC) watches\nD) is watching",
        prompt_translation: {
          pt: "(Eles ___ TV toda noite. (rotina))",
          es: "(Ellos ___ TV todas las noches. (rutina))",
        },
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: {
          pt: "Para ROTINAS usamos presente simples, não contínuo.",
          es: "Para RUTINAS usamos presente simple, no continuo.",
          en: "For ROUTINES we use simple present, not continuous.",
        },
        mistake_tag: "simple_vs_continuous"
      },
      {
        id: "d4_ex4",
        type: "correct_the_mistake",
        prompt: "Correct:\n\n*\"She is work from home today.\"*",
        prompt_translation: {
          pt: "(Corrija: \"She is work from home today.\")",
          es: "(Corrige: \"She is work from home today.\")",
        },
        correct_answer: "She is working from home today",
        hint: {
          pt: "Presente contínuo: is + verb-ING (não verbo base)",
          es: "Presente continuo: is + verb-ING (no verbo base)",
          en: "Present continuous: is + verb-ING (not base verb)",
        },
        mistake_tag: "is_verbing"
      }
    ],
    production_type: "text",
    production_prompt: {
      pt: "✍️ *Produção final:*\n\nDescreva 3 coisas que estão acontecendo ao seu redor agora.\n\n💡 Pode responder por texto ou áudio!",
      es: "✍️ *Producción final:*\n\nDescribe 3 cosas que están pasando a tu alrededor ahora.\n\n💡 ¡Puedes responder por texto o audio!",
      en: "✍️ *Final production:*\n\nDescribe 3 things that are happening around you now.\n\n💡 You can answer by text or audio!",
    },
  },
  {
    day: 5,
    lesson_id: "day5_future_going",
    title: { pt: "Futuro com Going To", es: "Futuro con Going To", en: "Future with Going To" },
    objectives: {
      pt: ["Falar sobre planos futuros", "Usar going to corretamente"],
      es: ["Hablar sobre planes futuros", "Usar going to correctamente"],
      en: ["Talk about future plans", "Use going to correctly"],
    },
    exercises: [
      {
        id: "d5_ex1",
        type: "choose_correct",
        prompt: "I ___ visit my parents this weekend.\n\nA) going to\nB) am going to\nC) will going\nD) go to",
        prompt_translation: {
          pt: "(Eu ___ visitar meus pais neste fim de semana.)",
          es: "(Yo ___ visitar a mis padres este fin de semana.)",
        },
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: {
          pt: "Estrutura: am/is/are + going to + verbo base",
          es: "Estructura: am/is/are + going to + verbo base",
          en: "Structure: am/is/are + going to + base verb",
        },
        mistake_tag: "going_to_structure"
      },
      {
        id: "d5_ex2",
        type: "fill_in_blank",
        prompt: "Look at those clouds! It ___ rain.\n\n(Write: 's going to / will)",
        prompt_translation: {
          pt: "(Olhe aquelas nuvens! ___ chover. - Escreva: 's going to / will)",
          es: "(¡Mira esas nubes! ___ llover. - Escribe: 's going to / will)",
        },
        correct_answer: "'s going to",
        hint: {
          pt: "Quando há evidência visível, usamos 'going to'.",
          es: "Cuando hay evidencia visible, usamos 'going to'.",
          en: "When there's visible evidence, we use 'going to'.",
        },
        mistake_tag: "going_to_vs_will"
      },
      {
        id: "d5_ex3",
        type: "choose_correct",
        prompt: "A: The phone is ringing!\nB: I ___ answer it.\n\nA) am going to\nB) will\nC) going to\nD) am will",
        prompt_translation: {
          pt: "(A: O telefone está tocando! B: Eu ___ atender.)",
          es: "(A: ¡El teléfono está sonando! B: Yo ___ contestar.)",
        },
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: {
          pt: "Para decisões espontâneas usamos 'will'.",
          es: "Para decisiones espontáneas usamos 'will'.",
          en: "For spontaneous decisions we use 'will'.",
        },
        mistake_tag: "will_spontaneous"
      },
      {
        id: "d5_ex4",
        type: "correct_the_mistake",
        prompt: "Correct:\n\n*\"She will going to study medicine.\"*",
        prompt_translation: {
          pt: "(Corrija: \"She will going to study medicine.\")",
          es: "(Corrige: \"She will going to study medicine.\")",
        },
        correct_answer: "She is going to study medicine",
        hint: {
          pt: "Não combinamos will + going to.",
          es: "No combinamos will + going to.",
          en: "We don't combine will + going to.",
        },
        mistake_tag: "will_going_to_mix"
      }
    ],
    production_type: "text",
    production_prompt: {
      pt: "✍️ *Produção final:*\n\nDescreva 3 planos que você tem para este fim de semana usando 'going to'.\n\n💡 Pode responder por texto ou áudio!",
      es: "✍️ *Producción final:*\n\nDescribe 3 planes que tienes para este fin de semana usando 'going to'.\n\n💡 ¡Puedes responder por texto o audio!",
      en: "✍️ *Final production:*\n\nDescribe 3 plans you have for this weekend using 'going to'.\n\n💡 You can answer by text or audio!",
    },
  },
  {
    day: 6,
    lesson_id: "day6_can_have",
    title: { pt: "Habilidades e Experiências", es: "Habilidades y Experiencias", en: "Abilities and Experiences" },
    objectives: {
      pt: ["Expressar habilidades com 'can'", "Falar de experiências com 'have'"],
      es: ["Expresar habilidades con 'can'", "Hablar de experiencias con 'have'"],
      en: ["Express abilities with 'can'", "Talk about experiences with 'have'"],
    },
    exercises: [
      {
        id: "d6_ex1",
        type: "choose_correct",
        prompt: "She ___ speak three languages.\n\nA) can\nB) cans\nC) can to\nD) is can",
        prompt_translation: {
          pt: "(Ela ___ falar três idiomas.)",
          es: "(Ella ___ hablar tres idiomas.)",
        },
        options: ["A", "B", "C", "D"],
        correct_answer: "A",
        hint: {
          pt: "Can não muda: he/she/it can (sem 's')",
          es: "Can no cambia: he/she/it can (sin 's')",
          en: "Can doesn't change: he/she/it can (no 's')",
        },
        mistake_tag: "can_no_s"
      },
      {
        id: "d6_ex2",
        type: "fill_in_blank",
        prompt: "I have ___ (be) to Paris twice.\n\n(Write the participle)",
        prompt_translation: {
          pt: "(Eu ___ (estar) em Paris duas vezes. - Escreva o particípio)",
          es: "(He ___ (estar) en París dos veces. - Escribe el participio)",
        },
        correct_answer: "been",
        hint: {
          pt: "be → was/were → been",
          es: "be → was/were → been",
          en: "be → was/were → been",
        },
        mistake_tag: "been_participle"
      },
      {
        id: "d6_ex3",
        type: "choose_correct",
        prompt: "___ you ever tried sushi?\n\nA) Did\nB) Have\nC) Do\nD) Are",
        prompt_translation: {
          pt: "(___ você já experimentou sushi?)",
          es: "(¿___ probado sushi alguna vez?)",
        },
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: {
          pt: "Para experiências usamos Present Perfect: Have + ever + particípio",
          es: "Para experiencias usamos Present Perfect: Have + ever + participle",
          en: "For experiences we use Present Perfect: Have + ever + participle",
        },
        mistake_tag: "present_perfect_experience"
      },
      {
        id: "d6_ex4",
        type: "correct_the_mistake",
        prompt: "Correct:\n\n*\"I can't to swim.\"*",
        prompt_translation: {
          pt: "(Corrija: \"I can't to swim.\")",
          es: "(Corrige: \"I can't to swim.\")",
        },
        correct_answer: "I can't swim",
        hint: {
          pt: "Depois de can/can't NÃO usamos 'to'.",
          es: "Después de can/can't NO usamos 'to'.",
          en: "After can/can't we DON'T use 'to'.",
        },
        mistake_tag: "can_no_to"
      }
    ],
    production_type: "audio",
    production_prompt: {
      pt: "🎤 *Produção final (áudio):*\n\nGrave um áudio de 10-15 segundos dizendo:\n\n_\"Hi, I'm [seu nome]. I can [uma habilidade]. I have [uma experiência].\"_\n\nOu escreva *SKIP* para pular.",
      es: "🎤 *Producción final (audio):*\n\nGraba un audio de 10-15 segundos diciendo:\n\n_\"Hi, I'm [tu nombre]. I can [una habilidad]. I have [una experiencia].\"_\n\nO escribe *SKIP* para saltar.",
      en: "🎤 *Final production (audio):*\n\nRecord a 10-15 second audio saying:\n\n_\"Hi, I'm [your name]. I can [a skill]. I have [an experience].\"_\n\nOr type *SKIP* to skip.",
    },
  },
  {
    day: 7,
    lesson_id: "day7_review_conversation",
    title: { pt: "Conversação Prática", es: "Conversación Prática", en: "Practical Conversation" },
    objectives: {
      pt: ["Integrar tudo o que aprendeu", "Manter uma conversa simples"],
      es: ["Integrar todo lo aprendido", "Mantener una conversación simple"],
      en: ["Integrate everything learned", "Maintain a simple conversation"],
    },
    exercises: [
      {
        id: "d7_ex1",
        type: "choose_correct",
        prompt: "A: What do you do?\nB: ___\n\nA) I'm fine, thanks.\nB) I work as a designer.\nC) I'm from Madrid.\nD) Nice to meet you.",
        prompt_translation: {
          pt: "(A: O que você faz? B: ___)",
          es: "(A: ¿A qué te dedicas? B: ___)",
        },
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: {
          pt: "'What do you do?' pergunta sobre seu trabalho.",
          es: "'What do you do?' pregunta por tu trabajo.",
          en: "'What do you do?' asks about your job.",
        },
        mistake_tag: "what_do_you_do"
      },
      {
        id: "d7_ex2",
        type: "fill_in_blank",
        prompt: "I've been learning English ___ two years.\n\n(for / since)",
        prompt_translation: {
          pt: "(Eu estou aprendendo inglês ___ dois anos. - for / since)",
          es: "(He estado aprendiendo inglés ___ dos años. - for / since)",
        },
        correct_answer: "for",
        hint: {
          pt: "'for' + período de tempo, 'since' + ponto no tempo",
          es: "'for' + período de tiempo, 'since' + punto en el tiempo",
          en: "'for' + period of time, 'since' + point in time",
        },
        mistake_tag: "for_vs_since"
      },
      {
        id: "d7_ex3",
        type: "reorder_words",
        prompt: "Reorder:\n\n*would / like / I / coffee / a / please*",
        prompt_translation: {
          pt: "(Ordene: would / like / I / coffee / a / please)",
          es: "(Ordena: would / like / I / coffee / a / please)",
        },
        correct_answer: "I would like a coffee please",
        hint: {
          pt: "Estrutura: I would like + objeto",
          es: "Estructura: I would like + objeto",
          en: "Structure: I would like + object",
        },
        mistake_tag: "would_like_order"
      },
      {
        id: "d7_ex4",
        type: "correct_the_mistake",
        prompt: "Correct:\n\n*\"I'm agree with you.\"*",
        prompt_translation: {
          pt: "(Corrija: \"I'm agree with you.\")",
          es: "(Corrige: \"I'm agree with you.\")",
        },
        correct_answer: "I agree with you",
        hint: {
          pt: "'Agree' é um verbo, não precisa de 'am'.",
          es: "'Agree' es un verbo, no necesita 'am'.",
          en: "'Agree' is a verb, it doesn't need 'am'.",
        },
        mistake_tag: "agree_no_be"
      }
    ],
    production_type: "audio",
    production_prompt: {
      pt: "🎤 *Produção final (áudio):*\n\nGrave 15-20 segundos se apresentando como se estivesse em uma reunião de trabalho:\n\n_\"Hello everyone, my name is... I work as... I've been... Nice to meet you!\"_\n\nOu escreva *SKIP* para pular.",
      es: "🎤 *Producción final (audio):*\n\nGraba 15-20 segundos presentándote como si estuvieras en una reunión de trabajo:\n\n_\"Hello everyone, my name is... I work as... I've been... Nice to meet you!\"_\n\nO escribe *SKIP* para saltar.",
      en: "🎤 *Final production (audio):*\n\nRecord 15-20 seconds introducing yourself as if in a work meeting:\n\n_\"Hello everyone, my name is... I work as... I've been... Nice to meet you!\"_\n\nOr type *SKIP* to skip.",
    },
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

/**
 * Send an audio message via WhatsApp Cloud API using a public audio URL.
 */
async function sendWhatsAppAudio(to: string, audioUrl: string): Promise<{ success: boolean; messageId?: string }> {
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    console.error("[WhatsApp] Missing credentials for audio send");
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
        type: "audio",
        audio: { link: audioUrl },
      }),
    });

    const result = await response.json();

    if (response.ok) {
      const messageId = result.messages?.[0]?.id;
      console.log("[WhatsApp] ✅ Audio sent to:", to.slice(0, 4) + "****");
      return { success: true, messageId };
    } else {
      console.error("[WhatsApp] ❌ Audio send error:", result);
      return { success: false };
    }
  } catch (error) {
    console.error("[WhatsApp] ❌ Audio send exception:", error);
    return { success: false };
  }
}

interface BotAudioResult {
  ok: boolean;
  reason?: "unknown_asset" | "missing_config" | "storage_404" | "send_failed";
  bucket?: string;
  path?: string;
  asset_id?: string;
}

/**
 * Send a pre-recorded audio asset to a user via WhatsApp.
 * Resolves the asset key to a public Storage URL, checks existence, and sends it.
 * Returns a structured result with diagnostics on failure.
 */
async function sendBotAudio(to: string, assetKey: AudioAssetKey): Promise<BotAudioResult> {
  const objectPath = AUDIO_ASSETS[assetKey];
  if (!objectPath) {
    console.warn(`[AUDIO] Unknown asset key: ${assetKey}`);
    return { ok: false, reason: "unknown_asset", asset_id: assetKey };
  }

  // Validate .ogg extension
  if (!objectPath.endsWith(".ogg")) {
    console.error(`[AUDIO] Asset path does not end with .ogg: ${objectPath} (asset_id=${assetKey})`);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) {
    console.error("[AUDIO] Missing SUPABASE_URL for asset resolution");
    return { ok: false, reason: "missing_config", bucket: AUDIO_BUCKET, path: objectPath, asset_id: assetKey };
  }

  // Build public URL for the asset
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${AUDIO_BUCKET}/${objectPath}`;
  console.log(`[AUDIO] Resolving asset — bucket_id=${AUDIO_BUCKET} object_path=${objectPath} asset_id=${assetKey}`);
  console.log(`[AUDIO] Public URL: ${publicUrl}`);

  // HEAD check to detect 404 before sending to WhatsApp
  try {
    const headResp = await fetch(publicUrl, { method: "HEAD" });
    if (!headResp.ok) {
      console.error(`[AUDIO] Storage returned ${headResp.status} for ${objectPath} (bucket=${AUDIO_BUCKET}, asset_id=${assetKey})`);
      return { ok: false, reason: "storage_404", bucket: AUDIO_BUCKET, path: objectPath, asset_id: assetKey };
    }
  } catch (headErr) {
    console.error(`[AUDIO] HEAD request failed for ${objectPath}:`, headErr);
    return { ok: false, reason: "storage_404", bucket: AUDIO_BUCKET, path: objectPath, asset_id: assetKey };
  }

  const result = await sendWhatsAppAudio(to, publicUrl);

  if (globalSupabase && result.success) {
    await trackEvent(globalSupabase, to, "message_sent", {
      type: "audio",
      asset_key: assetKey,
      audio_url: publicUrl,
      message_id: result.messageId || null,
    });
  }

  if (!result.success) {
    return { ok: false, reason: "send_failed", bucket: AUDIO_BUCKET, path: objectPath, asset_id: assetKey };
  }

  return { ok: true };
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

/**
 * Send a WhatsApp interactive message with buttons.
 * Max 3 buttons, each with id and title (max 20 chars).
 */
async function sendInteractiveButton(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
): Promise<{ success: boolean; messageId?: string }> {
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    console.error("[WhatsApp] Missing credentials for interactive send");
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
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: bodyText },
          action: {
            buttons: buttons.slice(0, 3).map(b => ({
              type: "reply",
              reply: { id: b.id, title: b.title.slice(0, 20) },
            })),
          },
        },
      }),
    });

    const result = await response.json();

    if (response.ok) {
      const messageId = result.messages?.[0]?.id;
      console.log("[WhatsApp] ✅ Interactive sent to:", to.slice(0, 4) + "****");
      return { success: true, messageId };
    } else {
      console.error("[WhatsApp] ❌ Interactive send error:", result);
      return { success: false };
    }
  } catch (error) {
    console.error("[WhatsApp] ❌ Interactive send exception:", error);
    return { success: false };
  }
}

/**
 * Send a "Ver Tradução" interactive button after exercise feedback.
 * Falls back to text CTA if interactive send fails.
 */
async function sendTranslationButton(waId: string, lang: Language): Promise<void> {
  if (lang === "en") return; // No translation button for EN users

  const bodyText = lang === "pt" 
    ? "📖 Quer ver a tradução?" 
    : "📖 ¿Quieres ver la traducción?";
  const buttonTitle = lang === "pt" ? "Ver Tradução" : "Ver Traducción";

  const result = await sendInteractiveButton(waId, bodyText, [
    { id: "btn_translate", title: buttonTitle },
  ]);

  if (!result.success) {
    // Fallback to text CTA
    const fallbackCta = lang === "pt"
      ? "📖 _Digite TRADUCAO para ver tradução_"
      : "📖 _Escribe TRADUCCION para ver traducción_";
    await send(waId, fallbackCta);
  }

  if (globalSupabase && result.success) {
    await trackEvent(globalSupabase, waId, "message_sent", {
      type: "interactive_button",
      button_id: "btn_translate",
    });
  }
}

// ============== DATABASE FUNCTIONS ==============

function isAdminWaId(waId: string): boolean {
  const adminWaId = Deno.env.get("ADMIN_WA_ID");
  return !!(adminWaId && waId === adminWaId);
}

async function getOrCreateUser(
  supabase: SupabaseClientType,
  waId: string,
  name: string | null,
): Promise<UserData | null> {
  const isAdmin = isAdminWaId(waId);
  
  const { data: existing } = await supabase
    .from("wa_users")
    .select("wa_id, name, level, subscription_status, trial_started_at, trial_expires_at, trial_completed, is_subscribed, subscription_plan, preferred_language, show_translations, prefers_audio, expires_at")
    .eq("wa_id", waId)
    .maybeSingle();

  if (existing) {
    // For admin: DO NOT set trial dates automatically
    if (isAdmin) {
      console.log("[DB] Admin user detected, skipping trial setup:", waId.slice(0, 4) + "****");
      return {
        wa_id: existing.wa_id as string,
        name: existing.name as string | null,
        level: existing.level as EnglishLevel | null,
        subscription_status: existing.subscription_status as string,
        trial_started_at: existing.trial_started_at as string | null,
        trial_expires_at: existing.trial_expires_at as string | null,
        trial_completed: existing.trial_completed as boolean,
        is_subscribed: existing.is_subscribed as boolean,
        subscription_plan: existing.subscription_plan as string | null,
        preferred_language: existing.preferred_language as Language | null,
        show_translations: existing.show_translations as boolean ?? true,
        prefers_audio: existing.prefers_audio as boolean ?? false,
        expires_at: existing.expires_at as string | null,
      };
    }

    // Check if trial dates need to be set (existing user with NULL trial dates)
    if (existing.trial_started_at === null) {
      const now = new Date();
      const trialExpiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

      await supabase
        .from("wa_users")
        .update({
          trial_started_at: now.toISOString(),
          trial_expires_at: trialExpiresAt.toISOString(),
          trial_completed: existing.trial_completed ?? false,
          is_subscribed: existing.is_subscribed ?? false,
        })
        .eq("wa_id", waId);

      // Track trial_started event
      await trackEvent(supabase, waId, "trial_started", {
        trial_started_at: now.toISOString(),
        trial_expires_at: trialExpiresAt.toISOString(),
        existing_user: true,
      });

      console.log("[DB] Trial dates set for existing user:", waId.slice(0, 4) + "****");

      return {
        wa_id: existing.wa_id as string,
        name: existing.name as string | null,
        level: existing.level as EnglishLevel | null,
        subscription_status: existing.subscription_status as string,
        trial_started_at: now.toISOString(),
        trial_expires_at: trialExpiresAt.toISOString(),
        trial_completed: existing.trial_completed ?? false,
        is_subscribed: existing.is_subscribed ?? false,
        subscription_plan: existing.subscription_plan as string | null,
        preferred_language: existing.preferred_language as Language | null,
        show_translations: existing.show_translations as boolean ?? true,
        prefers_audio: existing.prefers_audio as boolean ?? false,
        expires_at: existing.expires_at as string | null,
      };
    }

    return {
      wa_id: existing.wa_id as string,
      name: existing.name as string | null,
      level: existing.level as EnglishLevel | null,
      subscription_status: existing.subscription_status as string,
      trial_started_at: existing.trial_started_at as string | null,
      trial_expires_at: existing.trial_expires_at as string | null,
      trial_completed: existing.trial_completed as boolean,
      is_subscribed: existing.is_subscribed as boolean,
      subscription_plan: existing.subscription_plan as string | null,
      preferred_language: existing.preferred_language as Language | null,
      show_translations: existing.show_translations as boolean ?? true,
      prefers_audio: existing.prefers_audio as boolean ?? false,
      expires_at: existing.expires_at as string | null,
    };
  }

  // New user
  const now = new Date();
  
  // For admin: create user WITHOUT trial dates
  if (isAdmin) {
    const { data: newUser, error } = await supabase
      .from("wa_users")
      .insert({ 
        wa_id: waId, 
        name, 
        subscription_status: "paid",
        trial_started_at: null,
        trial_expires_at: null,
        trial_completed: false,
        is_subscribed: false,
        preferred_language: null,
        show_translations: true,
        prefers_audio: false,
      })
      .select("wa_id, name, level, subscription_status, trial_started_at, trial_expires_at, trial_completed, is_subscribed, subscription_plan, preferred_language, show_translations, prefers_audio, expires_at")
      .single();

    if (error) {
      console.error("[DB] Error:", error);
      return null;
    }

    console.log("[DB] Admin user created without trial:", waId.slice(0, 4) + "****");

    return {
      wa_id: newUser.wa_id as string,
      name: newUser.name as string | null,
      level: newUser.level as EnglishLevel | null,
      subscription_status: newUser.subscription_status as string,
      trial_started_at: newUser.trial_started_at as string | null,
      trial_expires_at: newUser.trial_expires_at as string | null,
      trial_completed: newUser.trial_completed as boolean ?? false,
      is_subscribed: newUser.is_subscribed as boolean ?? false,
      subscription_plan: newUser.subscription_plan as string | null,
      preferred_language: newUser.preferred_language as Language | null,
      show_translations: newUser.show_translations as boolean ?? true,
      prefers_audio: newUser.prefers_audio as boolean ?? false,
      expires_at: newUser.expires_at as string | null,
    };
  }

  // Regular user with trial
  const trialExpiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const { data: newUser, error } = await supabase
    .from("wa_users")
    .insert({ 
      wa_id: waId, 
      name, 
      trial_started_at: now.toISOString(),
      trial_expires_at: trialExpiresAt.toISOString(),
      trial_completed: false,
      is_subscribed: false,
      subscription_status: "trial",
      preferred_language: null,
      show_translations: true,
      prefers_audio: false,
    })
    .select("wa_id, name, level, subscription_status, trial_started_at, trial_expires_at, trial_completed, is_subscribed, subscription_plan, preferred_language, show_translations, prefers_audio, expires_at")
    .single();

  if (error) {
    console.error("[DB] Error:", error);
    return null;
  }

  // Track trial_started event
  await trackEvent(supabase, waId, "trial_started", {
    trial_started_at: now.toISOString(),
    trial_expires_at: trialExpiresAt.toISOString(),
    new_user: true,
  });

  console.log("[DB] New user created:", waId.slice(0, 4) + "****");

  return {
    wa_id: newUser.wa_id as string,
    name: newUser.name as string | null,
    level: newUser.level as EnglishLevel | null,
    subscription_status: newUser.subscription_status as string,
    trial_started_at: newUser.trial_started_at as string | null,
    trial_expires_at: newUser.trial_expires_at as string | null,
    trial_completed: newUser.trial_completed as boolean ?? false,
    is_subscribed: newUser.is_subscribed as boolean ?? false,
    subscription_plan: newUser.subscription_plan as string | null,
    preferred_language: newUser.preferred_language as Language | null,
    show_translations: newUser.show_translations as boolean ?? true,
    prefers_audio: newUser.prefers_audio as boolean ?? false,
    expires_at: newUser.expires_at as string | null,
  };
}

async function updateUserLevel(supabase: SupabaseClientType, waId: string, level: EnglishLevel): Promise<void> {
  await supabase.from("wa_users").update({ level }).eq("wa_id", waId);
  await trackEvent(supabase, waId, "level_assessed", { level });
}

async function updateUserLanguage(
  supabase: SupabaseClientType,
  waId: string,
  language: Language,
  showTranslations: boolean
): Promise<void> {
  await supabase.from("wa_users").update({ 
    preferred_language: language,
    show_translations: showTranslations,
    ui_language_locked: true,
  }).eq("wa_id", waId);
}

async function updateUserAudioPreference(
  supabase: SupabaseClientType,
  waId: string,
  prefersAudio: boolean
): Promise<void> {
  await supabase.from("wa_users").update({ 
    prefers_audio: prefersAudio,
  }).eq("wa_id", waId);
  
  await trackEvent(supabase, waId, "audio_preference_changed", {
    prefers_audio: prefersAudio,
  });
}

async function getOrCreateState(
  supabase: SupabaseClientType,
  waId: string,
): Promise<{ step: string; data: StateData }> {
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

  await supabase.from("wa_state").insert({ wa_id: waId, step: "welcome", data: {} });
  return { step: "welcome", data: {} };
}

async function updateState(
  supabase: SupabaseClientType,
  waId: string,
  step: string,
  data: StateData,
): Promise<void> {
  await supabase
    .from("wa_state")
    .update({ step, data, updated_at: new Date().toISOString() })
    .eq("wa_id", waId);
}

// ============== TRIAL SYSTEM ==============

function initTrial(): TrialInfo {
  return {
    trial_started_at: new Date().toISOString(),
    lessons_completed: 0,
    trial_status: "active",
  };
}

function getTrialProgress(trial: TrialInfo): { daysLeft: number; lessonsLeft: number } {
  const started = new Date(trial.trial_started_at);
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - started.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, TRIAL_DAYS - elapsed);
  const lessonsLeft = Math.max(0, TRIAL_LESSONS - trial.lessons_completed);
  return { daysLeft, lessonsLeft };
}

// ============== ACCESS CONTROL ==============

function getAccessStatus(waUser: UserData, waId: string): AccessStatus {
  const adminWaId = Deno.env.get("ADMIN_WA_ID");
  
  // Check if admin by wa_id
  if (adminWaId && waId === adminWaId) {
    console.log(`[ACCESS] Admin bypass for wa_id: ${waId.slice(0, 4)}****`);
    return {
      isAdmin: true,
      isSubscribed: true,
      plan: "trimestral",
      trialActive: true,
      trialExpired: false,
    };
  }

  // Regular user
  const isSubscribed = waUser.is_subscribed === true;
  
  // Check if subscription has expired
  let subscriptionExpired = false;
  if (isSubscribed && waUser.expires_at) {
    const expiresAt = new Date(waUser.expires_at);
    if (new Date() >= expiresAt) {
      subscriptionExpired = true;
    }
  }

  let trialActive = false;
  let trialExpired = false;
  
  if (waUser.trial_expires_at) {
    const expiresAt = new Date(waUser.trial_expires_at);
    const now = new Date();
    trialActive = now < expiresAt;
    trialExpired = now >= expiresAt;
  }

  return {
    isAdmin: false,
    isSubscribed: isSubscribed && !subscriptionExpired,
    plan: isSubscribed && !subscriptionExpired ? (waUser.subscription_plan as SubscriptionPlan) : null,
    trialActive,
    trialExpired,
  };
}

async function trackAdminBypass(
  supabase: SupabaseClientType,
  waId: string,
  reason: "ADMIN_WA_ID" | "ADMIN_KEY",
  plan: SubscriptionPlan | null
): Promise<void> {
  await trackEvent(supabase, waId, "admin_bypass_used", {
    wa_id: waId,
    reason,
    plan: plan || "trimestral",
  });
}

// ============== ADMIN COMMANDS ==============

const VALID_STEPS = [
  "welcome", "language_picker", "pre_placement",
  "placement_q1", "placement_q2", "placement_q3",
  "placement_written", "placement_audio", "placement_result",
  "select_goal", "ready", "day_intro", "day_exercise",
  "day_production", "day_complete", "day_failed",
  "review_mode", "confirm_restart"
] as const;

async function getRecentEvents(
  supabase: SupabaseClientType,
  waId: string,
  limit: number = 5
): Promise<Array<{ event_type: string; created_at: string }>> {
  const { data } = await supabase
    .from("wa_events")
    .select("event_type, created_at")
    .eq("wa_id", waId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

function maskWaId(waId: string): string {
  if (waId.length <= 6) return waId;
  return waId.slice(0, 3) + "***" + waId.slice(-4);
}

async function handleAdminCommand(
  supabase: SupabaseClientType,
  waId: string,
  messageText: string,
  state: { step: string; data: StateData },
  user: UserData,
  lang: Language
): Promise<boolean> {
  const lower = messageText.toLowerCase().trim();
  
  // Check if it's an admin command
  const isAdminCmd = lower.startsWith("/admin") || 
                     lower.startsWith("admin ") || 
                     lower === "admin";
  
  if (!isAdminCmd) return false;
  
  const accessStatus = getAccessStatus(user, waId);
  
  // Silently ignore for non-admins
  if (!accessStatus.isAdmin) {
    console.log(`[ADMIN] Non-admin tried admin command: ${maskWaId(waId)}`);
    return false;
  }
  
  // Parse subcommand
  const parts = lower.replace("/admin", "").replace("admin", "").trim().split(/\s+/);
  const subcommand = parts[0] || "status";
  const arg = parts.slice(1).join(" ");
  
  console.log(`[ADMIN] Command: ${subcommand}, Arg: ${arg}`);
  
  // Track admin command usage
  await trackEvent(supabase, waId, "admin_bypass_used", {
    command: "admin",
    subcommand,
    arg,
  });
  
  if (subcommand === "reset") {
    // Force reset to welcome with empty data
    await updateState(supabase, waId, "welcome", {});
    await send(waId, t(lang, "admin_reset_done"));
    return true;
  }
  
  // NEW: Admin lang command - changes language even if locked
  if (subcommand === "lang" && arg) {
    const langChoice = arg.toLowerCase();
    let newLang: Language | null = null;
    
    if (langChoice === "pt" || langChoice === "português") newLang = "pt";
    else if (langChoice === "es" || langChoice === "español") newLang = "es";
    else if (langChoice === "en" || langChoice === "english") newLang = "en";
    
    if (newLang) {
      const showTranslations = newLang !== "en";
      await supabase.from("wa_users").update({
        preferred_language: newLang,
        show_translations: showTranslations,
        ui_language_locked: true,
      }).eq("wa_id", waId);
      
      await trackEvent(supabase, waId, "language_selected", {
        language: newLang,
        source: "admin_command",
        admin_override: true,
      });
      
      const confirmKey = `language_confirm_${newLang}`;
      await send(waId, `🔧 *Admin:* ${t(newLang, confirmKey)}`);
      return true;
    } else {
      await send(waId, `❌ Idioma inválido: ${arg}\n\n*Válidos:* pt, es, en`);
      return true;
    }
  }
  
  if (subcommand === "step" && arg) {
    const targetStep = arg.toLowerCase();
    
    if (!VALID_STEPS.includes(targetStep as typeof VALID_STEPS[number])) {
      await send(waId, t(lang, "admin_step_invalid", {
        step: targetStep,
        valid_steps: VALID_STEPS.join(", "),
      }));
      return true;
    }
    
    // Auto-init placement data when jumping to placement steps
    if (targetStep.startsWith("placement")) {
      const qIndex = targetStep === "placement_q1" ? 0 
                   : targetStep === "placement_q2" ? 1 
                   : targetStep === "placement_q3" ? 2 : 0;
      const part = targetStep === "placement_written" ? 2 
                 : targetStep === "placement_audio" ? 3 
                 : targetStep === "placement_result" ? 4 : 1;
      state.data.placement = state.data.placement || {
        part, question_index: qIndex,
        mcq_answers: [], mcq_score: 0,
      };
      state.data.placement.question_index = qIndex;
      state.data.placement.part = part;
    }
    await updateState(supabase, waId, targetStep, state.data);
    await send(waId, t(lang, "admin_step_changed", { step: targetStep }));
    return true;
  }
  
  if (subcommand === "test_audio") {
    const availableKeys = Object.keys(AUDIO_ASSETS);
    
    if (!arg) {
      // List all available audio assets
      const list = availableKeys.map(k => `• ${k} → ${AUDIO_ASSETS[k as AudioAssetKey]}`).join("\n");
      await send(waId, `🔧 *Audio Assets disponíveis:*\n\n${list}\n\nUso: /admin test_audio ASSET_KEY`);
      return true;
    }
    
    const assetKey = arg.toUpperCase();
    if (!availableKeys.includes(assetKey)) {
      const list = availableKeys.join("\n• ");
      await send(waId, `❌ Asset inválido: ${assetKey}\n\n*Assets válidos:*\n• ${list}`);
      return true;
    }
    
    const result = await sendBotAudio(waId, assetKey as AudioAssetKey);
    
    const diagnostic = [
      `🔧 *test_audio result:*`,
      `• asset_id: ${result.asset_id || assetKey}`,
      `• ok: ${result.ok}`,
      `• bucket: ${result.bucket || "N/A"}`,
      `• path: ${result.path || "N/A"}`,
      result.reason ? `• reason: ${result.reason}` : null,
    ].filter(Boolean).join("\n");
    
    if (!result.ok) {
      await send(waId, `${diagnostic}\n\n⚠️ Áudio não enviado. Verifique se o arquivo existe no bucket.`);
    } else {
      // Audio was sent to WhatsApp, also send diagnostic
      await send(waId, diagnostic);
    }
    
    return true;
  }
  
  if (subcommand === "help") {
    await send(waId, t(lang, "admin_help", {
      valid_steps: VALID_STEPS.join("\n• "),
    }));
    return true;
  }
  
  // Default: show status
  const progress = state.data.progress;
  const recentEvents = await getRecentEvents(supabase, waId, 5);
  
  const eventsFormatted = recentEvents.length > 0
    ? recentEvents.map(e => {
        const time = new Date(e.created_at).toLocaleTimeString("es", { 
          hour: "2-digit", 
          minute: "2-digit" 
        });
        return `• ${time} - ${e.event_type}`;
      }).join("\n")
    : "• Nenhum evento recente";
  
  const trialStatus = accessStatus.trialActive 
    ? "active" 
    : accessStatus.trialExpired 
      ? "expired" 
      : "N/A (admin)";
  
  const currentDay = progress?.current_day || 1;
  const dayLesson = SEVEN_DAY_PLAN.find(d => d.day === currentDay);
  const totalExercises = dayLesson?.exercises.length || 4;
  const currentExercise = Math.min((progress?.current_exercise_index || 0) + 1, totalExercises);
  
  await send(waId, t(lang, "admin_status", {
    wa_id_masked: maskWaId(waId),
    step: state.step,
    day: String(currentDay),
    exercise: String(currentExercise),
    total_exercises: String(totalExercises),
    subscription: accessStatus.isSubscribed ? "paid" : "trial",
    plan: accessStatus.plan || "admin_bypass",
    trial_status: trialStatus,
    event_count: String(recentEvents.length),
    events: eventsFormatted,
  }));
  
  return true;
}

// ============== PAYWALL SYSTEM ==============

const SUBSCRIBE_URL = "https://speakeasilynexo-digitalapp.lovable.app/subscribe";

function getSubscribeLink(waId: string, source: string, lang?: Language): string {
  const langParam = lang ? `&lang=${lang}` : "";
  return `${SUBSCRIBE_URL}?wa_id=${waId}&source=${source}${langParam}`;
}

function isTrialExpired(user: UserData): { expired: boolean; reason: "trial_completed" | "trial_expired" | "subscription_expired" | null } {
  // Check subscription expiration first
  if (user.is_subscribed && user.expires_at) {
    const expiresAt = new Date(user.expires_at);
    if (new Date() >= expiresAt) {
      return { expired: true, reason: "subscription_expired" };
    }
    return { expired: false, reason: null };
  }

  if (user.is_subscribed) {
    return { expired: false, reason: null };
  }

  if (user.trial_completed) {
    return { expired: true, reason: "trial_completed" };
  }

  if (user.trial_expires_at) {
    const expiresAt = new Date(user.trial_expires_at);
    if (new Date() > expiresAt) {
      return { expired: true, reason: "trial_expired" };
    }
  }

  return { expired: false, reason: null };
}

async function sendPaywallMessage(
  supabase: SupabaseClientType,
  waId: string,
  reason: "trial_completed" | "trial_expired" | "subscription_expired",
  command: string,
  lang: Language
): Promise<void> {
  const subscribeLink = getSubscribeLink(waId, "paywall", lang);

  await trackEvent(supabase, waId, "paywall_shown", {
    reason,
    command,
  });

  await trackEvent(supabase, waId, "subscribe_link_opened", {
    source: "paywall",
    link: subscribeLink,
  });

  const msgKey = reason === "subscription_expired" ? "subscription_expired" : "trial_ended";
  await send(waId, t(lang, msgKey, { link: subscribeLink }));
}

async function checkReviewLimit(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData }
): Promise<{ allowed: boolean; remaining: number }> {
  const progress = state.data.progress;
  if (!progress) return { allowed: false, remaining: 0 };

  // Get today's date string for comparison
  const today = new Date().toISOString().slice(0, 10);
  
  // Check review count in progress data
  const reviewToday = progress.review_count_today || { date: "", count: 0 };
  
  if (reviewToday.date !== today) {
    // Reset for new day
    return { allowed: true, remaining: FREE_REVIEW_LIMIT };
  }

  const remaining = Math.max(0, FREE_REVIEW_LIMIT - reviewToday.count);
  return { allowed: remaining > 0, remaining };
}

async function incrementReviewCount(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData }
): Promise<void> {
  const progress = state.data.progress;
  if (!progress) return;

  const today = new Date().toISOString().slice(0, 10);
  const reviewToday = progress.review_count_today || { date: "", count: 0 };

  if (reviewToday.date !== today) {
    progress.review_count_today = { date: today, count: 1 };
  } else {
    progress.review_count_today = { date: today, count: reviewToday.count + 1 };
  }

  await updateState(supabase, waId, state.step, state.data);
}

async function sendReviewLimitedMessage(
  supabase: SupabaseClientType,
  waId: string,
  lang: Language
): Promise<void> {
  const subscribeLink = getSubscribeLink(waId, "review_limit", lang);

  await trackEvent(supabase, waId, "review_limited_shown", {});

  await send(waId, t(lang, "review_limit", { link: subscribeLink }));
}

async function markTrialCompleted(
  supabase: SupabaseClientType,
  waId: string,
  user: UserData,
  progress: LessonProgress
): Promise<void> {
  await supabase.from("wa_users").update({
    trial_completed: true,
  }).eq("wa_id", waId);

  await trackEvent(supabase, waId, "trial_completed", {
    day: 7,
    level: user.level,
    lessons_completed: progress.total_lessons_completed,
    exercises_completed: progress.exercises_completed,
  });
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

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
}

function getFallbackLesson(dayNumber: number): DayLesson {
  const exactLesson = SEVEN_DAY_PLAN.find(lesson => lesson.day === dayNumber);
  if (exactLesson) return exactLesson;

  const fallbackLesson = SEVEN_DAY_PLAN[SEVEN_DAY_PLAN.length - 1];
  return {
    ...fallbackLesson,
    day: dayNumber,
    lesson_id: `fallback_day_${dayNumber}_${fallbackLesson.lesson_id}`,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

function isExerciseType(value: unknown): value is ExerciseType {
  return typeof value === "string" && [
    "fill_in_blank",
    "reorder_words",
    "choose_correct",
    "correct_the_mistake",
    "translation",
    "written_production",
    "shadowing",
  ].includes(value);
}

function isLanguageStringRecord(value: unknown): value is Record<Language, string> {
  return isRecord(value)
    && typeof value.pt === "string"
    && typeof value.es === "string"
    && typeof value.en === "string";
}

function isLanguageStringArrayRecord(value: unknown): value is Record<Language, string[]> {
  return isRecord(value)
    && isStringArray(value.pt)
    && isStringArray(value.es)
    && isStringArray(value.en);
}

function isPromptTranslation(value: unknown): value is Record<"pt" | "es", string> {
  return isRecord(value)
    && typeof value.pt === "string"
    && typeof value.es === "string";
}

function isValidLessonExercise(value: unknown): value is LessonExercise {
  if (!isRecord(value)) return false;

  const hasRequiredFields =
    typeof value.id === "string"
    && isExerciseType(value.type)
    && typeof value.prompt === "string"
    && typeof value.correct_answer === "string"
    && typeof value.mistake_tag === "string";

  if (!hasRequiredFields) return false;
  if (value.prompt_translation !== undefined && !isPromptTranslation(value.prompt_translation)) return false;
  if (value.options !== undefined && !isStringArray(value.options)) return false;
  if (value.hint !== undefined && !isLanguageStringRecord(value.hint)) return false;
  if (value.feedback_correct !== undefined && !isLanguageStringRecord(value.feedback_correct)) return false;
  if (value.feedback_wrong !== undefined && !isLanguageStringRecord(value.feedback_wrong)) return false;

  return true;
}

function isValidDayLesson(value: unknown): value is DayLesson {
  if (!isRecord(value)) return false;

  return typeof value.day === "number"
    && Number.isInteger(value.day)
    && typeof value.lesson_id === "string"
    && isLanguageStringRecord(value.title)
    && isLanguageStringArrayRecord(value.objectives)
    && Array.isArray(value.exercises)
    && value.exercises.length === 5
    && value.exercises.every(isValidLessonExercise)
    && (value.production_type === "text" || value.production_type === "audio")
    && isLanguageStringRecord(value.production_prompt);
}

function parseDynamicLessonJson(content: string): DayLesson | null {
  try {
    const parsed: unknown = JSON.parse(content);
    return isValidDayLesson(parsed) ? parsed : null;
  } catch (error) {
    console.error("[AI] Dynamic lesson JSON parse failed:", error);
    return null;
  }
}

async function generateDynamicLesson(
  openaiApiKey: string,
  level: EnglishLevel,
  dayNumber: number,
  lang: Language,
  mistakeTags: MistakeTag[],
  goal: LearningGoal
): Promise<DayLesson> {
  const fallbackLesson = getFallbackLesson(dayNumber);
  const topMistakes = [...mistakeTags]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(mistake => `${mistake.tag} (${mistake.count})`);

  const stage = dayNumber <= 7 ? "foundations" : dayNumber <= 14 ? "expansion" : "fluency";
  const systemPrompt =
    "You are an expert English curriculum designer for a WhatsApp-based learning bot. "
    + "Generate ONLY valid JSON matching the DayLesson TypeScript interface exactly. "
    + "Do not include markdown, comments, explanations, or extra keys. "
    + "Generate exactly 5 exercises with varied types: choose_correct, fill_in_blank, reorder_words, correct_the_mistake, shadowing. "
    + "Match vocabulary and grammar complexity to the provided CEFR-like internal level. "
    + "Include prompt_translation for pt and es when the user's language is not en. "
    + "Use the provided mistake tags to bias at least 2 exercises toward the user's known weak points.";

  const userPrompt = JSON.stringify({
    required_interface: {
      day: "number",
      lesson_id: "string",
      title: { pt: "string", es: "string", en: "string" },
      objectives: { pt: ["string"], es: ["string"], en: ["string"] },
      exercises: "LessonExercise[5]",
      production_type: "text | audio",
      production_prompt: { pt: "string", es: "string", en: "string" },
    },
    lesson_exercise_shape: {
      id: "string",
      type: "choose_correct | fill_in_blank | reorder_words | correct_the_mistake | shadowing",
      prompt: "string",
      prompt_translation: { pt: "string", es: "string" },
      options: ["string"],
      correct_answer: "string",
      hint: { pt: "string", es: "string", en: "string" },
      mistake_tag: "string",
      feedback_correct: { pt: "string", es: "string", en: "string" },
      feedback_wrong: { pt: "string", es: "string", en: "string" },
    },
    context: {
      level,
      day_number: dayNumber,
      language: lang,
      goal,
      stage,
      top_mistake_tags: topMistakes.length > 0 ? topMistakes : ["none"],
    },
  });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2200,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      console.error("[AI] Dynamic lesson generation failed:", response.status);
      return fallbackLesson;
    }

    const data: unknown = await response.json();
    const content = (data as OpenAIChatResponse).choices?.[0]?.message?.content;
    if (typeof content !== "string") return fallbackLesson;

    return parseDynamicLessonJson(content) ?? fallbackLesson;
  } catch (error) {
    console.error("[AI] Dynamic lesson generation error:", error);
    return fallbackLesson;
  }
}

function isDynamicLessonLevel(level: EnglishLevel): boolean {
  return level === "intermediate" || level === "upper_intermediate" || level === "advanced";
}

async function getLessonForProgress(
  state: { step: string; data: StateData },
  lang: Language
): Promise<DayLesson> {
  const progress = state.data.progress;
  const dayNumber = progress?.current_day ?? 1;
  const fallbackLesson = getFallbackLesson(dayNumber);
  const level = progress?.detected_level ?? "beginner";
  const goal = progress?.goal ?? "general";

  if (!isDynamicLessonLevel(level)) return fallbackLesson;

  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiApiKey) return fallbackLesson;

  const cacheKey = `${level}:${goal}:${dayNumber}:${lang}`;
  const cachedLesson = state.data.generated_lesson_cache?.[cacheKey];
  if (cachedLesson && isValidDayLesson(cachedLesson)) return cachedLesson;

  const lesson = await generateDynamicLesson(
    openaiApiKey,
    level,
    dayNumber,
    lang,
    progress?.mistake_tags ?? [],
    goal
  );

  state.data.generated_lesson_cache = {
    ...(state.data.generated_lesson_cache ?? {}),
    [cacheKey]: lesson,
  };

  return lesson;
}

/**
 * Translate a short English phrase to the user's native language (pt/es).
 * Uses the lightest AI model for speed. Returns empty string on failure.
 */
async function translatePhrase(phrase: string, lang: Language): Promise<string> {
  if (!phrase || lang === "en") return "";
  const targetLang = lang === "pt" ? "Brazilian Portuguese" : "Spanish";
  const systemPrompt = `Translate the following English sentence to ${targetLang}. Return ONLY the translation, nothing else.`;
  const result = await callAI(systemPrompt, phrase);
  return result.trim().replace(/^["']|["']$/g, "");
}

// ============== AUDIO TRANSCRIPTION (WHISPER) ==============

interface TranscriptionResult {
  success: boolean;
  transcript: string;
  confidence?: number;
  error?: string;
  request_id?: string;
  audio_seconds?: number;
  raw_error?: string;
}

interface MediaUrlResponse {
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
  id: string;
  messaging_product: string;
}

/**
 * Fetch the download URL for a WhatsApp media file
 */
async function fetchMediaUrl(mediaId: string): Promise<{ url: string; mimeType: string } | null> {
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  
  if (!accessToken) {
    console.error("[AUDIO] Missing WHATSAPP_ACCESS_TOKEN");
    return null;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error("[AUDIO] fetchMediaUrl error:", response.status, await response.text());
      return null;
    }

    const data = await response.json() as MediaUrlResponse;
    console.log("[AUDIO] Media URL fetched for:", mediaId);
    
    return {
      url: data.url,
      mimeType: data.mime_type || "audio/ogg",
    };
  } catch (error) {
    console.error("[AUDIO] fetchMediaUrl exception:", error);
    return null;
  }
}

/**
 * Download the media file from WhatsApp
 */
async function downloadMedia(url: string): Promise<Blob | null> {
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  
  if (!accessToken) {
    console.error("[AUDIO] Missing WHATSAPP_ACCESS_TOKEN");
    return null;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error("[AUDIO] downloadMedia error:", response.status);
      return null;
    }

    const blob = await response.blob();
    console.log("[AUDIO] Media downloaded, size:", blob.size);
    
    return blob;
  } catch (error) {
    console.error("[AUDIO] downloadMedia exception:", error);
    return null;
  }
}

/**
 * Transcribe audio using OpenAI Whisper API with retry for rate limits
 */
async function transcribeAudio(audioBlob: Blob, mimeType: string): Promise<TranscriptionResult> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const requestId = crypto.randomUUID();
  
  if (!openaiKey) {
    console.error("[AUDIO] Missing OPENAI_API_KEY");
    return { success: false, transcript: "", error: "missing_api_key", request_id: requestId };
  }

  // Retry config: 2 retries with backoff (800ms, 1600ms)
  const maxRetries = 2;
  const baseDelay = 800;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Determine file extension based on mime type
      const extMap: Record<string, string> = {
        "audio/ogg": "ogg",
        "audio/opus": "opus",
        "audio/mpeg": "mp3",
        "audio/mp4": "m4a",
        "audio/wav": "wav",
        "audio/webm": "webm",
      };
      const ext = extMap[mimeType] || "ogg";
      
      const formData = new FormData();
      formData.append("file", audioBlob, `audio.${ext}`);
      formData.append("model", "whisper-1");
      formData.append("language", "en"); // Transcribe to English
      formData.append("response_format", "verbose_json");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AUDIO] Whisper API error (attempt ${attempt + 1}):`, response.status, errorText);
        
        // Handle 401/403 as auth errors (don't retry)
        if (response.status === 401 || response.status === 403) {
          return { 
            success: false, 
            transcript: "", 
            error: "auth_error", 
            request_id: requestId,
            raw_error: errorText,
          };
        }
        
        // Handle rate limit (429) - differentiate quota_exceeded vs rate_limit
        if (response.status === 429) {
          const isQuotaExceeded = errorText.includes("insufficient_quota") || 
                                  errorText.includes("exceeded your current quota");
          
          if (isQuotaExceeded) {
            // Quota exceeded - don't retry, billing issue
            return { 
              success: false, 
              transcript: "", 
              error: "quota_exceeded", 
              request_id: requestId,
              raw_error: errorText,
            };
          }
          
          // Regular rate limit - retry with backoff
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt); // 800ms, 1600ms
            console.log(`[AUDIO] Rate limited, retrying in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          return { 
            success: false, 
            transcript: "", 
            error: "rate_limit", 
            request_id: requestId,
            raw_error: errorText,
          };
        }
        
        return { 
          success: false, 
          transcript: "", 
          error: `whisper_error_${response.status}`, 
          request_id: requestId,
          raw_error: errorText,
        };
      }

      const data = await response.json();
      const transcript = data.text?.trim() || "";
      const audioSeconds = data.duration || 0;
      
      console.log("[AUDIO] Transcription successful:", transcript.slice(0, 50) + "...");
      
      return {
        success: true,
        transcript,
        confidence: data.segments?.[0]?.avg_logprob ? Math.exp(data.segments[0].avg_logprob) : undefined,
        request_id: requestId,
        audio_seconds: audioSeconds,
      };
    } catch (error) {
      console.error(`[AUDIO] transcribeAudio exception (attempt ${attempt + 1}):`, error);
      if (attempt >= maxRetries) {
        return { success: false, transcript: "", error: "transcription_exception", request_id: requestId };
      }
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  return { success: false, transcript: "", error: "transcription_exception", request_id: requestId };
}

/**
 * Full pipeline: fetch URL -> download -> transcribe
 */
async function processAudioMessage(
  supabase: SupabaseClientType,
  waId: string,
  mediaId: string,
  mimeType?: string,
  stepAtTime?: string
): Promise<TranscriptionResult> {
  console.log("[AUDIO] Starting audio processing for media:", mediaId);
  
  const requestId = crypto.randomUUID();
  
  // Step 1: Get media URL
  const mediaInfo = await fetchMediaUrl(mediaId);
  if (!mediaInfo) {
    await trackEvent(supabase, waId, "audio_transcription_failed", {
      media_id: mediaId,
      error: "fetch_url_failed",
      request_id: requestId,
      step_at_time: stepAtTime,
    });
    return { success: false, transcript: "", error: "fetch_url_failed", request_id: requestId };
  }

  // Step 2: Download media
  const audioBlob = await downloadMedia(mediaInfo.url);
  if (!audioBlob) {
    await trackEvent(supabase, waId, "audio_transcription_failed", {
      media_id: mediaId,
      error: "download_failed",
      request_id: requestId,
      step_at_time: stepAtTime,
    });
    return { success: false, transcript: "", error: "download_failed", request_id: requestId };
  }

  // Step 3: Transcribe
  const result = await transcribeAudio(audioBlob, mimeType || mediaInfo.mimeType);
  
  if (result.success) {
    // Track audio_received with full metadata
    await trackEvent(supabase, waId, "audio_received", {
      media_id: mediaId,
      transcript_text: result.transcript,
      audio_seconds: result.audio_seconds,
      provider: "openai",
      request_id: result.request_id,
      step_at_time: stepAtTime,
      confidence: result.confidence,
    });
    
    await trackEvent(supabase, waId, "audio_transcribed", {
      media_id: mediaId,
      transcript: result.transcript.slice(0, 500),
      confidence: result.confidence,
      mime_type: mimeType || mediaInfo.mimeType,
      request_id: result.request_id,
    });
  } else {
    await trackEvent(supabase, waId, "audio_transcription_failed", {
      media_id: mediaId,
      error: result.error,
      request_id: result.request_id,
      step_at_time: stepAtTime,
    });
  }

  return result;
}

// ============== AUDIO RATE LIMITING ==============

const AUDIO_LIMIT_PER_USER_DAY = 2;   // 2 audios/user/day (beta)
const AUDIO_LIMIT_GLOBAL_DAY = 20;    // 20 audios/day total (beta)

interface RateLimitResult {
  allowed: boolean;
  reason?: "user_limit" | "global_limit";
}

/**
 * Check if user can send audio (rate limit check)
 */
async function checkAudioRateLimit(
  supabase: SupabaseClientType,
  waId: string
): Promise<RateLimitResult> {
  const today = new Date().toISOString().split("T")[0];
  
  try {
    // Check user limit
    const { data: userUsage } = await supabase
      .from("audio_usage")
      .select("count")
      .eq("wa_id", waId)
      .eq("date", today)
      .single();
    
    if (userUsage && userUsage.count >= AUDIO_LIMIT_PER_USER_DAY) {
      console.log(`[AUDIO] User ${waId} exceeded daily limit: ${userUsage.count}/${AUDIO_LIMIT_PER_USER_DAY}`);
      return { allowed: false, reason: "user_limit" };
    }
    
    // Check global limit
    const { data: globalUsage } = await supabase
      .from("audio_usage")
      .select("count")
      .eq("wa_id", "global")
      .eq("date", today)
      .single();
    
    if (globalUsage && globalUsage.count >= AUDIO_LIMIT_GLOBAL_DAY) {
      console.log(`[AUDIO] Global limit exceeded: ${globalUsage.count}/${AUDIO_LIMIT_GLOBAL_DAY}`);
      return { allowed: false, reason: "global_limit" };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error("[AUDIO] Rate limit check error:", error);
    // Allow on error (fail open)
    return { allowed: true };
  }
}

/**
 * Increment audio usage counter for user and global
 */
async function incrementAudioUsage(
  supabase: SupabaseClientType,
  waId: string
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  
  try {
    // Upsert user count
    const { data: existingUser } = await supabase
      .from("audio_usage")
      .select("id, count")
      .eq("wa_id", waId)
      .eq("date", today)
      .single();
    
    if (existingUser) {
      await supabase
        .from("audio_usage")
        .update({ count: existingUser.count + 1 })
        .eq("id", existingUser.id);
    } else {
      await supabase
        .from("audio_usage")
        .insert({ wa_id: waId, date: today, count: 1 });
    }
    
    // Upsert global count
    const { data: existingGlobal } = await supabase
      .from("audio_usage")
      .select("id, count")
      .eq("wa_id", "global")
      .eq("date", today)
      .single();
    
    if (existingGlobal) {
      await supabase
        .from("audio_usage")
        .update({ count: existingGlobal.count + 1 })
        .eq("id", existingGlobal.id);
    } else {
      await supabase
        .from("audio_usage")
        .insert({ wa_id: "global", date: today, count: 1 });
    }
    
    console.log(`[AUDIO] Incremented usage for ${waId} and global`);
  } catch (error) {
    console.error("[AUDIO] Increment usage error:", error);
  }
}

/**
 * Log transcription error to database for analysis
 */
async function logTranscriptionError(
  supabase: SupabaseClientType,
  waId: string,
  errorCode: string,
  rawError: string | undefined,
  requestId: string
): Promise<void> {
  try {
    await supabase
      .from("audio_transcription_errors")
      .insert({
        wa_id: waId,
        error_code: errorCode,
        raw_error: rawError || null,
        request_id: requestId,
      });
    console.log(`[AUDIO] Logged transcription error: ${errorCode} for ${waId}`);
  } catch (error) {
    console.error("[AUDIO] Failed to log transcription error:", error);
  }
}

/**
 * Check if error is a service error (vs audio quality issue)
 */
function isServiceError(errorCode: string | undefined): boolean {
  if (!errorCode) return false;
  const serviceErrors = [
    "quota_exceeded",
    "rate_limit", 
    "auth_error",
    "missing_api_key",
  ];
  return serviceErrors.includes(errorCode) || errorCode.startsWith("whisper_error_");
}

// ============== LEVENSHTEIN SCORING (no libs) ==============

/**
 * Normalize text for comparison: lowercase, remove punctuation, trim
 */
function normalizeForScoring(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?'";\-:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 * Classic dynamic programming approach, no external libs
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  
  // Create a 2D array (m+1) x (n+1)
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  
  // Base cases
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Calculate similarity score (0 to 1) based on Levenshtein distance
 */
function calculateAudioScore(expected: string, actual: string): { score: number; label: "correct" | "close" | "incorrect" } {
  const normExpected = normalizeForScoring(expected);
  const normActual = normalizeForScoring(actual);
  
  if (normExpected.length === 0 && normActual.length === 0) {
    return { score: 1, label: "correct" };
  }
  
  const distance = levenshteinDistance(normExpected, normActual);
  const maxLen = Math.max(normExpected.length, normActual.length);
  
  const score = maxLen > 0 ? 1 - (distance / maxLen) : 0;
  
  // Classify the score
  let label: "correct" | "close" | "incorrect";
  if (score >= 0.90) {
    label = "correct";
  } else if (score >= 0.75) {
    label = "close";
  } else {
    label = "incorrect";
  }
  
  return { score: Math.round(score * 100) / 100, label };
}

/**
 * Generate a short pronunciation tip based on the expected answer
 */
async function generatePronunciationTip(
  expectedAnswer: string,
  userTranscript: string,
  lang: Language
): Promise<string> {
  const feedbackLang = lang === "en" ? "English" : lang === "pt" ? "Portuguese" : "Spanish";
  
  const systemPrompt = `You are a pronunciation coach. Give ONE short tip (max 15 words) in ${feedbackLang}.
Compare the expected answer to what the student said.
Focus on the most important pronunciation issue if any.
If pronunciation seems correct, give encouragement.
Be friendly and supportive.`;

  const userMessage = `Expected: "${expectedAnswer}"
Student said: "${userTranscript}"`;

  const response = await callAI(systemPrompt, userMessage);
  
  if (response && response.length < 100) {
    return response.trim();
  }
  
  // Fallback tips
  const fallbacks: Record<Language, string> = {
    pt: "Continue praticando! Sua pronúncia está melhorando.",
    es: "¡Sigue practicando! Tu pronunciación está mejorando.",
    en: "Keep practicing! Your pronunciation is improving.",
  };
  
  return fallbacks[lang];
}

/**
 * Extract answer from transcript for MCQ (A/B/C/D)
 */
function extractMCQFromTranscript(transcript: string): string | null {
  const lower = transcript.toLowerCase().trim();
  
  // Direct letter match
  if (/^[abcd]\.?$/i.test(lower)) {
    return lower.charAt(0).toUpperCase();
  }
  
  // Match at start or end
  const startMatch = lower.match(/^([abcd])\b/i);
  if (startMatch) return startMatch[1].toUpperCase();
  
  const endMatch = lower.match(/\b([abcd])$/i);
  if (endMatch) return endMatch[1].toUpperCase();
  
  // Look for spoken versions
  const spokenMap: Record<string, string> = {
    "a": "A", "be": "B", "bee": "B", "b": "B",
    "see": "C", "sea": "C", "c": "C",
    "dee": "D", "d": "D",
    "letter a": "A", "letter b": "B", "letter c": "C", "letter d": "D",
    "option a": "A", "option b": "B", "option c": "C", "option d": "D",
    "answer a": "A", "answer b": "B", "answer c": "C", "answer d": "D",
    "opción a": "A", "opción b": "B", "opción c": "C", "opción d": "D",
    "opcion a": "A", "opcion b": "B", "opcion c": "C", "opcion d": "D",
  };
  
  for (const [word, letter] of Object.entries(spokenMap)) {
    if (lower.includes(word)) {
      return spokenMap[word];
    }
  }
  
  return null;
}

// ============== LANGUAGE DETECTION FROM TEXT ==============

type DetectedLanguage = "es" | "pt" | "en";

/**
 * Simple heuristic-based language detection from text.
 * Detects Spanish (ES), Portuguese (PT), or English (EN).
 */
function detectLanguageFromText(text: string): DetectedLanguage {
  const lower = text.toLowerCase();
  
  // Portuguese indicators (unique to PT)
  const ptIndicators = [
    "ção", "ões", "ão", "não", "você", "voce", "está", "esta", "muito", 
    "também", "porque", "para", "com", "uma", "tenho", "sou", "estou",
    "meu", "minha", "seu", "sua", "quero", "falar", "aprender", "jogar",
    "trabalho", "trabalhar", "obrigado", "obrigada", "olá", "oi", "tudo",
    "bom dia", "boa tarde", "boa noite", "fazer", "ajuda", "preciso"
  ];
  
  // Spanish indicators (unique to ES)
  const esIndicators = [
    "ción", "ciones", "ñ", "estoy", "soy", "tengo", "quiero", "porque",
    "muy", "también", "pero", "para", "con", "una", "hola", "gracias",
    "buenos días", "buenas tardes", "buenas noches", "trabajo", "trabajar",
    "aprender", "jugar", "hablar", "necesito", "ayuda", "llamo", "vivo"
  ];
  
  // English indicators
  const enIndicators = [
    "i'm", "i am", "i have", "i want", "my name is", "hello", "hi",
    "thank you", "thanks", "please", "because", "work", "working",
    "learning", "playing", "need", "help", "good morning", "good afternoon",
    "good evening", "the", "and", "that", "this", "with", "for"
  ];
  
  let ptScore = 0;
  let esScore = 0;
  let enScore = 0;
  
  for (const indicator of ptIndicators) {
    if (lower.includes(indicator)) ptScore++;
  }
  
  for (const indicator of esIndicators) {
    if (lower.includes(indicator)) esScore++;
  }
  
  for (const indicator of enIndicators) {
    if (lower.includes(indicator)) enScore++;
  }
  
  // Check for clear language markers
  if (lower.includes("você") || lower.includes("voce") || lower.includes("não") || lower.includes("meu nome é")) {
    ptScore += 5;
  }
  if (lower.includes("me llamo") || lower.includes("quiero") || lower.includes("estoy")) {
    esScore += 5;
  }
  if (lower.includes("my name is") || lower.includes("i'm") || lower.includes("i am")) {
    enScore += 5;
  }
  
  // Determine language
  if (ptScore > esScore && ptScore > enScore) {
    return "pt";
  }
  if (esScore > ptScore && esScore > enScore) {
    return "es";
  }
  if (enScore > 0) {
    return "en";
  }
  
  // Default to Spanish (Barcelona audience)
  return "es";
}

interface ConversationalAudioFeedback {
  system_version: string;
  english_correct: string;
  english_natural: string;
  fix1: string;
  fix2: string;
  fix3?: string;
  target_sentence: string;
  translation_correct: string;
  translation_natural: string;
  translation_target: string;
  explanation_native?: string;
}

/**
 * Generate conversational audio feedback using AI.
 * Takes the transcription and generates a proper English version with corrections.
 */
async function generateConversationalAudioFeedback(
  transcript: string,
  detectedLang: DetectedLanguage
): Promise<ConversationalAudioFeedback | null> {
  const feedbackLang = detectedLang === "pt" ? "Portuguese" : detectedLang === "es" ? "Spanish" : "English";
  
  const nativeLangLabel = feedbackLang === "Portuguese" ? "PT-BR" : "ES";

  const systemPrompt = `You are "SpeakEasily", a premium English coach via WhatsApp (like BeConfident).
system_version: speakeasily_webhook_v4_strict_corrections

MISSION: teach English with micro-lessons, REAL corrections, motivation. Translation always available but hidden.
Target audience: ${nativeLangLabel} speakers learning English. ALWAYS include translation in ${feedbackLang}.

ABSOLUTE RULES (NON-NEGOTIABLE):
1) NEVER respond generically ("bom esforço", "good try") without analyzing the transcription. You MUST evaluate every word.
2) If there are errors, detect and list AT LEAST 2 (grammar + vocabulary, verb tense + preposition, word order + article, etc.). 
   - If only 1 real error exists, that's OK — but you MUST explicitly confirm you checked for more.
   - If 3+ errors exist, pick the 2-3 most important.
3) ALWAYS provide translations for: english_correct, english_natural, target_sentence.
4) If transcript is already correct/near-perfect (similarity >= 0.95), confirm briefly — do NOT invent fake corrections.
5) Keep target_sentence SHORT: max 8 words (ideally 4-6). This is for repetition practice.
6) fix1 and fix2 MUST be in ${feedbackLang}, concrete, actionable. Example: "Você disse 'I am work' — o correto é 'I work'. Presente simples não usa 'am' com verbos de ação."
7) fix2 MUST be filled if 2+ errors exist. Only empty if genuinely only 1 issue.
8) NEVER skip to "next" without showing: corrected form + natural form + at least 1 error detail.
9) explanation_native: give a 1-line grammar/vocab tip in ${feedbackLang} to help the student understand WHY.

FEEDBACK STYLE (BeConfident-like):
- Short blocks, well formatted
- Subtle emojis (not excessive)
- Clear CTA at end
- Never wall-of-text
- Always invite to respond (text or audio) with a target phrase

ERROR ANALYSIS PROCESS:
1. Read the transcript carefully
2. Compare with what the student likely meant to say
3. List ALL errors you find (grammar, vocabulary, word order, articles, prepositions, verb forms)
4. Select the 2 most impactful for fix1 and fix2
5. Provide corrected and natural versions

The student's native language is: ${feedbackLang}

Return ONLY this JSON (no extra text):
{
  "system_version": "speakeasily_webhook_v4_strict_corrections",
  "english_correct": "grammatically correct version of what they tried to say",
  "english_natural": "how a native would naturally say it",
  "fix1": "first correction in ${feedbackLang} — MUST explain the error clearly",
  "fix2": "second correction in ${feedbackLang} — MUST be filled if 2+ errors, else empty string",
  "fix3": "third correction if 3+ errors exist, else empty string",
  "target_sentence": "short phrase to repeat in English (max 8 words)",
  "translation_correct": "translation of english_correct in ${feedbackLang}",
  "translation_natural": "translation of english_natural in ${feedbackLang}",
  "translation_target": "translation of target_sentence in ${feedbackLang}",
  "explanation_native": "1-line grammar tip in ${feedbackLang} explaining the main error"
}`;

  const userMessage = `Student said: "${transcript}"`;
  
  const response = await callAI(systemPrompt, userMessage);
  
  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      const result = JSON.parse(match[0]);
      return {
        system_version: String(result.system_version || "speakeasily_webhook_v4_strict_corrections"),
        english_correct: String(result.english_correct || transcript),
        english_natural: String(result.english_natural || transcript),
        fix1: String(result.fix1 || ""),
        fix2: String(result.fix2 || ""),
        fix3: result.fix3 ? String(result.fix3) : undefined,
        target_sentence: String(result.target_sentence || ""),
        translation_correct: String(result.translation_correct || ""),
        translation_natural: String(result.translation_natural || ""),
        translation_target: String(result.translation_target || ""),
        explanation_native: result.explanation_native ? String(result.explanation_native) : undefined,
      };
    }
  } catch (e) {
    console.error("[AI] Parse error in conversational audio feedback:", e);
  }
  
  return null;
}

/**
 * Handle conversational audio - when user sends audio outside of exercise context.
 * Provides structured feedback with transcription, corrections, and target sentence.
 * NEW: Checks if user correctly repeated the target sentence and advances instead of looping.
 */
async function handleConversationalAudio(
  supabase: SupabaseClientType,
  waId: string,
  audioData: { media_id: string; mime_type?: string },
  userLang: Language | null
): Promise<boolean> {
  console.log("[AUDIO] Processing conversational audio for:", waId);
  
  const responseLang: Language = userLang || "es";
  
  // Step 1: Check rate limit BEFORE transcription
  const rateLimitCheck = await checkAudioRateLimit(supabase, waId);
  if (!rateLimitCheck.allowed) {
    console.log(`[AUDIO] Rate limit hit for ${waId}: ${rateLimitCheck.reason}`);
    const limitKey = responseLang === "pt" ? "audio_beta_limit_reached_pt" : "audio_beta_limit_reached_es";
    await send(waId, t(responseLang, limitKey));
    return true;
  }
  
  // Step 2: Transcribe the audio
  const transcriptionResult = await processAudioMessage(
    supabase,
    waId,
    audioData.media_id,
    audioData.mime_type,
    "conversational"
  );
  
  // Step 3: Handle transcription failure
  if (!transcriptionResult.success || !transcriptionResult.transcript.trim()) {
    const errorCode = transcriptionResult.error || "unknown";
    
    // Log error to database for analysis
    await logTranscriptionError(
      supabase,
      waId,
      errorCode,
      transcriptionResult.raw_error,
      transcriptionResult.request_id || crypto.randomUUID()
    );
    
    // Choose appropriate message based on error type
    if (isServiceError(errorCode)) {
      // Service error (quota, rate limit, auth) - be honest
      console.log(`[AUDIO] Service error for ${waId}: ${errorCode}`);
      const errorKey = responseLang === "pt" ? "audio_beta_unavailable_pt" : "audio_beta_unavailable_es";
      await send(waId, t(responseLang, errorKey));
    } else {
      // Audio quality issue (download failed, etc) - ask to re-record
      console.log(`[AUDIO] Audio quality issue for ${waId}: ${errorCode}`);
      const errorKey = responseLang === "pt" ? "audio_conv_not_understood_pt" : "audio_conv_not_understood_es";
      await send(waId, t(responseLang, errorKey));
    }
    return true;
  }
  
  // Step 4: Success - increment usage counter
  await incrementAudioUsage(supabase, waId);
  
  const transcript = transcriptionResult.transcript;
  
  // Detect language from transcript for response
  const detectedLang = detectLanguageFromText(transcript);
  
  // Determine response language: use detected if ES/PT, else fall back to user's saved language or ES
  const feedbackLang: Language = (detectedLang === "es" || detectedLang === "pt") 
    ? detectedLang 
    : responseLang;
  
  // Step 5: Check if there's a pending target sentence to match
  const state = await getOrCreateState(supabase, waId);
  const audioPractice = state.data.audio_practice;
  
  if (audioPractice && audioPractice.target_sentence) {
    // User is practicing - check if they matched the target
    const { score, label } = calculateAudioScore(audioPractice.target_sentence, transcript);
    console.log(`[AUDIO] Score for target match: ${score} (${label})`);
    
    if (label === "correct" || label === "close") {
      // SUCCESS! User correctly repeated the target
      console.log(`[AUDIO] User correctly repeated target sentence`);
      
      // Clear the audio practice state
      state.data.audio_practice = undefined;
      await updateState(supabase, waId, state.step, state.data);
      
      // Send success message
      const successKey = feedbackLang === "pt" ? "audio_practice_success_pt" : "audio_practice_success_es";
      await send(waId, t(feedbackLang, successKey));
      
      return true;
    } else {
      // Not close enough - show what we heard and encourage retry
      const heardKey = feedbackLang === "pt" ? "audio_i_heard_pt" : "audio_i_heard_es";
      await send(waId, t(feedbackLang, heardKey, { transcript }));
      await new Promise(r => setTimeout(r, 500));
      
      // Increment attempts
      state.data.audio_practice = {
        target_sentence: audioPractice.target_sentence,
        target_translation: audioPractice.target_translation || "",
        attempts: (audioPractice.attempts || 0) + 1,
      };
      await updateState(supabase, waId, state.step, state.data);
      
      // Give a short hint and ask to retry
      const retryMsg = feedbackLang === "pt"
        ? `🔄 Quase! Tente de novo:\n\n🔁 *"${audioPractice.target_sentence}"*\n\n_Fale devagar e claro._`
        : `🔄 ¡Casi! Inténtalo de nuevo:\n\n🔁 *"${audioPractice.target_sentence}"*\n\n_Habla despacio y claro._`;
      await send(waId, retryMsg);
      
      return true;
    }
  }
  
  // Step 6: No pending target - this is a new conversational audio
  // Send "Eu ouvi" / "Escuché" message first
  const heardKey = feedbackLang === "pt" ? "audio_i_heard_pt" : "audio_i_heard_es";
  await send(waId, t(feedbackLang, heardKey, { transcript }));
  await new Promise(r => setTimeout(r, 500));
  
  // Step 7: Generate AI feedback with corrections
  const feedback = await generateConversationalAudioFeedback(transcript, feedbackLang);
  
  if (feedback) {
    // Build fixes string - include up to 3 fixes
    const fixesList = [feedback.fix1, feedback.fix2, feedback.fix3]
      .filter((f): f is string => !!f && f.trim().length > 0);
    
    // Determine target sentence
    const targetSentence = feedback.target_sentence || feedback.english_natural.split(".")[0].trim();
    
    // Store rich translation payload for TRADUCAO command
    state.data.last_translation_payload = {
      target_en: targetSentence,
      translation_native: feedback.translation_target || "",
      corrected_en: feedback.english_correct,
      corrected_native: feedback.translation_correct || "",
      natural_en: feedback.english_natural,
      natural_native: feedback.translation_natural || "",
      explanation: feedback.explanation_native || "",
      tip: fixesList[0] || "",
    };
    
    // Check if transcript is already correct/natural (avoid redundant feedback)
    const normalizedTranscript = normalizeForScoring(transcript);
    const normalizedCorrect = normalizeForScoring(feedback.english_correct);
    const normalizedNatural = normalizeForScoring(feedback.english_natural);
    
    const isAlreadyCorrect = normalizedTranscript === normalizedCorrect || 
                              normalizedTranscript === normalizedNatural ||
                              calculateAudioScore(feedback.english_correct, transcript).score >= 0.95;
    
    if (isAlreadyCorrect && fixesList.length === 0) {
      // User's English was already perfect - confirm and give next target
      const perfectMsg = feedbackLang === "pt"
        ? `✅ *Perfeito!* 🌟\n\n🔁 Agora repete:\n*"${targetSentence}"*`
        : `✅ *¡Perfecto!* 🌟\n\n🔁 Ahora repite:\n*"${targetSentence}"*`;
      await send(waId, perfectMsg);
    } else {
      // Build fixes
      const fixes = fixesList.map(f => `• ${f}`).join("\n");
      
      // Build rich feedback - shorter, more professional (BeConfident-style)
      const correctionBlock = feedbackLang === "pt"
        ? `✏️ *Correção:*\n🇺🇸 "${feedback.english_correct}"`
        : `✏️ *Corrección:*\n🇺🇸 "${feedback.english_correct}"`;
      
      const naturalBlock = feedback.english_natural !== feedback.english_correct
        ? (feedbackLang === "pt"
          ? `\n\n💬 *Mais natural:*\n🇺🇸 "${feedback.english_natural}"`
          : `\n\n💬 *Más natural:*\n🇺🇸 "${feedback.english_natural}"`)
        : "";
      
      const fixesBlock = fixes
        ? (feedbackLang === "pt" ? `\n\n🔍 *Correções:*\n${fixes}` : `\n\n🔍 *Correcciones:*\n${fixes}`)
        : "";

      const explanationBlock = feedback.explanation_native
        ? `\n\n💡 ${feedback.explanation_native}`
        : "";
      
      const repeatBlock = feedbackLang === "pt"
        ? `\n\n🔁 *Repete:*\n*"${targetSentence}"*`
        : `\n\n🔁 *Repite:*\n*"${targetSentence}"*`;
      
      const fullMsg = `${correctionBlock}${naturalBlock}${fixesBlock}${explanationBlock}${repeatBlock}`;
      await send(waId, fullMsg);
    }
    
    // Send interactive translation button
    if (feedbackLang !== "en") {
      await new Promise(r => setTimeout(r, 300));
      await sendTranslationButton(waId, feedbackLang as Language);
    }
    
    // Save the target sentence for next audio check and for "Ver tradução"
    state.data.audio_practice = {
      target_sentence: targetSentence,
      target_translation: feedback.translation_target || "",
      attempts: 0,
    };
    state.data.last_target = {
      en: targetSentence,
      translation: feedback.translation_target || "",
    };
    await updateState(supabase, waId, state.step, state.data);
  } else {
    // Fallback: AI failed to generate feedback — ask to resend, NEVER praise generically
    const fallbackMsg = feedbackLang === "pt" 
      ? "⚠️ Não consegui analisar seu áudio. Reenvie um áudio de 2-15 segundos em local silencioso."
      : "⚠️ No pude analizar tu audio. Reenvía un audio de 2-15 segundos en un lugar silencioso.";
    await send(waId, fallbackMsg);
  }
  
  return true;
}

async function evaluateWrittenProduction(text: string, lang: Language): Promise<{ score: number; notes: string }> {
  const feedbackLang = lang === "en" ? "English" : lang === "pt" ? "Portuguese" : "Spanish";
  const systemPrompt = `You are an English evaluator. Evaluate the following text written by a student.

CRITERIA:
- Basic grammar correct
- Appropriate vocabulary
- Message clarity
- Communicative effort

Return ONLY JSON:
{"score": 1-5, "notes": "short feedback in ${feedbackLang}, max 2 lines"}`;

  const response = await callAI(systemPrompt, text);

  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      const result = JSON.parse(match[0]);
      return {
        score: Math.min(5, Math.max(1, Number(result.score) || 3)),
        notes: String(result.notes || (lang === "pt" ? "Bom esforço." : lang === "es" ? "Buen esfuerzo." : "Good effort."))
      };
    }
  } catch (e) {
    console.error("[AI] Parse error:", e);
  }

  // Fallback: simple heuristic
  const words = text.split(/\s+/).length;
  const hasCapital = /[A-Z]/.test(text);
  const hasPeriod = /[.!?]/.test(text);
  let score = 3;
  if (words >= 10) score++;
  if (hasCapital && hasPeriod) score++;
  
  const fallbackNotes = {
    pt: "Obrigado pela sua resposta. Continue praticando!",
    es: "Gracias por tu respuesta. ¡Sigue practicando!",
    en: "Thanks for your response. Keep practicing!",
  };
  
  return { score: Math.min(5, score), notes: fallbackNotes[lang] };
}

async function evaluateExerciseAnswer(
  exercise: LessonExercise,
  userAnswer: string,
  lang: Language
): Promise<{ correct: boolean; feedback: string }> {
  const normalizedAnswer = userAnswer.trim().toLowerCase().replace(/[.,!?]/g, "");
  const normalizedCorrect = exercise.correct_answer.toLowerCase().replace(/[.,!?]/g, "");

  // For multiple choice, compare directly
  if (exercise.type === "choose_correct" && exercise.options) {
    const isCorrect = normalizedAnswer === normalizedCorrect || 
                      userAnswer.toUpperCase() === exercise.correct_answer.toUpperCase();
    
    if (isCorrect) {
      return {
        correct: true,
        feedback: exercise.feedback_correct?.[lang] || t(lang, "correct_exact")
      };
    } else {
      const hint = exercise.hint?.[lang] || "";
      return {
        correct: false,
        feedback: exercise.feedback_wrong?.[lang] || t(lang, "wrong_answer", { answer: exercise.correct_answer, hint })
      };
    }
  }

  // For fill_in_blank and others, be flexible
  const isClose = normalizedAnswer.includes(normalizedCorrect) || 
                  normalizedCorrect.includes(normalizedAnswer) ||
                  normalizedAnswer === normalizedCorrect;

  if (isClose) {
    return { correct: true, feedback: t(lang, "correct") };
  }

  // Try with AI for more complex answers
  const feedbackLang = lang === "en" ? "English" : lang === "pt" ? "Portuguese" : "Spanish";
  const systemPrompt = `Evaluate if the student's answer is acceptable. Be a thorough coach.

EXERCISE: ${exercise.prompt}
EXPECTED ANSWER: ${exercise.correct_answer}
STUDENT'S ANSWER: ${userAnswer}

RULES:
- Be flexible with minor spelling errors
- If the answer is wrong, explain WHY in 1 clear sentence (in ${feedbackLang})
- Include the correct answer in your feedback
- If there are multiple errors, mention at least 2

Return ONLY JSON: {"correct": true/false, "feedback": "1-2 lines in ${feedbackLang}, include correct answer if wrong"}`;

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

  const hint = exercise.hint?.[lang] || "";
  return {
    correct: false,
    feedback: t(lang, "expected_answer", { answer: exercise.correct_answer, hint })
  };
}

// ============== CLASSIC GRAMMAR ERROR DETECTION ==============

interface ClassicGrammarRule {
  id: string;
  rule_pt: string;
  rule_es: string;
  example_pt: string;
  example_es: string;
}

const CLASSIC_GRAMMAR_RULES: Record<string, ClassicGrammarRule> = {
  doesnt_vs_dont: {
    id: "doesnt_vs_dont",
    rule_pt: "Com *he / she / it* usamos *DOESN'T*, não *DON'T*.",
    rule_es: "Con *he / she / it* usamos *DOESN'T*, no *DON'T*.",
    example_pt: "✅ He *doesn't* work. ❌ He *don't* work.",
    example_es: "✅ He *doesn't* work. ❌ He *don't* work.",
  },
  third_person_s: {
    id: "third_person_s",
    rule_pt: "Na 3ª pessoa (he/she/it) o verbo recebe *-s* no presente simples.",
    rule_es: "En 3ª persona (he/she/it) el verbo lleva *-s* en presente simple.",
    example_pt: "✅ She *works*. ❌ She *work*.",
    example_es: "✅ She *works*. ❌ She *work*.",
  },
  doesnt_base_verb: {
    id: "doesnt_base_verb",
    rule_pt: "Depois de *doesn't* o verbo volta à forma base — sem *-s*.",
    rule_es: "Después de *doesn't* el verbo vuelve a la forma base — sin *-s*.",
    example_pt: "✅ She doesn't *like*. ❌ She doesn't *likes*.",
    example_es: "✅ She doesn't *like*. ❌ She doesn't *likes*.",
  },
  do_does_question: {
    id: "do_does_question",
    rule_pt: "Perguntas com he/she/it usam *DOES*, não *DO*.",
    rule_es: "Preguntas con he/she/it usan *DOES*, no *DO*.",
    example_pt: "✅ *Does* she work? ❌ *Do* she work?",
    example_es: "✅ *Does* she work? ❌ *Do* she work?",
  },
};

/**
 * Detects classic grammar errors in a wrong answer.
 * Returns the rule ID if a classic error is found, null otherwise.
 * Only checks non-MCQ exercises.
 */
function detectClassicGrammarError(
  exercise: LessonExercise,
  userAnswer: string,
): string | null {
  if (exercise.type === "choose_correct") return null;

  const ua = userAnswer.toLowerCase().trim();

  // don't vs doesn't: user wrote don't but correct answer needs doesn't
  if (
    (exercise.correct_answer.toLowerCase().includes("doesn't") ||
      exercise.correct_answer.toLowerCase().includes("does not")) &&
    (ua.includes("don't") || ua.includes("do not"))
  ) {
    return "doesnt_vs_dont";
  }

  // doesn't + verb+s: e.g. "doesn't works"
  if (/doesn'?t\s+\w+(s|es)\b/.test(ua)) {
    return "doesnt_base_verb";
  }

  // 3rd person -s missing
  if (exercise.mistake_tag === "third_person_s") {
    const correctHasS = /\b(he|she|it)\s+\w+(s|es)\b/i.test(exercise.correct_answer);
    const userMissingS =
      /\b(he|she|it)\s+\w+\b/i.test(ua) &&
      !/\b(he|she|it)\s+\w+(s|es)\b/i.test(ua);
    if (correctHasS && userMissingS) return "third_person_s";
  }

  // do vs does in question
  if (
    exercise.correct_answer.toLowerCase().startsWith("does") &&
    ua.startsWith("do ")
  ) {
    return "do_does_question";
  }

  return null;
}

/**
 * Builds a short grammar micro-explanation for a detected classic rule.
 */
function buildGrammarMicroExplanation(ruleId: string, lang: Language): string {
  const rule = CLASSIC_GRAMMAR_RULES[ruleId];
  if (!rule) return "";

  const ruleText = lang === "pt" ? rule.rule_pt : rule.rule_es;
  const exampleText = lang === "pt" ? rule.example_pt : rule.example_es;
  const header = lang === "pt" ? "🔎 *Regra rápida:*" : "🔎 *Regla rápida:*";
  const exampleLabel = lang === "pt" ? "📌 *Exemplo:*" : "📌 *Ejemplo:*";

  return `\n\n${header} ${ruleText}\n${exampleLabel} ${exampleText}`;
}

/**
 * Builds a structured error feedback message for a wrong exercise answer.
 * Format:
 *   ❌ Você disse: "..."
 *   ✅ Forma correta: "..."
 *   🔎 Por quê: <1 rule line>
 *   🌐 Tradução: "..."
 *   🔁 Repete: "..." / "<translation>"
 */
function buildStructuredErrorFeedback(params: {
  userAnswer: string;
  correctAnswer: string;
  translation: string;
  grammarRuleId: string | null;
  lang: Language;
}): string {
  const { userAnswer, correctAnswer, translation, grammarRuleId, lang } = params;

  const labels = {
    heard: lang === "pt" ? "❌ *Você disse:*" : "❌ *Dijiste:*",
    correct: lang === "pt" ? "✅ *Forma correta:*" : "✅ *Forma correcta:*",
    why: lang === "pt" ? "🔎 *Por quê:*" : "🔎 *Por qué:*",
    translation: lang === "pt" ? "🌐 *Tradução:*" : "🌐 *Traducción:*",
    repeat: lang === "pt" ? "🔁 *Repete:*" : "🔁 *Repite:*",
  };

  const lines: string[] = [
    `${labels.heard} _"${userAnswer}"_`,
    `${labels.correct} *"${correctAnswer}"*`,
  ];

  if (grammarRuleId) {
    const rule = CLASSIC_GRAMMAR_RULES[grammarRuleId];
    if (rule) {
      const ruleText = lang === "pt" ? rule.rule_pt : rule.rule_es;
      lines.push(`${labels.why} ${ruleText}`);
    }
  }

  if (translation) {
    lines.push(`${labels.translation} _"${translation}"_`);
  }

  lines.push(`${labels.repeat} *"${correctAnswer}"*`);

  return lines.join("\n");
}

// ============== SHADOWING EXERCISE HANDLER ==============

/**
 * Sends a shadowing (pronunciation drill) exercise.
 * Plays a phrase audio from storage if available, then shows target sentence.
 */
async function sendShadowingExercise(
  waId: string,
  exercise: LessonExercise,
  lang: Language,
  current: number,
  total: number,
): Promise<void> {
  const header = lang === "pt"
    ? `🎤 *Exercício ${current}/${total} — Pronúncia*\n\n`
    : `🎤 *Ejercicio ${current}/${total} — Pronunciación*\n\n`;

  const targetLine = `🗣 *"${exercise.correct_answer}"*`;

  const instruction = lang === "pt"
    ? "\n\n🎧 Ouça e repita. *Grave seu áudio* agora!"
    : "\n\n🎧 Escucha y repite. ¡*Graba tu audio* ahora!";

  // Map exercise to a phrase audio asset. Default based on day prefix.
  const phraseAssetKey: AudioAssetKey = exercise.id.startsWith("d1")
    ? "PHRASE_NICE_TO_MEET_YOU_01"
    : "PHRASE_HELLO_01";

  const audioResult = await sendBotAudio(waId, phraseAssetKey);
  if (audioResult.ok) {
    await new Promise(r => setTimeout(r, 600));
  } else if (audioResult.reason === "storage_404") {
    const unavailableMsg = lang === "pt"
      ? "⚠️ Áudio indisponível no momento."
      : "⚠️ Audio no disponible en este momento.";
    await send(waId, unavailableMsg);
  }

  await send(waId, `${header}${targetLine}${instruction}`);
}

/**
 * Handles the student's audio reply to a shadowing exercise.
 * Returns true = stay in shadowing (retry), false = advance to next exercise.
 */
async function handleShadowingAnswer(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData },
  lang: Language,
  audioData: { media_id: string; mime_type?: string },
): Promise<boolean> {
  const audioPractice = state.data.audio_practice;
  if (!audioPractice) return false;

  const transcriptionResult = await processAudioMessage(
    supabase,
    waId,
    audioData.media_id,
    audioData.mime_type,
    state.step,
  );

  if (!transcriptionResult.success || !transcriptionResult.transcript.trim()) {
    await sendBotAudio(waId, "COACH_AUDIO_NOT_CLEAR_01");
    await new Promise(r => setTimeout(r, 600));
    const msg = lang === "pt"
      ? "🎤 Não consegui entender. Tente de novo, mais perto do microfone."
      : "🎤 No pude entender. Inténtalo de nuevo, más cerca del micrófono.";
    await send(waId, msg);
    return true;
  }

  const transcript = transcriptionResult.transcript;
  const { label } = calculateAudioScore(audioPractice.target_sentence, transcript);
  const attempts = (audioPractice.attempts || 0) + 1;

  if (label === "correct" || label === "close") {
    await sendBotAudio(waId, "COACH_GREAT_JOB_01");
    await new Promise(r => setTimeout(r, 600));
    const successMsg = lang === "pt"
      ? "✅ *Ótimo!* Pronúncia ok. 👏"
      : "✅ *¡Excelente!* Pronunciación ok. 👏";
    await send(waId, successMsg);
    state.data.audio_practice = undefined;
    await updateState(supabase, waId, state.step, state.data);
    return false; // advance
  }

  if (attempts >= 2) {
    state.data.audio_practice = undefined;
    await updateState(supabase, waId, state.step, state.data);
    const moveOnMsg = lang === "pt"
      ? `🔁 *"${audioPractice.target_sentence}"* — Continue praticando! Avançando. 💪`
      : `🔁 *"${audioPractice.target_sentence}"* — ¡Sigue practicando! Avancemos. 💪`;
    await send(waId, moveOnMsg);
    return false; // advance
  }

  await sendBotAudio(waId, "COACH_TRY_AGAIN_01");
  await new Promise(r => setTimeout(r, 600));
  state.data.audio_practice = {
    target_sentence: audioPractice.target_sentence,
    target_translation: audioPractice.target_translation,
    attempts,
  };
  await updateState(supabase, waId, state.step, state.data);
  const retryMsg = lang === "pt"
    ? `🔄 *Eu ouvi:* _"${transcript}"_\n\nTente de novo:\n🗣 *"${audioPractice.target_sentence}"*\n\n_Fale devagar e claro._`
    : `🔄 *Escuché:* _"${transcript}"_\n\nInténtalo de nuevo:\n🗣 *"${audioPractice.target_sentence}"*\n\n_Habla despacio y claro._`;
  await send(waId, retryMsg);
  return true;
}

// ============== LANGUAGE FUNCTIONS ==============

function parseLanguageChoice(input: string): Language | null {
  const lower = input.toLowerCase().trim();
  
  // Direct language selection: 1, 2, 3
  if (lower === "1") return "pt";
  if (lower === "2") return "es";
  if (lower === "3") return "en";
  
  // Language names
  if (lower === "pt" || lower === "br" || lower === "português" || lower === "portugues" || lower === "portuguese") return "pt";
  if (lower === "es" || lower === "español" || lower === "espanol" || lower === "spanish") return "es";
  if (lower === "en" || lower === "english" || lower === "ingles" || lower === "ingles") return "en";
  
  return null;
}

function isLanguageCommand(input: string): boolean {
  const lower = input.toLowerCase().trim();
  return ["idioma", "language", "lang"].includes(lower) || parseLanguageChoice(lower) !== null;
}

async function handleLanguageChange(
  supabase: SupabaseClientType,
  waId: string,
  input: string,
  currentLang: Language | null
): Promise<{ handled: boolean; newLang?: Language }> {
  const lower = input.toLowerCase().trim();
  
  // If user typed "idioma", "language", or "lang", show picker
  if (["idioma", "language", "lang"].includes(lower)) {
    await send(waId, t(currentLang, "language_picker"));
    return { handled: true };
  }
  
  // Try to parse direct language selection
  const newLang = parseLanguageChoice(input);
  if (newLang) {
    const showTranslations = newLang !== "en"; // EN doesn't show translations by default
    await updateUserLanguage(supabase, waId, newLang, showTranslations);
    
    await trackEvent(supabase, waId, "language_selected", {
      language: newLang,
      source: "command",
      raw_input: input,
    });
    
    const confirmKey = `language_confirm_${newLang}`;
    await send(waId, t(newLang, confirmKey));
    
    return { handled: true, newLang };
  }
  
  return { handled: false };
}

// ============== AUDIO PREFERENCE COMMANDS ==============

async function handleAudioPreferenceCommand(
  supabase: SupabaseClientType,
  waId: string,
  input: string,
  lang: Language
): Promise<boolean> {
  const lower = input.toLowerCase().trim();
  
  if (lower === "audio on") {
    await updateUserAudioPreference(supabase, waId, true);
    await send(waId, t(lang, "audio_on_confirmed"));
    return true;
  }
  
  if (lower === "audio off") {
    await updateUserAudioPreference(supabase, waId, false);
    await send(waId, t(lang, "audio_off_confirmed"));
    return true;
  }
  
  return false;
}

// ============== PLACEMENT TEST FLOW (MVP1) ==============

async function startPlacement(supabase: SupabaseClientType, waId: string, data: StateData, lang: Language): Promise<void> {
  await trackEvent(supabase, waId, "placement_started", {});

  const placement: PlacementState = {
    part: 1,
    question_index: 0,
    mcq_answers: [],
    mcq_score: 0
  };

  await updateState(supabase, waId, "placement_q1", { ...data, placement });
  await send(waId, t(lang, "placement_intro"));
  
  await new Promise(r => setTimeout(r, 1000));
  await send(waId, PLACEMENT_QUESTIONS[0].question[lang]);
}

async function handlePlacementQuestion(
  supabase: SupabaseClientType,
  waId: string,
  answer: string,
  state: { step: string; data: StateData },
  lang: Language,
  audioData?: { media_id: string; mime_type?: string },
  isAdmin: boolean = false
): Promise<void> {
  // Auto-init placement if missing (e.g. after /admin reset or /admin step)
  if (!state.data.placement) {
    const stepIndex = state.step === "placement_q1" ? 0 
                    : state.step === "placement_q2" ? 1 
                    : 2;
    state.data.placement = {
      part: 1,
      question_index: stepIndex,
      mcq_answers: [],
      mcq_score: 0,
    };
    await updateState(supabase, waId, state.step, state.data);
  }
  const placement = state.data.placement;
  const qIndex = placement.question_index;
  const question = PLACEMENT_QUESTIONS[qIndex];
  
  let actualAnswer = answer;
  let transcript = "";
  let requestId = "";
  
  // Handle audio input
  if (audioData) {
    const transcriptionResult = await processAudioMessage(
      supabase,
      waId,
      audioData.media_id,
      audioData.mime_type,
      state.step
    );
    
    if (!transcriptionResult.success) {
      // Handle rate limit specially
      if (transcriptionResult.error === "rate_limit") {
        await send(waId, t(lang, "audio_transcription_rate_limit"));
      } else {
        await send(waId, t(lang, "audio_transcription_failed"));
      }
      return;
    }
    
    transcript = transcriptionResult.transcript;
    requestId = transcriptionResult.request_id || "";
    
    // Show transcript
    await send(waId, t(lang, "audio_transcript_header", { transcript }));
    await new Promise(r => setTimeout(r, 400));
    
    // Extract MCQ answer from transcript
    const mcqAnswer = extractMCQFromTranscript(transcript);
    if (mcqAnswer) {
      actualAnswer = mcqAnswer;
    } else {
      // Couldn't extract a clear letter - show prompt again
      await send(waId, t(lang, "answer_abcd"));
      
      // Admin debug info
      if (isAdmin) {
        await send(waId, t(lang, "admin_audio_debug", {
          request_id: requestId,
          step: state.step,
          transcript: transcript,
        }));
      }
      return;
    }
  }
  
  const normalized = actualAnswer.toUpperCase().trim();

  if (!["A", "B", "C", "D"].includes(normalized)) {
    await send(waId, t(lang, "answer_abcd"));
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
    feedback: isCorrect ? question.feedback_correct[lang] : question.feedback_wrong[lang],
    input_type: audioData ? "audio" : "text",
    transcript: transcript || null,
  });

  // Give immediate feedback
  await send(waId, isCorrect ? question.feedback_correct[lang] : question.feedback_wrong[lang]);
  await new Promise(r => setTimeout(r, 800));

  if (qIndex < PLACEMENT_QUESTIONS.length - 1) {
    // Next question
    placement.question_index++;
    await updateState(supabase, waId, `placement_q${qIndex + 2}`, { ...state.data, placement });
    await send(waId, PLACEMENT_QUESTIONS[qIndex + 1].question[lang]);
  } else {
    // End Part 1, start Part 2
    placement.part = 2;
    await updateState(supabase, waId, "placement_written", { ...state.data, placement });
    await send(waId, t(lang, "part1_complete"));
  }
}

async function handlePlacementWritten(
  supabase: SupabaseClientType,
  waId: string,
  text: string,
  state: { step: string; data: StateData },
  lang: Language,
  audioData?: { media_id: string; mime_type?: string },
  isAdmin: boolean = false
): Promise<void> {
  if (!state.data.placement) {
    state.data.placement = {
      part: 2, question_index: 3,
      mcq_answers: [], mcq_score: 0,
    };
    await updateState(supabase, waId, state.step, state.data);
  }
  const placement = state.data.placement!;
  
  let actualText = text;
  let transcript = "";
  let requestId = "";
  
  // Handle audio input
  if (audioData) {
    const transcriptionResult = await processAudioMessage(
      supabase,
      waId,
      audioData.media_id,
      audioData.mime_type,
      state.step
    );
    
    if (!transcriptionResult.success) {
      if (transcriptionResult.error === "rate_limit") {
        await send(waId, t(lang, "audio_transcription_rate_limit"));
      } else {
        await send(waId, t(lang, "audio_transcription_failed"));
      }
      return;
    }
    
    transcript = transcriptionResult.transcript;
    requestId = transcriptionResult.request_id || "";
    actualText = transcript;
    
    // Show transcript
    await send(waId, t(lang, "audio_transcript_header", { transcript }));
    await new Promise(r => setTimeout(r, 400));
    
    // Admin debug
    if (isAdmin) {
      await send(waId, t(lang, "admin_audio_debug", {
        request_id: requestId,
        step: state.step,
        transcript: transcript,
      }));
    }
  }
  
  // Evaluate text
  const evaluation = await evaluateWrittenProduction(actualText, lang);
  
  placement.written_text = actualText;
  placement.written_score = evaluation.score;

  await trackEvent(supabase, waId, "placement_written_submitted", {
    text: actualText.slice(0, 1000),
    score: evaluation.score,
    notes: evaluation.notes,
    input_type: audioData ? "audio" : "text",
    transcript: transcript || null,
  });

  await send(waId, `✅ ${evaluation.notes}`);
  await new Promise(r => setTimeout(r, 800));

  // Part 3: Optional audio
  placement.part = 3;
  await updateState(supabase, waId, "placement_audio", { ...state.data, placement });
  
  await send(waId, t(lang, "part3_audio"));
}

async function handlePlacementAudio(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData },
  lang: Language,
  audioData?: { media_id: string }
): Promise<void> {
  if (!state.data.placement) {
    state.data.placement = {
      part: 3, question_index: 3,
      mcq_answers: [], mcq_score: 0,
    };
    await updateState(supabase, waId, state.step, state.data);
  }
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

    await send(waId, t(lang, "audio_received"));
  } else {
    placement.audio_received = false;
    await send(waId, t(lang, "skip_audio"));
  }

  await new Promise(r => setTimeout(r, 500));
  await finishPlacement(supabase, waId, state, lang);
}

async function finishPlacement(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData },
  lang: Language
): Promise<void> {
  if (!state.data.placement) {
    state.data.placement = {
      part: 4, question_index: 3,
      mcq_answers: [], mcq_score: 0,
      written_text: "", written_score: 3,
    };
    await updateState(supabase, waId, state.step, state.data);
  }
  const placement = state.data.placement!;
  
  // Calculate level based on score
  let totalScore = placement.mcq_score;
  if (placement.written_score && placement.written_score >= 4) totalScore++;
  if (placement.audio_received) totalScore++;
  
  const cefrLevel = LEVEL_MAPPING[Math.min(6, totalScore)] || "A1";
  const internalLevel = LEVEL_TO_INTERNAL[cefrLevel];

  // Determine strengths and weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  const q1Correct = placement.mcq_answers[0]?.correct;
  const q2Correct = placement.mcq_answers[1]?.correct;
  const q3Correct = placement.mcq_answers[2]?.correct;

  const strengthsMap: Record<Language, string[]> = {
    pt: ["Uso de tempos verbais básicos", "Preposições e colocações", "Estrutura de orações", "Produção escrita"],
    es: ["Uso de tiempos verbales básicos", "Preposiciones y colocaciones", "Estructura de oraciones", "Producción escrita"],
    en: ["Basic verb tense usage", "Prepositions and collocations", "Sentence structure", "Written production"],
  };
  
  const weaknessesMap: Record<Language, string[]> = {
    pt: ["Tempos verbais em contexto", "Preposições e expressões fixas", "Ordem das palavras e negações", "Prática de escrita"],
    es: ["Tiempos verbales en contexto", "Preposiciones y expresiones fijas", "Orden de palabras y negaciones", "Práctica de escritura"],
    en: ["Verb tenses in context", "Prepositions and fixed expressions", "Word order and negations", "Writing practice"],
  };

  if (q1Correct) strengths.push(strengthsMap[lang][0]);
  else weaknesses.push(weaknessesMap[lang][0]);

  if (q2Correct) strengths.push(strengthsMap[lang][1]);
  else weaknesses.push(weaknessesMap[lang][1]);

  if (q3Correct) strengths.push(strengthsMap[lang][2]);
  else weaknesses.push(weaknessesMap[lang][2]);

  if (placement.written_score && placement.written_score >= 4) {
    strengths.push(strengthsMap[lang][3]);
  } else {
    weaknesses.push(weaknessesMap[lang][3]);
  }

  // Save level
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

  // Initialize progress for 7-day Plan
  const progress: LessonProgress = {
    current_day: getStartingDayForLevel(internalLevel),
    current_exercise_index: 0,
    day_score: 0,
    day_attempts: 0,
    exercises_completed: 0,
    total_lessons_completed: 0,
    detected_level: internalLevel,
    goal: "general" as LearningGoal,
    onboarding_complete: false,
    trial: initTrial(),
    mistake_tags: []
  };

  await updateState(supabase, waId, "placement_result", { 
    ...state.data, 
    placement: undefined,
    progress 
  });

  // Show result
  const resultHeader = {
    pt: `🎓 *Resultado do Teste de Nível!*\n\n📊 *Seu nível: ${cefrLevel} — ${LEVEL_NAMES[internalLevel][lang]}*`,
    es: `🎓 *¡Resultado del Placement Test!*\n\n📊 *Tu nivel: ${cefrLevel} — ${LEVEL_NAMES[internalLevel][lang]}*`,
    en: `🎓 *Placement Test Result!*\n\n📊 *Your level: ${cefrLevel} — ${LEVEL_NAMES[internalLevel][lang]}*`,
  };
  
  const strengthsLabel = { pt: "✅ *Pontos fortes:*", es: "✅ *Puntos fuertes:*", en: "✅ *Strengths:*" };
  const weaknessesLabel = { pt: "📈 *Para melhorar:*", es: "📈 *Por mejorar:*", en: "📈 *To improve:*" };
  
  await send(waId,
    `${resultHeader[lang]}\n\n` +
    `${strengthsLabel[lang]}\n${strengths.map(s => `• ${s}`).join("\n")}\n\n` +
    `${weaknessesLabel[lang]}\n${weaknesses.map(w => `• ${w}`).join("\n")}`
  );

  await new Promise(r => setTimeout(r, 1200));

  const planIntro = {
    pt: `🚀 *Seu Plano Recomendado: 7 dias*\n\n• 7 lições estruturadas\n• Exercícios interativos diários\n• Produção escrita e oral\n• Checkpoints de progresso\n\nEscreva *NEXT* para começar o Dia 1 🎯`,
    es: `🚀 *Tu Plan Recomendado: 7 días*\n\n• 7 lecciones estructuradas\n• Ejercicios interactivos diarios\n• Producción escrita y oral\n• Checkpoints de progreso\n\nEscribe *NEXT* para empezar el Día 1 🎯`,
    en: `🚀 *Your Recommended Plan: 7 days*\n\n• 7 structured lessons\n• Daily interactive exercises\n• Written and oral production\n• Progress checkpoints\n\nType *NEXT* to start Day 1 🎯`,
  };
  
  await send(waId, planIntro[lang]);
}

// ============== DAY LESSON FLOW (MVP2) ==============

async function startDayLesson(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData },
  lang: Language
): Promise<void> {
  const progress = state.data.progress!;
  const day = progress.current_day;
  const lesson = await getLessonForProgress(state, lang);

  progress.current_exercise_index = 0;
  progress.day_score = 0;
  progress.day_attempts = 0;

  await trackEvent(supabase, waId, "lesson_started", {
    lesson_id: lesson.lesson_id,
    day
  });

  await updateState(supabase, waId, "day_intro", { ...state.data, progress });

  const trialInfo = getTrialProgress(progress.trial!);
  
  const objectivesList = lesson.objectives[lang].map(o => `• ${o}`).join("\n");

  await send(waId, t(lang, "day_header", {
    day: String(day),
    title: lesson.title[lang],
    objectives: objectivesList,
    lessons_left: String(trialInfo.lessonsLeft),
  }));

  await new Promise(r => setTimeout(r, 1000));
  await sendExercise(supabase, waId, state, lesson.exercises[0], lang);
}

async function sendExercise(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData },
  exercise: LessonExercise,
  lang: Language
): Promise<void> {
  const progress = state.data.progress!;
  const day = await getLessonForProgress(state, lang);
  const total = day.exercises.length;
  const current = progress.current_exercise_index + 1;
  const showTranslations = lang !== "en"; // Show translations for PT/ES

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

  // Build prompt with optional translation
  let fullPrompt = exercise.prompt;
  if (showTranslations && exercise.prompt_translation && lang !== "en") {
    const translation = exercise.prompt_translation[lang as "pt" | "es"];
    if (translation) {
      fullPrompt += `\n\n${translation}`;
    }
  }

  // Track exercise shown
  await trackEvent(supabase, waId, "exercise_shown", {
    exercise_id: exercise.id,
    has_translation: showTranslations && !!exercise.prompt_translation,
    lang,
  });

  // Save last_target and translation payload for "TRADUCAO" command
  // NOTE: translation_native is left empty here and generated on-demand
  // when the user clicks "Ver Tradução" — avoids extra AI call per exercise.
  if (exercise.correct_answer) {
    state.data.last_target = {
      en: exercise.correct_answer,
      translation: "", // filled on-demand in TRADUCAO handler
    };
    state.data.last_translation_payload = {
      target_en: exercise.correct_answer,
      translation_native: "", // filled on-demand in TRADUCAO handler
      explanation: exercise.hint?.[lang] || "",
    };
    await updateState(supabase, waId, "lesson_exercise", state.data);
  }

  // ---- SHADOWING: special handling for pronunciation drill ----
  if (exercise.type === "shadowing") {
    // Store target in audio_practice so handler knows it's a shadowing exercise
    state.data.audio_practice = {
      target_sentence: exercise.correct_answer,
      target_translation: exercise.prompt_translation?.[lang as "pt" | "es"] || "",
      attempts: 0,
    };
    await updateState(supabase, waId, "lesson_exercise", state.data);
    await sendShadowingExercise(waId, exercise, lang, current, total);
    return;
  }

  // Send coach audio before exercise prompt
  if (current === 1 && progress.current_day <= 3) {
    // First exercise: prefer new "repeat after me" asset, fallback to legacy
    const rmResult = await sendBotAudio(waId, "COACH_REPEAT_AFTER_ME_01");
    if (rmResult.ok) {
      await new Promise(r => setTimeout(r, 400));
    } else {
      const legacyResult = await sendBotAudio(waId, "AUDIO_COACH_REPEAT_AFTER_ME");
      if (legacyResult.ok) {
        await new Promise(r => setTimeout(r, 400));
      } else if (legacyResult.reason === "storage_404") {
        console.warn(`[AUDIO] repeat_after_me missing — bucket=${legacyResult.bucket} path=${legacyResult.path}`);
      }
    }
  } else {
    // Subsequent exercises: "Your turn" cue
    const ytResult = await sendBotAudio(waId, "COACH_YOUR_TURN_01");
    if (ytResult.ok) {
      await new Promise(r => setTimeout(r, 400));
    }
  }

  await send(waId, t(lang, "exercise_header", {
    emoji: emoji[exercise.type] || "📝",
    current: String(current),
    total: String(total),
    prompt: fullPrompt,
  }));

  // Send interactive translation button (replaces text CTA)
  if (showTranslations) {
    await new Promise(r => setTimeout(r, 300));
    await sendTranslationButton(waId, lang);
  }
}

async function handleExerciseAnswer(
  supabase: SupabaseClientType,
  waId: string,
  answer: string,
  state: { step: string; data: StateData },
  lang: Language,
  audioData?: { media_id: string; mime_type?: string },
  isAdmin: boolean = false
): Promise<void> {
  const progress = state.data.progress!;
  const day = await getLessonForProgress(state, lang);
  const exercise = day.exercises[progress.current_exercise_index];

  if (!exercise) {
    await startDayProduction(supabase, waId, state, lang);
    return;
  }

  // ---- SHADOWING: if audio_practice is active and user sent audio, handle drill ----
  if (exercise.type === "shadowing" && audioData && state.data.audio_practice) {
    const stayInShadowing = await handleShadowingAnswer(supabase, waId, state, lang, audioData);
    if (stayInShadowing) return; // wait for retry
    // Advance past the shadowing exercise
    progress.current_exercise_index++;
    progress.day_score++; // count shadowing as correct (effort-based)
    progress.day_attempts++;
    if (progress.current_exercise_index < day.exercises.length) {
      await sendExercise(supabase, waId, state, day.exercises[progress.current_exercise_index], lang);
    } else {
      await startDayProduction(supabase, waId, state, lang);
    }
    return;
  }

  // ---- SHADOWING: user sent text instead of audio ----
  if (exercise.type === "shadowing" && !audioData) {
    const promptMsg = lang === "pt"
      ? `🎤 Por favor, *grave um áudio* repetindo:\n\n🗣 *"${exercise.correct_answer}"*`
      : `🎤 Por favor, *graba un audio* repitiendo:\n\n🗣 *"${exercise.correct_answer}"*`;
    await send(waId, promptMsg);
    return;
  }

  let actualAnswer = answer;
  let transcript = "";
  let pronunciationTip = "";
  let requestId = "";
  let audioScoreData: { score: number; label: "correct" | "close" | "incorrect" } | null = null;

  // Handle audio input
  if (audioData) {
    const transcriptionResult = await processAudioMessage(
      supabase,
      waId,
      audioData.media_id,
      audioData.mime_type,
      state.step
    );
    
    if (!transcriptionResult.success) {
      if (transcriptionResult.error === "rate_limit") {
        await send(waId, t(lang, "audio_transcription_rate_limit"));
      } else {
        // Play "audio not clear" coach audio before text message
        await sendBotAudio(waId, "COACH_AUDIO_NOT_CLEAR_01");
        await new Promise(r => setTimeout(r, 600));
        await send(waId, t(lang, "audio_transcription_failed"));
      }
      return;
    }

    transcript = transcriptionResult.transcript;
    requestId = transcriptionResult.request_id || "";
    
    // Calculate Levenshtein score for non-MCQ exercises
    if (exercise.type !== "choose_correct") {
      audioScoreData = calculateAudioScore(exercise.correct_answer, transcript);
      
      // Update audio_received event with score
      await trackEvent(supabase, waId, "audio_received", {
        media_id: audioData.media_id,
        transcript_text: transcript,
        target_text: exercise.correct_answer,
        score_numeric: audioScoreData.score,
        score_label: audioScoreData.label,
        provider: "openai",
        request_id: requestId,
        step_at_time: state.step,
      });
    }
    
    // For MCQ, extract letter from transcript
    if (exercise.type === "choose_correct" && exercise.options) {
      const mcqAnswer = extractMCQFromTranscript(transcript);
      if (mcqAnswer) {
        actualAnswer = mcqAnswer;
      } else {
        actualAnswer = transcript;
      }
    } else {
      actualAnswer = transcript;
    }
  }

  // Evaluate answer
  const evaluation = await evaluateExerciseAnswer(exercise, actualAnswer, lang);

  // Update progress
  progress.day_attempts++;
  if (evaluation.correct) {
    progress.day_score++;
    progress.exercises_completed++;
  } else {
    // Track mistake
    const existingTag = progress.mistake_tags?.find(m => m.tag === exercise.mistake_tag);
    if (existingTag) {
      existingTag.count++;
      existingTag.last_seen = new Date().toISOString().slice(0, 10);
    } else {
      progress.mistake_tags = progress.mistake_tags || [];
      progress.mistake_tags.push({
        tag: exercise.mistake_tag,
        count: 1,
        last_seen: new Date().toISOString().slice(0, 10)
      });
    }
  }

  await trackEvent(supabase, waId, "exercise_answered", {
    exercise_id: exercise.id,
    answer: actualAnswer,
    correct: evaluation.correct,
    mistake_tag: evaluation.correct ? null : exercise.mistake_tag,
    input_type: audioData ? "audio" : "text",
    transcript: transcript,
    media_id: audioData?.media_id || null,
    audio_score: audioScoreData?.score || null,
    audio_score_label: audioScoreData?.label || null,
  });

  // Store translation payload for TRADUCAO command
  // Use correct_answer as target (not prompt_translation which translates the coach instruction)
  state.data.last_translation_payload = {
    target_en: exercise.correct_answer,
    translation_native: "", // filled on-demand or at error time below
    explanation: exercise.hint?.[lang] || "",
  };
  state.data.last_target = {
    en: exercise.correct_answer,
    translation: "", // filled on-demand
  };

  // Build response for audio input
  if (audioData && transcript) {
    // Show transcription first
    await send(waId, t(lang, "audio_transcript_header", { transcript }));
    await new Promise(r => setTimeout(r, 400));

    // Show correction
    await send(waId, evaluation.feedback);
    await new Promise(r => setTimeout(r, 400));

    // Generate and show pronunciation tip
    pronunciationTip = await generatePronunciationTip(exercise.correct_answer, transcript, lang);
    await send(waId, t(lang, "audio_pronunciation_tip", { tip: pronunciationTip }));
    await new Promise(r => setTimeout(r, 400));

    // Admin debug info with score
    if (isAdmin) {
      let debugMsg = t(lang, "admin_audio_debug", {
        request_id: requestId,
        step: state.step,
        transcript: transcript,
      });
      
      // Add score info for admin
      if (audioScoreData) {
        debugMsg += `\n📊 Score: ${audioScoreData.score.toFixed(2)} (${audioScoreData.label})`;
      }
      
      await send(waId, debugMsg);
    }

    // Send interactive translation button
    if (lang !== "en") {
      await sendTranslationButton(waId, lang);
    }

    // Show next step prompt
    if (evaluation.correct) {
      await send(waId, t(lang, "audio_next"));
    } else {
      await send(waId, t(lang, "audio_repeat"));
      await updateState(supabase, waId, state.step, state.data);
      return; // Don't advance to next exercise on audio error - let them retry
    }
  } else {
    // Regular text feedback
    if (!evaluation.correct) {
      // 1) Play generic correction audio (doesn't carry specific content)
      await sendBotAudio(waId, "COACH_CORRECTION_01");
      await new Promise(r => setTimeout(r, 500));

      // 2) Translate the CORRECT ANSWER (not the coach instruction)
      const correctAnswerTranslation = await translatePhrase(exercise.correct_answer, lang);

      // 3) Build and send structured error message
      const classicRuleId = detectClassicGrammarError(exercise, answer);
      const structuredFeedback = buildStructuredErrorFeedback({
        userAnswer: answer,
        correctAnswer: exercise.correct_answer,
        translation: correctAnswerTranslation,
        grammarRuleId: classicRuleId,
        lang,
      });
      await send(waId, structuredFeedback);

      // 4) Update payload with the translated correct answer for "Ver Tradução"
      state.data.last_translation_payload = {
        target_en: exercise.correct_answer,
        translation_native: correctAnswerTranslation,
        explanation: exercise.hint?.[lang] || "",
      };
      state.data.last_target = {
        en: exercise.correct_answer,
        translation: correctAnswerTranslation,
      };

      // 3) Optional: store state so user must retry once
      await updateState(supabase, waId, state.step, state.data);
      return; // Force retry — do NOT advance exercise on first error
    } else {
      await send(waId, evaluation.feedback);

      // Send interactive translation button
      if (lang !== "en") {
        await new Promise(r => setTimeout(r, 300));
        await sendTranslationButton(waId, lang);
      }
    }
  }

  await new Promise(r => setTimeout(r, 600));

  // Next exercise or production
  progress.current_exercise_index++;

  if (progress.current_exercise_index < day.exercises.length) {
    await sendExercise(supabase, waId, state, day.exercises[progress.current_exercise_index], lang);
  } else {
    await startDayProduction(supabase, waId, state, lang);
  }
}

async function startDayProduction(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData },
  lang: Language
): Promise<void> {
  const progress = state.data.progress!;
  const day = await getLessonForProgress(state, lang);

  // Extract model sentence from production prompt (text between _"..."_ or just clear the target)
  // Production is open-ended, so we clear the translation payload to avoid stale data.
  state.data.last_translation_payload = undefined;
  state.data.last_target = undefined;

  await updateState(supabase, waId, "day_production", { ...state.data, progress });

  await send(waId, day.production_prompt[lang]);
}

async function handleDayProduction(
  supabase: SupabaseClientType,
  waId: string,
  content: string,
  state: { step: string; data: StateData },
  user: UserData,
  lang: Language,
  isAudio: boolean = false,
  audioId?: string
): Promise<void> {
  const progress = state.data.progress!;
  const day = await getLessonForProgress(state, lang);

  let score = 3;
  let notes = lang === "pt" ? "Bom trabalho!" : lang === "es" ? "¡Buen trabajo!" : "Good job!";

  if (!isAudio && content.toUpperCase() !== "SKIP") {
    const evaluation = await evaluateWrittenProduction(content, lang);
    score = evaluation.score;
    notes = evaluation.notes;
  } else if (isAudio) {
    score = 4;
    notes = lang === "pt" ? "Excelente que você pratica o áudio! 🎤" : 
            lang === "es" ? "¡Excelente que practiques el audio! 🎤" : 
            "Excellent that you practice audio! 🎤";
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
    const scoreLabel = lang === "pt" ? "Pontuação" : lang === "es" ? "Puntuación" : "Score";
    await send(waId, `${notes}\n\n⭐ ${scoreLabel}: ${score}/5`);
    await new Promise(r => setTimeout(r, 600));
  }

  await finishDayLesson(supabase, waId, state, user, lang);
}

async function finishDayLesson(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData },
  user: UserData,
  lang: Language
): Promise<void> {
  const progress = state.data.progress!;
  const day = await getLessonForProgress(state, lang);
  
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
    const level = progress.detected_level ?? user.level ?? "beginner";
    const canContinueDynamically = isDynamicLessonLevel(level) && user.is_subscribed;

    await updateState(supabase, waId, "day_complete", { ...state.data, progress });
    
    // Check if Day 7 was just completed (current_day is now 8)
    if (day.day === 7 && !canContinueDynamically) {
      const subscribeLink = getSubscribeLink(waId, "day7_complete", lang);

      // Mark trial as completed
      await markTrialCompleted(supabase, waId, user, progress);
      
      await trackEvent(supabase, waId, "subscribe_link_opened", {
        source: "day7_complete",
        link: subscribeLink,
      });
      
      // Send celebration + mini-report + subscribe link
      await send(waId, t(lang, "plan_complete", {
        lessons: String(progress.total_lessons_completed),
        exercises: String(progress.exercises_completed),
        level: LEVEL_NAMES[user.level || "beginner"][lang],
        link: subscribeLink,
      }));
    } else {
      await send(waId, t(lang, "day_complete", {
        day: String(day.day),
        score: String(progress.day_score),
        attempts: String(progress.day_attempts),
        percent: String(Math.round(accuracy * 100)),
        next_day: String(progress.current_day),
      }));
    }
  } else {
    await updateState(supabase, waId, "day_failed", { ...state.data, progress });

    await send(waId, t(lang, "day_failed", {
      day: String(day.day),
      score: String(progress.day_score),
      attempts: String(progress.day_attempts),
      percent: String(Math.round(accuracy * 100)),
      passing: String(Math.round(PASSING_SCORE * 100)),
    }));
  }
}

// ============== REVIEW SYSTEM (MVP2) ==============

async function startReview(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData },
  lang: Language,
  limitedMode: boolean = false
): Promise<void> {
  const progress = state.data.progress!;
  const mistakeTags = progress.mistake_tags || [];

  if (mistakeTags.length === 0) {
    await send(waId, t(lang, "no_mistakes"));
    return;
  }

  // Sort by frequency and recency
  const sortedTags = [...mistakeTags].sort((a, b) => {
    const scoreA = a.count * 2 + (new Date().getTime() - new Date(a.last_seen).getTime()) / (1000 * 60 * 60 * 24);
    const scoreB = b.count * 2 + (new Date().getTime() - new Date(b.last_seen).getTime()) / (1000 * 60 * 60 * 24);
    return scoreB - scoreA;
  });

  // Find up to 3 exercises based on errors
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
    await send(waId, t(lang, "no_review_exercises"));
    return;
  }

  // If in limited mode (trial expired), increment the daily counter
  if (limitedMode) {
    await incrementReviewCount(supabase, waId, state);
  }

  progress.review_mode = true;
  progress.review_exercises = reviewExercises;
  progress.review_index = 0;

  await trackEvent(supabase, waId, "review_started", {
    exercise_count: reviewExercises.length,
    tags: sortedTags.slice(0, 3).map(t => t.tag),
    limited_mode: limitedMode
  });

  await updateState(supabase, waId, "review_exercise", { ...state.data, progress });

  await send(waId, t(lang, "review_intro", { count: String(reviewExercises.length) }));

  await new Promise(r => setTimeout(r, 800));
  await sendReviewExercise(supabase, waId, state, lang);
}

async function sendReviewExercise(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData },
  lang: Language
): Promise<void> {
  const progress = state.data.progress!;
  const exercises = progress.review_exercises!;
  const index = progress.review_index!;
  const exercise = exercises[index];
  const showTranslations = lang !== "en";

  // Build prompt with optional translation
  let fullPrompt = exercise.prompt;
  if (showTranslations && exercise.prompt_translation && lang !== "en") {
    const translation = exercise.prompt_translation[lang as "pt" | "es"];
    if (translation) {
      fullPrompt += `\n\n${translation}`;
    }
  }

  await send(waId, t(lang, "review_header", {
    current: String(index + 1),
    total: String(exercises.length),
    prompt: fullPrompt,
  }));
}

async function handleReviewAnswer(
  supabase: SupabaseClientType,
  waId: string,
  answer: string,
  state: { step: string; data: StateData },
  lang: Language
): Promise<void> {
  const progress = state.data.progress!;
  const exercises = progress.review_exercises!;
  const index = progress.review_index!;
  const exercise = exercises[index];

  const evaluation = await evaluateExerciseAnswer(exercise, answer, lang);

  if (evaluation.correct) {
    // Reduce mistake_tag count
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
    await sendReviewExercise(supabase, waId, state, lang);
  } else {
    // End of review
    progress.review_mode = false;
    progress.review_exercises = undefined;
    progress.review_index = undefined;

    await trackEvent(supabase, waId, "review_completed", {});

    await updateState(supabase, waId, "ready", { ...state.data, progress });

    await send(waId, t(lang, "review_complete"));
  }
}

// Handle review answer with audio transcription
async function handleReviewAnswerWithAudio(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData },
  lang: Language,
  audioData: { media_id: string; mime_type?: string },
  isAdmin: boolean = false
): Promise<void> {
  const progress = state.data.progress!;
  const exercises = progress.review_exercises!;
  const index = progress.review_index!;
  const exercise = exercises[index];

  // Transcribe audio
  const transcriptionResult = await processAudioMessage(
    supabase,
    waId,
    audioData.media_id,
    audioData.mime_type,
    state.step
  );

  if (!transcriptionResult.success || !transcriptionResult.transcript.trim()) {
    if (transcriptionResult.error === "rate_limit") {
      await send(waId, t(lang, "audio_transcription_rate_limit"));
    } else {
      await send(waId, t(lang, "audio_transcription_failed"));
    }
    return;
  }

  const transcript = transcriptionResult.transcript;
  const requestId = transcriptionResult.request_id || "";
  let actualAnswer = transcript;
  let audioScoreData: { score: number; label: "correct" | "close" | "incorrect" } | null = null;

  // Calculate Levenshtein score for non-MCQ exercises
  if (exercise.type !== "choose_correct") {
    audioScoreData = calculateAudioScore(exercise.correct_answer, transcript);
    
    // Track audio_received with score
    await trackEvent(supabase, waId, "audio_received", {
      media_id: audioData.media_id,
      transcript_text: transcript,
      target_text: exercise.correct_answer,
      score_numeric: audioScoreData.score,
      score_label: audioScoreData.label,
      provider: "openai",
      request_id: requestId,
      step_at_time: state.step,
    });
  }

  // For MCQ, extract letter
  if (exercise.type === "choose_correct" && exercise.options) {
    const mcqAnswer = extractMCQFromTranscript(transcript);
    if (mcqAnswer) {
      actualAnswer = mcqAnswer;
    }
  }

  // Show transcript
  await send(waId, t(lang, "audio_transcript_header", { transcript }));
  await new Promise(r => setTimeout(r, 400));

  const evaluation = await evaluateExerciseAnswer(exercise, actualAnswer, lang);

  if (evaluation.correct) {
    const tag = progress.mistake_tags?.find(t => t.tag === exercise.mistake_tag);
    if (tag && tag.count > 0) {
      tag.count--;
    }
  }

  await send(waId, evaluation.feedback);
  await new Promise(r => setTimeout(r, 400));

  // Pronunciation tip
  const tip = await generatePronunciationTip(exercise.correct_answer, transcript, lang);
  await send(waId, t(lang, "audio_pronunciation_tip", { tip }));
  await new Promise(r => setTimeout(r, 400));

  // Admin debug with score
  if (isAdmin) {
    let debugMsg = t(lang, "admin_audio_debug", {
      request_id: requestId,
      step: state.step,
      transcript: transcript,
    });
    
    if (audioScoreData) {
      debugMsg += `\n📊 Score: ${audioScoreData.score.toFixed(2)} (${audioScoreData.label})`;
    }
    
    await send(waId, debugMsg);
  }

  if (!evaluation.correct) {
    await send(waId, t(lang, "audio_repeat"));
    return;
  }

  await send(waId, t(lang, "audio_next"));
  await new Promise(r => setTimeout(r, 600));

  progress.review_index!++;

  if (progress.review_index! < exercises.length) {
    await updateState(supabase, waId, "review_exercise", { ...state.data, progress });
    await sendReviewExercise(supabase, waId, state, lang);
  } else {
    progress.review_mode = false;
    progress.review_exercises = undefined;
    progress.review_index = undefined;

    await trackEvent(supabase, waId, "review_completed", {});
    await updateState(supabase, waId, "ready", { ...state.data, progress });
    await send(waId, t(lang, "review_complete"));
  }
}

// Handle day production with audio transcription
async function handleDayProductionWithTranscription(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData },
  user: UserData,
  lang: Language,
  audioData: { media_id: string; mime_type?: string },
  isAdmin: boolean = false
): Promise<void> {
  const progress = state.data.progress!;
  const day = await getLessonForProgress(state, lang);

  // Transcribe audio
  const transcriptionResult = await processAudioMessage(
    supabase,
    waId,
    audioData.media_id,
    audioData.mime_type,
    state.step
  );

  let transcript = "";
  let score = 4;
  let notes = lang === "pt" ? "Excelente prática de áudio! 🎤" : 
              lang === "es" ? "¡Excelente práctica de audio! 🎤" : 
              "Excellent audio practice! 🎤";
  const requestId = transcriptionResult.request_id || "";

  if (transcriptionResult.success && transcriptionResult.transcript.trim()) {
    transcript = transcriptionResult.transcript;
    
    // Evaluate the transcribed content
    const evaluation = await evaluateWrittenProduction(transcript, lang);
    score = Math.max(3, evaluation.score); // At least 3 for audio effort
    notes = evaluation.notes;

    // Show transcript
    await send(waId, t(lang, "audio_transcript_header", { transcript }));
    await new Promise(r => setTimeout(r, 400));
    
    // Admin debug
    if (isAdmin) {
      await send(waId, t(lang, "admin_audio_debug", {
        request_id: requestId,
        step: state.step,
        transcript: transcript,
      }));
    }
  } else {
    // Couldn't transcribe but still received audio
    await send(waId, t(lang, "audio_received"));
  }

  await trackEvent(supabase, waId, "production_submitted", {
    lesson_id: day.lesson_id,
    type: "audio",
    content: transcript || null,
    media_id: audioData.media_id,
    score,
    notes,
    transcription_success: transcriptionResult.success,
    request_id: requestId,
  });

  const scoreLabel = lang === "pt" ? "Pontuação" : lang === "es" ? "Puntuación" : "Score";
  await send(waId, `${notes}\n\n⭐ ${scoreLabel}: ${score}/5`);
  await new Promise(r => setTimeout(r, 600));

  await finishDayLesson(supabase, waId, state, user, lang);
}

// ============== COMMAND HANDLERS ==============

function parseGoal(text: string): LearningGoal | null {
  const lower = text.toLowerCase();
  if (lower.includes("trabalho") || lower.includes("trabajo") || lower.includes("work") || lower.includes("profesional") || lower.includes("profissional")) return "work";
  if (lower.includes("viaje") || lower.includes("viagem") || lower.includes("travel")) return "travel";
  if (lower.includes("conversa") || lower.includes("conversation") || lower.includes("chat")) return "conversation";
  if (lower.includes("geral") || lower.includes("general")) return "general";
  return null;
}

async function handleProgressCommand(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData },
  user: UserData,
  lang: Language
): Promise<void> {
  const progress = state.data.progress;
  
  if (!progress || !user.level) {
    await send(waId, t(lang, "not_started"));
    return;
  }

  const trialInfo = getTrialProgress(progress.trial!);
  const topMistakes = (progress.mistake_tags || [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(tm => tm.tag.replace(/_/g, " "));

  // Generate link to progress page
  const progressUrl = `https://speakeasilynexo-digitalapp.lovable.app/u/${waId}`;
  const subscribeLink = getSubscribeLink(waId, "progreso", lang);

  // Check trial status
  const trialStatus = isTrialExpired(user);
  let trialMessage = "";
  
  if (user.is_subscribed) {
    trialMessage = t(lang, "subscription_active");
  } else if (trialStatus.expired) {
    trialMessage = t(lang, "trial_expired_short", { link: subscribeLink });
  } else {
    trialMessage = t(lang, "trial_days_left", { days: String(trialInfo.daysLeft) });
  }

  let mistakesText = "";
  if (topMistakes.length > 0) {
    mistakesText = t(lang, "frequent_mistakes", {
      mistakes: topMistakes.map(m => `• ${m}`).join("\n"),
    });
  }

  await send(waId, t(lang, "progress_header", {
    level: LEVEL_NAMES[user.level][lang],
    day: String(progress.current_day),
    lessons: String(progress.total_lessons_completed),
    trial_message: trialMessage,
    mistakes: mistakesText,
    link: progressUrl,
  }));
}

async function handleRestartCommand(
  supabase: SupabaseClientType,
  waId: string,
  state: { step: string; data: StateData },
  lang: Language
): Promise<void> {
  await updateState(supabase, waId, "confirm_restart", state.data);
  await send(waId, t(lang, "restart_confirm"));
}

// ============== MAIN FLOW ==============

async function processMessage(
  supabase: SupabaseClientType,
  waId: string,
  userName: string | null,
  messageText: string,
  audioData?: { media_id: string; mime_type?: string },
): Promise<void> {
  console.log(`[BOT] Processing message from: ${maskWaId(waId)}, text: "${messageText.slice(0, 50)}...", audio: ${!!audioData}`);

  // Get or create user and state
  const user = await getOrCreateUser(supabase, waId, userName);
  if (!user) {
    console.error("[BOT] Failed to get/create user");
    return;
  }

  const state = await getOrCreateState(supabase, waId);
  const displayName = user.name || userName || "amigo";
  const normalized = messageText.toUpperCase().trim();
  const lower = messageText.toLowerCase().trim();

  // Determine language (use user's preference or default to Spanish)
  let lang: Language = user.preferred_language || "es";
  
  // Get access status for admin check
  const accessStatus = getAccessStatus(user, waId);
  const isAdmin = accessStatus.isAdmin;

  // ========== LANGUAGE PICKER (PRIORITY FOR NEW USERS) ==========
  // Se preferred_language é NULL, forçar escolha ANTES de qualquer fluxo
  // Mesmo que o usuário escreva "hello", se não tiver idioma definido, perguntar primeiro
  
  if (!user.preferred_language) {
    // Tentar parsear se a mensagem atual é uma escolha de idioma
    const langChoice = parseLanguageChoice(messageText);
    
    if (langChoice) {
      // Usuário escolheu um idioma válido
      const showTranslations = langChoice !== "en";
      await updateUserLanguage(supabase, waId, langChoice, showTranslations);
      
      await trackEvent(supabase, waId, "language_selected", {
        language: langChoice,
        source: "first_message",
        raw_input: messageText,
      });
      
      lang = langChoice;
      const confirmKey = `language_confirm_${langChoice}`;
      await send(waId, t(langChoice, confirmKey));
      await new Promise(r => setTimeout(r, 600));
      
      // Send welcome audio once (coach/welcome_01.ogg with flag to prevent repeat)
      if (!state.data.welcome_audio_sent) {
        const welcomeAudioResult = await sendBotAudio(waId, "COACH_WELCOME_01");
        if (welcomeAudioResult.ok) {
          await new Promise(r => setTimeout(r, 800));
        } else {
          console.warn(`[AUDIO] Welcome audio failed (${welcomeAudioResult.reason}), trying fallback`);
          await sendBotAudio(waId, "AUDIO_PHRASE_NICE_TO_MEET_YOU");
        }
        state.data.welcome_audio_sent = true;
      }
      
      // Após idioma definido, mostrar welcome
      await updateState(supabase, waId, "welcome", state.data);
      await send(waId, t(lang, "welcome", { name: displayName }));
      await updateState(supabase, waId, "pre_placement", state.data);
      return;
    } else {
      // Não é uma escolha válida - mostrar picker (sempre, independente do que escreveu)
      await updateState(supabase, waId, "language_picker", state.data);
      await send(waId, t(null, "language_picker"));
      return;
    }
  }

  // Handle language picker responses (para usuários que já estavam no estado language_picker)
  if (state.step === "language_picker") {
    const result = await handleLanguageChange(supabase, waId, messageText, lang);
    if (result.handled) {
      if (result.newLang) {
        lang = result.newLang;
        // Send welcome audio once (with flag to prevent repeat)
        if (!state.data.welcome_audio_sent) {
          const lpAudio = await sendBotAudio(waId, "COACH_WELCOME_01");
          if (lpAudio.ok) {
            await new Promise(r => setTimeout(r, 800));
          } else {
            await sendBotAudio(waId, "AUDIO_PHRASE_NICE_TO_MEET_YOU");
          }
          state.data.welcome_audio_sent = true;
        }
        // After language is set, move to welcome
        await updateState(supabase, waId, "welcome", state.data);
        await send(waId, t(lang, "welcome", { name: displayName }));
        await updateState(supabase, waId, "pre_placement", state.data);
      }
      return;
    } else {
      // Invalid language selection
      await send(waId, t(null, "invalid_language"));
      return;
    }
  }

  // Handle IDIOMA/LANGUAGE command at any time
  if (isLanguageCommand(messageText)) {
    const result = await handleLanguageChange(supabase, waId, messageText, lang);
    if (result.handled) {
      if (result.newLang) {
        lang = result.newLang;
      }
      return;
    }
  }

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

  // ========== ADMIN COMMANDS (PRIORITY - BEFORE OTHER COMMANDS) ==========
  
  const adminHandled = await handleAdminCommand(supabase, waId, messageText, state, user, lang);
  if (adminHandled) {
    return;
  }

  // ========== AUDIO PREFERENCE COMMANDS ==========
  
  const audioPreferenceHandled = await handleAudioPreferenceCommand(supabase, waId, messageText, lang);
  if (audioPreferenceHandled) {
    return;
  }

  // ========== GLOBAL COMMANDS ==========

  // Handle confirm_restart step first
  if (state.step === "confirm_restart") {
    if (normalized === "SI" || normalized === "SÍ" || normalized === "SIM" || normalized === "YES") {
      await updateState(supabase, waId, "welcome", {});
      await send(waId, t(lang, "restart_done"));
    } else {
      await updateState(supabase, waId, "ready", state.data);
      await send(waId, t(lang, "restart_cancelled"));
    }
    return;
  }

  if (lower === "restart" || lower === "reiniciar") {
    await handleRestartCommand(supabase, waId, state, lang);
    return;
  }

  if (lower === "help" || lower === "ayuda" || lower === "ajuda") {
    await send(waId, t(lang, "help"));
    return;
  }

  if (lower === "progress" || lower === "progreso" || lower === "progresso") {
    await handleProgressCommand(supabase, waId, state, user, lang);
    return;
  }

  // Handle subscribe command
  if (lower === "subscribe" || lower === "suscribirme" || lower === "suscripcion" || lower === "suscripción" || lower === "assinar" || lower === "assinatura") {
    const subscribeLink = getSubscribeLink(waId, "command", lang);
    
    await trackEvent(supabase, waId, "subscribe_link_opened", {
      source: "command",
      link: subscribeLink,
    });
    
    await send(waId, t(lang, "subscribe_info", { link: subscribeLink }));
    return;
  }

   // ========== VER TRADUÇÃO / TRADUCAO / TRANSLATE COMMAND ==========
   const isTranslateCmd = [
     "ver tradução", "ver traducao", "ver traducción", "ver traduccion",
     "traducao", "tradução", "translate", "traduccion", "traducción",
     "traduzir", "traducir",
   ].includes(lower);

   if (isTranslateCmd) {
    const payload = state.data.last_translation_payload;
    const lastTarget = state.data.last_target;

    if (payload && payload.target_en) {
      // Generate translation on-demand if not yet available
      if (!payload.translation_native) {
        payload.translation_native = await translatePhrase(payload.target_en, lang);
        state.data.last_translation_payload = payload;
        if (lastTarget) {
          lastTarget.translation = payload.translation_native;
        }
        await updateState(supabase, waId, state.step, state.data);
      }

      // Rich translation response
      const flag = lang === "pt" ? "🇧🇷" : "🇪🇸";
      let msg = `📖 *Tradução:*\n\n🇺🇸 "${payload.target_en}"\n${flag} _${payload.translation_native}_`;

      if (payload.corrected_en && payload.corrected_native) {
        msg += `\n\n✏️ *Correção:*\n🇺🇸 "${payload.corrected_en}"\n${flag} _${payload.corrected_native}_`;
      }
      if (payload.natural_en && payload.natural_native) {
        msg += `\n\n💬 *Mais natural:*\n🇺🇸 "${payload.natural_en}"\n${flag} _${payload.natural_native}_`;
      }
      if (payload.tip) {
        msg += `\n\n💡 ${payload.tip}`;
      }

      await send(waId, msg);
    } else if (lastTarget && lastTarget.en) {
      // Generate translation on-demand if not yet available
      if (!lastTarget.translation) {
        lastTarget.translation = await translatePhrase(lastTarget.en, lang);
        state.data.last_target = lastTarget;
        await updateState(supabase, waId, state.step, state.data);
      }
      const flag = lang === "pt" ? "🇧🇷" : "🇪🇸";
      await send(waId, `🇺🇸 ${lastTarget.en}\n${flag} ${lastTarget.translation}`);
    } else {
      const noTargetMsg = lang === "pt" 
        ? "Ainda não há frase para traduzir. Continue o exercício!" 
        : "¡Aún no hay frase para traducir. Continúa el ejercicio!";
      await send(waId, noTargetMsg);
    }
    return;
  }

   if (lower === "review" || lower === "repaso" || lower === "repasar" || lower === "revisão" || lower === "revisar") {
    if (progress) {
      // Admin bypass for REVIEW
      if (accessStatus.isAdmin) {
        await trackAdminBypass(supabase, waId, "ADMIN_WA_ID", accessStatus.plan);
        await startReview(supabase, waId, state, lang);
        return;
      }
      
      // Regular user: check paywall
      if (!accessStatus.isSubscribed && accessStatus.trialExpired) {
        // Limited review for expired trial
        const reviewLimit = await checkReviewLimit(supabase, waId, state);
        if (!reviewLimit.allowed) {
          await sendReviewLimitedMessage(supabase, waId, lang);
          return;
        }
        // Pass limitedMode = true to increment counter
        await startReview(supabase, waId, state, lang, true);
      } else {
        await startReview(supabase, waId, state, lang);
      }
    } else {
      await send(waId, t(lang, "first_complete_placement"));
    }
    return;
  }

  // ========== STEP-BASED FLOW ==========

  switch (state.step) {
    case "welcome": {
      // Send welcome audio once (with flag to prevent repeat)
      if (!state.data.welcome_audio_sent) {
        const welcomeAudio = await sendBotAudio(waId, "COACH_WELCOME_01");
        if (welcomeAudio.ok) {
          await new Promise(r => setTimeout(r, 800));
        } else {
          console.warn(`[AUDIO] welcome_01.ogg missing (${welcomeAudio.reason}), using fallback`);
          await sendBotAudio(waId, "AUDIO_PHRASE_NICE_TO_MEET_YOU");
        }
        state.data.welcome_audio_sent = true;
      }
      
      await send(waId, t(lang, "welcome", { name: displayName }));
      await updateState(supabase, waId, "pre_placement", { ...state.data, progress });
      break;
    }

    case "pre_placement": {
      await startPlacement(supabase, waId, state.data, lang);
      break;
    }

    case "placement_q1":
    case "placement_q2":
    case "placement_q3": {
      // Auto-init placement if missing (e.g. after /admin step)
      if (!state.data.placement) {
        const stepIndex = state.step === "placement_q1" ? 0 
                        : state.step === "placement_q2" ? 1 : 2;
        state.data.placement = {
          part: 1, question_index: stepIndex,
          mcq_answers: [], mcq_score: 0,
        };
      }
      // Sync question_index with step
      const expectedIndex = state.step === "placement_q1" ? 0 
                          : state.step === "placement_q2" ? 1 : 2;
      state.data.placement.question_index = expectedIndex;
      
      await handlePlacementQuestion(supabase, waId, messageText, state, lang, audioData, isAdmin);
      break;
    }

    case "placement_written": {
      await handlePlacementWritten(supabase, waId, messageText, state, lang, audioData, isAdmin);
      break;
    }

    case "placement_audio": {
      if (audioData) {
        await handlePlacementAudio(supabase, waId, state, lang, audioData);
      } else if (normalized === "SKIP" || normalized === "SALTAR" || normalized === "PULAR") {
        await handlePlacementAudio(supabase, waId, state, lang);
      } else {
        await send(waId, t(lang, "send_audio_or_skip"));
      }
      break;
    }

    case "placement_result": {
      // Handle conversational audio - user practicing after placement
      if (audioData) {
        await handleConversationalAudio(supabase, waId, audioData, lang);
        return;
      }
      
      if (["NEXT", "SIGUIENTE", "PRÓXIMO", "OK", "SI", "SÍ", "SIM", "YES"].includes(normalized)) {
        await send(waId, t(lang, "select_goal"));
        await updateState(supabase, waId, "select_goal", state.data);
      } else {
        // Send gaming-context prompt based on language
        const promptKey = lang === "pt" ? "post_placement_audio_prompt_pt" : "post_placement_audio_prompt_es";
        await send(waId, t(lang, promptKey));
      }
      break;
    }

    case "select_goal": {
      if (!progress) {
        progress = { level: "A1", day: 1, goal: "general", onboarding_complete: false, streak: 0 };
        state.data.progress = progress;
      }
      const goal = parseGoal(messageText) || "general";
      progress.goal = goal;
      progress.onboarding_complete = true;
      
      await trackEvent(supabase, waId, "goal_selected", { goal });
      await trackEvent(supabase, waId, "onboarding_complete", {});
      
      await send(waId, t(lang, "goal_confirmed", { goal: GOAL_NAMES[goal][lang] }));
      await new Promise(r => setTimeout(r, 800));
      await startDayLesson(supabase, waId, { ...state, data: { ...state.data, progress } }, lang);
      break;
    }

    case "ready":
    case "day_complete":
    case "day_failed": {
      // Handle conversational audio in these states
      if (audioData) {
        await handleConversationalAudio(supabase, waId, audioData, lang);
        return;
      }
      
      if (["NEXT", "SIGUIENTE", "PRÓXIMO", "OK", "CONTINUAR"].includes(normalized)) {
        // Admin bypass for NEXT/LESSON
        if (accessStatus.isAdmin) {
          await trackAdminBypass(supabase, waId, "ADMIN_WA_ID", accessStatus.plan);
          await startDayLesson(supabase, waId, state, lang);
          return;
        }
        
        // Regular user: check paywall
        if (!accessStatus.isSubscribed && accessStatus.trialExpired) {
          const trialStatus = isTrialExpired(user);
          const reason = trialStatus.reason || "trial_expired";
          await sendPaywallMessage(supabase, waId, reason, "NEXT", lang);
          return;
        }
        await startDayLesson(supabase, waId, state, lang);
      } else {
        await send(waId, t(lang, "type_next_or_review"));
      }
      break;
    }

    case "day_intro":
    case "lesson_exercise": {
      // Pass audioData if present for audio transcription
      if (audioData) {
        await handleExerciseAnswer(supabase, waId, messageText, state, lang, {
          media_id: audioData.media_id,
          mime_type: audioData.mime_type,
        }, isAdmin);
      } else {
        await handleExerciseAnswer(supabase, waId, messageText, state, lang, undefined, isAdmin);
      }
      break;
    }

    case "day_production": {
      if (audioData) {
        await handleDayProductionWithTranscription(supabase, waId, state, user, lang, audioData, isAdmin);
      } else {
        await handleDayProduction(supabase, waId, messageText, state, user, lang);
      }
      break;
    }

    case "review_exercise": {
      // Pass audioData if present for audio transcription
      if (audioData) {
        await handleReviewAnswerWithAudio(supabase, waId, state, lang, audioData, isAdmin);
      } else {
        await handleReviewAnswer(supabase, waId, messageText, state, lang);
      }
      break;
    }

    default: {
      // Handle conversational audio in unknown/default states
      if (audioData) {
        await handleConversationalAudio(supabase, waId, audioData, lang);
        return;
      }
      
      // Unknown state, restart flow
      if (user.level) {
        await send(waId, t(lang, "lets_continue"), t(lang, "type_next_or_review"));
        await updateState(supabase, waId, "ready", state.data);
      } else {
        await updateState(supabase, waId, "welcome", { progress });
        await processMessage(supabase, waId, userName, "start");
      }
      break;
    }
  }
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
        // Process interactive button replies
        else if (message.type === "interactive" && message.interactive?.button_reply) {
          const buttonId = message.interactive.button_reply.id;
          const buttonTitle = message.interactive.button_reply.title;
          console.log("[WEBHOOK] Button reply from:", maskWaId(waId), "button:", buttonId);

          try {
            if (buttonId === "btn_translate") {
              // Handle translation button click - same as typing TRADUCAO
              await processMessage(supabase, waId, contact?.profile?.name ?? null, "TRADUCAO");
            } else {
              // Unknown button - treat as text
              await processMessage(supabase, waId, contact?.profile?.name ?? null, buttonTitle);
            }
            console.log("[WEBHOOK] Button reply processMessage completed for:", maskWaId(waId));
          } catch (processError) {
            console.error("[WEBHOOK] Error in button reply processMessage for:", maskWaId(waId), processError);
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
              { 
                media_id: message.audio.id,
                mime_type: message.audio.mime_type,
              }
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
  console.log(`[WEBHOOK] ${req.method} received`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ====== VERIFY (GET) - Meta webhook verification ONLY ======
  if (req.method === "GET") {
    console.log("[WEBHOOK] GET request - webhook verification");
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // Only allow Meta's webhook verification handshake
    if (
      mode === "subscribe" &&
      token === Deno.env.get("WHATSAPP_VERIFY_TOKEN") &&
      challenge
    ) {
      console.log("[WEBHOOK] Verification SUCCESS");
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Reject all other GET requests
    console.log("[WEBHOOK] GET rejected - invalid verification params");
    return new Response("Method Not Allowed", { status: 405 });
  }

  // ====== WEBHOOK (POST) ======
  if (req.method === "POST") {
    console.log("[WEBHOOK] POST handler started");

    let raw: string;
    try {
      raw = await req.text();
    } catch (readError) {
      console.error("[WEBHOOK] Failed to read body");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Reject oversized payloads (max 256KB)
    if (raw.length > 262144) {
      console.error("[WEBHOOK] Payload too large:", raw.length);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Validate Meta webhook signature before processing
    const signatureValid = await verifyMetaSignature(req, raw);
    if (!signatureValid) {
      console.error("[WEBHOOK] Invalid signature - rejecting request");
      return new Response("Forbidden", { status: 403 });
    }

    let body: WhatsAppWebhookPayload;
    try {
      body = JSON.parse(raw);
    } catch (parseError) {
      console.error("[WEBHOOK] JSON parse failed");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Validate payload structure
    if (
      !body ||
      typeof body !== "object" ||
      body.object !== "whatsapp_business_account" ||
      !Array.isArray(body.entry)
    ) {
      console.log("[WEBHOOK] Invalid payload structure, ignoring");
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
