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
  goal?: LearningGoal;
  onboarding_complete?: boolean;
  trial?: TrialInfo;
  mistake_tags?: MistakeTag[];
  review_mode?: boolean;
  review_exercises?: LessonExercise[];
  review_index?: number;
  review_count_today?: ReviewCountToday;
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
  | "audio_transcription_failed";

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
    pt: "🎓 *Teste de Nível*\n\nVamos descobrir seu nível! São 3 partes curtas:\n\n📝 Parte 1: 3 perguntas rápidas\n✍️ Parte 2: Escreva sobre você\n🎤 Parte 3: Áudio opcional\n\n_Leva só 2-4 minutos!_ ⏱️",
    es: "🎓 *Placement Test*\n\n¡Vamos a descubrir tu nivel! Son 3 partes cortas:\n\n📝 Parte 1: 3 preguntas rápidas\n✍️ Parte 2: Escribe sobre ti\n🎤 Parte 3: Audio opcional\n\n_¡Tarda solo 2-4 minutos!_ ⏱️",
    en: "🎓 *Placement Test*\n\nLet's discover your level! It's 3 short parts:\n\n📝 Part 1: 3 quick questions\n✍️ Part 2: Write about yourself\n🎤 Part 3: Optional audio\n\n_Only takes 2-4 minutes!_ ⏱️",
  },
  answer_abcd: {
    pt: "Responda com *A*, *B*, *C* ou *D* 📝",
    es: "Responde con *A*, *B*, *C* o *D* 📝",
    en: "Reply with *A*, *B*, *C*, or *D* 📝",
  },
  part1_complete: {
    pt: "✅ *Parte 1 completada!*\n\n📝 *Parte 2/3 — Produção escrita*\n\nEscreva 2 frases em inglês:\n1. Quem você é e o que faz\n2. Por que quer aprender inglês\n\n_Exemplo: \"I'm Ana, I work as a nurse. I want to learn English because...\"_",
    es: "✅ *Parte 1 completada!*\n\n📝 *Parte 2/3 — Producción escrita*\n\nEscribe 2 frases en inglés:\n1. Quién eres y a qué te dedicas\n2. Por qué quieres aprender inglés\n\n_Ejemplo: \"I'm Ana, I work as a nurse. I want to learn English because...\"_",
    en: "✅ *Part 1 complete!*\n\n📝 *Part 2/3 — Written production*\n\nWrite 2 sentences in English:\n1. Who you are and what you do\n2. Why you want to learn English\n\n_Example: \"I'm Ana, I work as a nurse. I want to learn English because...\"_",
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
    pt: "📖 *Dia {day}/7 — {title}*\n\n🎯 *Objetivos:*\n{objectives}\n\n⏱️ ~5-8 min | ⏳ {lessons_left} lições restantes",
    es: "📖 *Día {day}/7 — {title}*\n\n🎯 *Objetivos:*\n{objectives}\n\n⏱️ ~5-8 min | ⏳ {lessons_left} lecciones restantes",
    en: "📖 *Day {day}/7 — {title}*\n\n🎯 *Objectives:*\n{objectives}\n\n⏱️ ~5-8 min | ⏳ {lessons_left} lessons left",
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
    pt: "📚 *Modo Revisão*\n\nVamos praticar {count} exercícios baseados nos seus erros mais frequentes.\n\nVamos! 💪",
    es: "📚 *Modo Repaso*\n\nVamos a practicar {count} ejercicios basados en tus errores más frecuentes.\n\n¡Vamos! 💪",
    en: "📚 *Review Mode*\n\nLet's practice {count} exercises based on your most frequent mistakes.\n\nLet's go! 💪",
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
    pt: "📚 *Comandos disponíveis:*\n\n• *NEXT* — Continuar com o plano\n• *PROGRESO* — Ver seu avanço e link\n• *REVIEW* — Revisar erros\n• *IDIOMA* — Mudar idioma\n• *SUSCRIBIRME* — Ver planos\n• *RESTART* — Reiniciar (com confirmação)\n\n💬 Escreva o que precisar!",
    es: "📚 *Comandos disponibles:*\n\n• *NEXT* — Continuar con el plan\n• *PROGRESO* — Ver tu avance y link\n• *REVIEW* — Repasar errores\n• *IDIOMA* — Cambiar idioma\n• *SUSCRIBIRME* — Ver planes\n• *RESTART* — Reiniciar (con confirmación)\n\n💬 ¡Escribe lo que necesites!",
    en: "📚 *Available commands:*\n\n• *NEXT* — Continue with the plan\n• *PROGRESS* — View your progress and link\n• *REVIEW* — Review mistakes\n• *LANGUAGE* — Change language\n• *SUBSCRIBE* — View plans\n• *RESTART* — Restart (with confirmation)\n\n💬 Type what you need!",
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
    pt: "📝 *Transcrição:* _{transcript}_",
    es: "📝 *Transcripción:* _{transcript}_",
    en: "📝 *Transcript:* _{transcript}_",
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
  audio_download_failed: {
    pt: "🎤 Erro ao processar o áudio. Por favor, escreva sua resposta.",
    es: "🎤 Error al procesar el audio. Por favor, escribe tu respuesta.",
    en: "🎤 Error processing audio. Please type your answer.",
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
        prompt: "Find and correct the error:\n\n*\"My name it is Carlos.\"*\n\n(Write the correct sentence)",
        prompt_translation: {
          pt: "(Encontre e corrija o erro - Escreva a frase correta)",
          es: "(Encuentra y corrige el error - Escribe la frase correcta)",
        },
        correct_answer: "My name is Carlos",
        hint: {
          pt: "O 'it' não é necessário aqui.",
          es: "El 'it' no es necesario aquí.",
          en: "The 'it' is not needed here.",
        },
        mistake_tag: "redundant_pronoun"
      }
    ],
    production_type: "text",
    production_prompt: {
      pt: "✍️ *Produção final:*\n\nEscreva 2 frases se apresentando:\n1. Seu nome e de onde você é\n2. O que você faz",
      es: "✍️ *Producción final:*\n\nEscribe 2 frases presentándote:\n1. Tu nombre y de dónde eres\n2. A qué te dedicas",
      en: "✍️ *Final production:*\n\nWrite 2 sentences introducing yourself:\n1. Your name and where you're from\n2. What you do",
    },
  },
  {
    day: 2,
    lesson_id: "day2_present_simple",
    title: { pt: "Presente Simples - Rotinas", es: "Presente Simple - Rutinas", en: "Present Simple - Routines" },
    objectives: {
      pt: ["Falar de rotinas diárias", "Usar advérbios de frequência"],
      es: ["Hablar de rutinas diarias", "Usar adverbios de frecuencia"],
      en: ["Talk about daily routines", "Use frequency adverbs"],
    },
    exercises: [
      {
        id: "d2_ex1",
        type: "choose_correct",
        prompt: "She ___ coffee every morning.\n\nA) drink\nB) drinks\nC) drinking\nD) is drink",
        prompt_translation: {
          pt: "(Ela ___ café toda manhã.)",
          es: "(Ella ___ café cada mañana.)",
        },
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: {
          pt: "Terceira pessoa do singular: he/she/it + verbo+s",
          es: "Tercera persona singular: he/she/it + verbo+s",
          en: "Third person singular: he/she/it + verb+s",
        },
        mistake_tag: "third_person_s",
        feedback_correct: {
          pt: "✅ Correto! 'drinks' porque 'she' é 3ª pessoa no presente.",
          es: "✅ ¡Correcto! 'drinks' porque 'she' es 3ª persona en presente.",
          en: "✅ Correct! 'drinks' because 'she' is 3rd person in present.",
        },
        feedback_wrong: {
          pt: "❌ A resposta correta é *B) drinks*. Com she/he/it, adicionamos -s ao verbo.",
          es: "❌ La respuesta correcta es *B) drinks*. Con she/he/it, añadimos -s al verbo.",
          en: "❌ The correct answer is *B) drinks*. With she/he/it, we add -s to the verb.",
        },
      },
      {
        id: "d2_ex2",
        type: "fill_in_blank",
        prompt: "I ___ (not/like) spicy food.\n\n(Write the correct form)",
        prompt_translation: {
          pt: "(Eu ___ (não/gostar de) comida picante. - Escreva a forma correta)",
          es: "(Yo ___ (no/gustar) comida picante. - Escribe la forma correcta)",
        },
        correct_answer: "don't like",
        hint: {
          pt: "Negativo no presente simples: don't/doesn't + verbo base",
          es: "Negativo en presente simple: don't/doesn't + verbo base",
          en: "Negative in present simple: don't/doesn't + base verb",
        },
        mistake_tag: "present_negative"
      },
      {
        id: "d2_ex3",
        type: "reorder_words",
        prompt: "Reorder:\n\n*usually / I / at / wake up / 7 AM*",
        prompt_translation: {
          pt: "(Ordene: usually / I / at / wake up / 7 AM)",
          es: "(Ordena: usually / I / at / wake up / 7 AM)",
        },
        correct_answer: "I usually wake up at 7 AM",
        hint: {
          pt: "Os advérbios de frequência vão antes do verbo principal.",
          es: "Los adverbios de frecuencia van antes del verbo principal.",
          en: "Frequency adverbs go before the main verb.",
        },
        mistake_tag: "adverb_position"
      },
      {
        id: "d2_ex4",
        type: "correct_the_mistake",
        prompt: "Correct:\n\n*\"He don't work on Saturdays.\"*",
        prompt_translation: {
          pt: "(Corrija: \"He don't work on Saturdays.\")",
          es: "(Corrige: \"He don't work on Saturdays.\")",
        },
        correct_answer: "He doesn't work on Saturdays",
        hint: {
          pt: "He/She/It → doesn't (não don't)",
          es: "He/She/It → doesn't (no don't)",
          en: "He/She/It → doesn't (not don't)",
        },
        mistake_tag: "doesnt_vs_dont"
      }
    ],
    production_type: "text",
    production_prompt: {
      pt: "✍️ *Produção final:*\n\nDescreva sua rotina matinal em 3 frases usando presente simples.",
      es: "✍️ *Producción final:*\n\nDescribe tu rutina matutina en 3 frases usando presente simple.",
      en: "✍️ *Final production:*\n\nDescribe your morning routine in 3 sentences using present simple.",
    },
  },
  {
    day: 3,
    lesson_id: "day3_past_simple",
    title: { pt: "Passado Simples - Ontem", es: "Pasado Simple - Ayer", en: "Past Simple - Yesterday" },
    objectives: {
      pt: ["Narrar eventos passados", "Usar verbos irregulares comuns"],
      es: ["Narrar eventos pasados", "Usar verbos irregulares comunes"],
      en: ["Narrate past events", "Use common irregular verbs"],
    },
    exercises: [
      {
        id: "d3_ex1",
        type: "choose_correct",
        prompt: "Yesterday I ___ to the supermarket.\n\nA) go\nB) went\nC) gone\nD) going",
        prompt_translation: {
          pt: "(Ontem eu ___ ao supermercado.)",
          es: "(Ayer ___ al supermercado.)",
        },
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: { pt: "go → went (irregular)", es: "go → went (irregular)", en: "go → went (irregular)" },
        mistake_tag: "past_irregular_go"
      },
      {
        id: "d3_ex2",
        type: "fill_in_blank",
        prompt: "She ___ (not/call) me last night.\n\n(Write the correct form)",
        prompt_translation: {
          pt: "(Ela ___ (não/ligar) para mim ontem à noite.)",
          es: "(Ella ___ (no/llamar) me anoche.)",
        },
        correct_answer: "didn't call",
        hint: {
          pt: "Negativo: didn't + verbo base",
          es: "Negativo: didn't + verbo base",
          en: "Negative: didn't + base verb",
        },
        mistake_tag: "past_negative"
      },
      {
        id: "d3_ex3",
        type: "choose_correct",
        prompt: "___ you see the movie?\n\nA) Do\nB) Did\nC) Does\nD) Was",
        prompt_translation: {
          pt: "(___ você viu o filme?)",
          es: "(___ viste la película?)",
        },
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: {
          pt: "Pergunta no passado: Did + sujeito + verbo base",
          es: "Pregunta en pasado: Did + sujeto + verbo base",
          en: "Past question: Did + subject + base verb",
        },
        mistake_tag: "past_question"
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
          pt: "Depois de didn't usamos verbo base, não passado.",
          es: "Después de didn't usamos verbo base, no pasado.",
          en: "After didn't we use base verb, not past.",
        },
        mistake_tag: "didnt_base_verb"
      }
    ],
    production_type: "text",
    production_prompt: {
      pt: "✍️ *Produção final:*\n\nConte o que você fez ontem depois do trabalho/aulas. Use pelo menos 3 verbos no passado.",
      es: "✍️ *Producción final:*\n\nCuenta qué hiciste ayer después del trabajo/clases. Usa al menos 3 verbos en pasado.",
      en: "✍️ *Final production:*\n\nTell what you did yesterday after work/classes. Use at least 3 past tense verbs.",
    },
  },
  {
    day: 4,
    lesson_id: "day4_questions",
    title: { pt: "Perguntas e Respostas", es: "Preguntas y Respuestas", en: "Questions and Answers" },
    objectives: {
      pt: ["Formar perguntas corretamente", "Responder de forma natural"],
      es: ["Formar preguntas correctamente", "Responder de forma natural"],
      en: ["Form questions correctly", "Answer naturally"],
    },
    exercises: [
      {
        id: "d4_ex1",
        type: "reorder_words",
        prompt: "Form a question:\n\n*do / where / live / you / ?*",
        prompt_translation: {
          pt: "(Forme uma pergunta: do / where / live / you / ?)",
          es: "(Forma una pregunta: do / where / live / you / ?)",
        },
        correct_answer: "Where do you live?",
        hint: {
          pt: "Wh-word + auxiliar + sujeito + verbo",
          es: "Wh-word + auxiliar + sujeto + verbo",
          en: "Wh-word + auxiliary + subject + verb",
        },
        mistake_tag: "wh_question_order"
      },
      {
        id: "d4_ex2",
        type: "choose_correct",
        prompt: "___  your brother work?\n\nA) Where do\nB) Where does\nC) Where is\nD) Where",
        prompt_translation: {
          pt: "(___ seu irmão trabalha?)",
          es: "(___ trabaja tu hermano?)",
        },
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        hint: {
          pt: "brother = he → does",
          es: "brother = he → does",
          en: "brother = he → does",
        },
        mistake_tag: "question_auxiliar"
      },
      {
        id: "d4_ex3",
        type: "fill_in_blank",
        prompt: "___ is your favorite color?\n\n(Write the question word)",
        prompt_translation: {
          pt: "(___ é sua cor favorita? - Escreva a palavra interrogativa)",
          es: "(___ es tu color favorito? - Escribe la palabra interrogativa)",
        },
        correct_answer: "What",
        hint: {
          pt: "Para perguntar sobre coisas usamos What.",
          es: "Para preguntar sobre cosas usamos What.",
          en: "To ask about things we use What.",
        },
        mistake_tag: "wh_words"
      },
      {
        id: "d4_ex4",
        type: "correct_the_mistake",
        prompt: "Correct:\n\n*\"What means this word?\"*",
        prompt_translation: {
          pt: "(Corrija: \"What means this word?\")",
          es: "(Corrige: \"What means this word?\")",
        },
        correct_answer: "What does this word mean?",
        hint: {
          pt: "Em perguntas: What + does + sujeito + verbo base",
          es: "En preguntas: What + does + sujeto + verbo base",
          en: "In questions: What + does + subject + base verb",
        },
        mistake_tag: "question_structure"
      }
    ],
    production_type: "text",
    production_prompt: {
      pt: "✍️ *Produção final:*\n\nEscreva 3 perguntas que você faria a um novo colega de trabalho.",
      es: "✍️ *Producción final:*\n\nEscribe 3 preguntas que le harías a un nuevo compañero de trabajo.",
      en: "✍️ *Final production:*\n\nWrite 3 questions you would ask a new colleague at work.",
    },
  },
  {
    day: 5,
    lesson_id: "day5_future",
    title: { pt: "Planos Futuros", es: "Planes Futuros", en: "Future Plans" },
    objectives: {
      pt: ["Expressar planos com 'going to'", "Usar 'will' para decisões"],
      es: ["Expresar planes con 'going to'", "Usar 'will' para decisiones"],
      en: ["Express plans with 'going to'", "Use 'will' for decisions"],
    },
    exercises: [
      {
        id: "d5_ex1",
        type: "choose_correct",
        prompt: "I ___ visit my parents next weekend.\n\nA) going to\nB) am going to\nC) will going\nD) go to",
        prompt_translation: {
          pt: "(Eu ___ visitar meus pais no próximo fim de semana.)",
          es: "(Voy a ___ visitar a mis padres el próximo fin de semana.)",
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
      pt: "✍️ *Produção final:*\n\nDescreva 3 planos que você tem para este fim de semana usando 'going to'.",
      es: "✍️ *Producción final:*\n\nDescribe 3 planes que tienes para este fin de semana usando 'going to'.",
      en: "✍️ *Final production:*\n\nDescribe 3 plans you have for this weekend using 'going to'.",
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
    .select("wa_id, name, level, subscription_status, trial_started_at, trial_expires_at, trial_completed, is_subscribed, subscription_plan, preferred_language, show_translations")
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
      })
      .select("wa_id, name, level, subscription_status, trial_started_at, trial_expires_at, trial_completed, is_subscribed, subscription_plan, preferred_language, show_translations")
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
      trial_completed: newUser.trial_completed as boolean,
      is_subscribed: newUser.is_subscribed as boolean,
      subscription_plan: newUser.subscription_plan as string | null,
      preferred_language: newUser.preferred_language as Language | null,
      show_translations: newUser.show_translations as boolean ?? true,
    };
  }

  // Regular user: start trial
  const trialExpiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const { data: newUser, error } = await supabase
    .from("wa_users")
    .insert({ 
      wa_id: waId, 
      name, 
      subscription_status: "trial",
      trial_started_at: now.toISOString(),
      trial_expires_at: trialExpiresAt.toISOString(),
      trial_completed: false,
      is_subscribed: false,
      preferred_language: null,
      show_translations: true,
    })
    .select("wa_id, name, level, subscription_status, trial_started_at, trial_expires_at, trial_completed, is_subscribed, subscription_plan, preferred_language, show_translations")
    .single();

  if (error) {
    console.error("[DB] Error:", error);
    return null;
  }

  // Track trial_started event
  await trackEvent(supabase, waId, "trial_started", {
    trial_started_at: now.toISOString(),
    trial_expires_at: trialExpiresAt.toISOString(),
  });

  return {
    wa_id: newUser.wa_id as string,
    name: newUser.name as string | null,
    level: newUser.level as EnglishLevel | null,
    subscription_status: newUser.subscription_status as string,
    trial_started_at: newUser.trial_started_at as string | null,
    trial_expires_at: newUser.trial_expires_at as string | null,
    trial_completed: newUser.trial_completed as boolean,
    is_subscribed: newUser.is_subscribed as boolean,
    subscription_plan: newUser.subscription_plan as string | null,
    preferred_language: newUser.preferred_language as Language | null,
    show_translations: newUser.show_translations as boolean ?? true,
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

async function updateUserLanguage(
  supabase: SupabaseClientType,
  waId: string,
  language: Language,
  showTranslations: boolean
): Promise<void> {
  await supabase.from("wa_users").update({ 
    preferred_language: language,
    show_translations: showTranslations,
  }).eq("wa_id", waId);
}

// ============== TRIAL SYSTEM ==============

function initTrial(): TrialInfo {
  return {
    trial_started_at: new Date().toISOString(),
    lessons_completed: 0,
    trial_status: "active",
  };
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

// ============== ADMIN & ACCESS CONTROL ==============

function getAccessStatus(
  waUser: UserData,
  waId: string,
  reqHeaders?: Headers
): AccessStatus {
  const adminWaId = Deno.env.get("ADMIN_WA_ID");
  const adminKey = Deno.env.get("ADMIN_KEY");
  const headerAdminKey = reqHeaders?.get("x-admin-key");

  // Check if admin
  const isAdminById = adminWaId && waId === adminWaId;
  const isAdminByKey = adminKey && headerAdminKey && headerAdminKey === adminKey;
  const isAdmin = !!(isAdminById || isAdminByKey);

  if (isAdmin) {
    return {
      isAdmin: true,
      isSubscribed: true,
      plan: (waUser.subscription_plan as SubscriptionPlan) || "trimestral",
      trialActive: false,
      trialExpired: false,
    };
  }

  // Regular user
  const isSubscribed = waUser.is_subscribed === true;
  
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
    isSubscribed,
    plan: isSubscribed ? (waUser.subscription_plan as SubscriptionPlan) : null,
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
    console.log(`[ADMIN] Non-admin tried admin command: ${waId}`);
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
  
  if (subcommand === "step" && arg) {
    const targetStep = arg.toLowerCase();
    
    if (!VALID_STEPS.includes(targetStep as typeof VALID_STEPS[number])) {
      await send(waId, t(lang, "admin_step_invalid", {
        step: targetStep,
        valid_steps: VALID_STEPS.join(", "),
      }));
      return true;
    }
    
    await updateState(supabase, waId, targetStep, state.data);
    await send(waId, t(lang, "admin_step_changed", { step: targetStep }));
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
  const currentExercise = (progress?.current_exercise_index || 0) + 1;
  const dayLesson = DAY_LESSONS.find(d => d.day === currentDay);
  const totalExercises = dayLesson?.exercises.length || 4;
  
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

function isTrialExpired(user: UserData): { expired: boolean; reason: "trial_completed" | "trial_expired" | null } {
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
  reason: "trial_completed" | "trial_expired",
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

  await send(waId, t(lang, "trial_ended", { link: subscribeLink }));
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

// ============== AUDIO TRANSCRIPTION (WHISPER) ==============

interface TranscriptionResult {
  success: boolean;
  transcript: string;
  confidence?: number;
  error?: string;
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
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribeAudio(audioBlob: Blob, mimeType: string): Promise<TranscriptionResult> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!openaiKey) {
    console.error("[AUDIO] Missing OPENAI_API_KEY");
    return { success: false, transcript: "", error: "missing_api_key" };
  }

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
      console.error("[AUDIO] Whisper API error:", response.status, errorText);
      return { success: false, transcript: "", error: `whisper_error_${response.status}` };
    }

    const data = await response.json();
    const transcript = data.text?.trim() || "";
    
    console.log("[AUDIO] Transcription successful:", transcript.slice(0, 50) + "...");
    
    return {
      success: true,
      transcript,
      confidence: data.segments?.[0]?.avg_logprob ? Math.exp(data.segments[0].avg_logprob) : undefined,
    };
  } catch (error) {
    console.error("[AUDIO] transcribeAudio exception:", error);
    return { success: false, transcript: "", error: "transcription_exception" };
  }
}

/**
 * Full pipeline: fetch URL -> download -> transcribe
 */
async function processAudioMessage(
  supabase: SupabaseClientType,
  waId: string,
  mediaId: string,
  mimeType?: string
): Promise<TranscriptionResult> {
  console.log("[AUDIO] Starting audio processing for media:", mediaId);
  
  // Step 1: Get media URL
  const mediaInfo = await fetchMediaUrl(mediaId);
  if (!mediaInfo) {
    await trackEvent(supabase, waId, "audio_transcription_failed", {
      media_id: mediaId,
      error: "fetch_url_failed",
    });
    return { success: false, transcript: "", error: "fetch_url_failed" };
  }

  // Step 2: Download media
  const audioBlob = await downloadMedia(mediaInfo.url);
  if (!audioBlob) {
    await trackEvent(supabase, waId, "audio_transcription_failed", {
      media_id: mediaId,
      error: "download_failed",
    });
    return { success: false, transcript: "", error: "download_failed" };
  }

  // Step 3: Transcribe
  const result = await transcribeAudio(audioBlob, mimeType || mediaInfo.mimeType);
  
  if (result.success) {
    await trackEvent(supabase, waId, "audio_transcribed", {
      media_id: mediaId,
      transcript: result.transcript.slice(0, 500),
      confidence: result.confidence,
      mime_type: mimeType || mediaInfo.mimeType,
    });
  } else {
    await trackEvent(supabase, waId, "audio_transcription_failed", {
      media_id: mediaId,
      error: result.error,
    });
  }

  return result;
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
  
  // Contains option letter clearly
  const letterMatch = lower.match(/\b(option\s+)?([abcd])\b/i);
  if (letterMatch) {
    return letterMatch[2].toUpperCase();
  }
  
  // Spoken letters
  const spokenMap: Record<string, string> = {
    "a": "A", "ay": "A", "ei": "A",
    "b": "B", "be": "B", "bee": "B", "bi": "B",
    "c": "C", "see": "C", "si": "C", "ce": "C",
    "d": "D", "de": "D", "dee": "D", "di": "D",
  };
  
  const words = lower.split(/\s+/);
  for (const word of words) {
    if (spokenMap[word]) {
      return spokenMap[word];
    }
  }
  
  return null;
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
  const systemPrompt = `Evaluate if the student's answer is acceptable.

EXERCISE: ${exercise.prompt}
EXPECTED ANSWER: ${exercise.correct_answer}
STUDENT'S ANSWER: ${userAnswer}

Be flexible with minor spelling errors.
Return ONLY JSON: {"correct": true/false, "feedback": "1 line in ${feedbackLang}"}`;

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
  lang: Language
): Promise<void> {
  const placement = state.data.placement!;
  const qIndex = placement.question_index;
  const question = PLACEMENT_QUESTIONS[qIndex];
  const normalized = answer.toUpperCase().trim();

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
    feedback: isCorrect ? question.feedback_correct[lang] : question.feedback_wrong[lang]
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
  lang: Language
): Promise<void> {
  const placement = state.data.placement!;
  
  // Evaluate text
  const evaluation = await evaluateWrittenProduction(text, lang);
  
  placement.written_text = text;
  placement.written_score = evaluation.score;

  await trackEvent(supabase, waId, "placement_written_submitted", {
    text: text.slice(0, 1000),
    score: evaluation.score,
    notes: evaluation.notes
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
  const lesson = SEVEN_DAY_PLAN.find(l => l.day === day);

  if (!lesson) {
    await send(waId, t(lang, "plan_complete_notice"));
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
  const day = SEVEN_DAY_PLAN.find(l => l.day === progress.current_day)!;
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

  await send(waId, t(lang, "exercise_header", {
    emoji: emoji[exercise.type] || "📝",
    current: String(current),
    total: String(total),
    prompt: fullPrompt,
  }));
}

async function handleExerciseAnswer(
  supabase: SupabaseClientType,
  waId: string,
  answer: string,
  state: { step: string; data: StateData },
  lang: Language,
  audioData?: { media_id: string; mime_type?: string }
): Promise<void> {
  const progress = state.data.progress!;
  const day = SEVEN_DAY_PLAN.find(l => l.day === progress.current_day)!;
  const exercise = day.exercises[progress.current_exercise_index];

  if (!exercise) {
    await startDayProduction(supabase, waId, state, lang);
    return;
  }

  let actualAnswer = answer;
  let transcript: string | null = null;
  let pronunciationTip: string | null = null;

  // If audio was sent, transcribe it first
  if (audioData) {
    const transcriptionResult = await processAudioMessage(
      supabase,
      waId,
      audioData.media_id,
      audioData.mime_type
    );

    if (!transcriptionResult.success || !transcriptionResult.transcript.trim()) {
      // Transcription failed - ask user to type answer instead
      await send(waId, t(lang, "audio_transcription_failed"));
      return; // Don't advance exercise, let user retry with text
    }

    transcript = transcriptionResult.transcript;
    console.log("[EXERCISE] Audio transcript:", transcript);

    // For MCQ exercises, extract the letter from transcript
    if (exercise.type === "choose_correct" && exercise.options) {
      const mcqAnswer = extractMCQFromTranscript(transcript);
      if (mcqAnswer) {
        actualAnswer = mcqAnswer;
      } else {
        // Couldn't extract MCQ answer from audio
        actualAnswer = transcript;
      }
    } else {
      // For other exercise types, use the full transcript
      actualAnswer = transcript;
    }
  }

  const evaluation = await evaluateExerciseAnswer(exercise, actualAnswer, lang);
  progress.day_attempts++;

  if (evaluation.correct) {
    progress.day_score++;
    progress.exercises_completed++;
  } else {
    // Record mistake_tag
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

  // Track with transcript info if audio was used
  await trackEvent(supabase, waId, "exercise_answered", {
    lesson_id: day.lesson_id,
    ex_id: exercise.id,
    user_answer: actualAnswer,
    correct: evaluation.correct,
    feedback: evaluation.feedback,
    mistake_tag: evaluation.correct ? null : exercise.mistake_tag,
    input_type: audioData ? "audio" : "text",
    transcript: transcript,
    media_id: audioData?.media_id || null,
  });

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

    // Show next step prompt
    if (evaluation.correct) {
      await send(waId, t(lang, "audio_next"));
    } else {
      await send(waId, t(lang, "audio_repeat"));
      return; // Don't advance to next exercise on audio error - let them retry
    }
  } else {
    // Regular text feedback
    await send(waId, evaluation.feedback);
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
  const day = SEVEN_DAY_PLAN.find(l => l.day === progress.current_day)!;

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
  const day = SEVEN_DAY_PLAN.find(l => l.day === progress.current_day)!;

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

    const subscribeLink = getSubscribeLink(waId, "day7_complete", lang);
    
    // Check if Day 7 was just completed (current_day is now 8)
    if (day.day === 7) {
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
  audioData: { media_id: string; mime_type?: string }
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
    audioData.mime_type
  );

  if (!transcriptionResult.success || !transcriptionResult.transcript.trim()) {
    await send(waId, t(lang, "audio_transcription_failed"));
    return;
  }

  const transcript = transcriptionResult.transcript;
  let actualAnswer = transcript;

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
  audioData: { media_id: string; mime_type?: string }
): Promise<void> {
  const progress = state.data.progress!;
  const day = SEVEN_DAY_PLAN.find(l => l.day === progress.current_day)!;

  // Transcribe audio
  const transcriptionResult = await processAudioMessage(
    supabase,
    waId,
    audioData.media_id,
    audioData.mime_type
  );

  let transcript = "";
  let score = 4;
  let notes = lang === "pt" ? "Excelente prática de áudio! 🎤" : 
              lang === "es" ? "¡Excelente práctica de audio! 🎤" : 
              "Excellent audio practice! 🎤";

  if (transcriptionResult.success && transcriptionResult.transcript.trim()) {
    transcript = transcriptionResult.transcript;
    
    // Evaluate the transcribed content
    const evaluation = await evaluateWrittenProduction(transcript, lang);
    score = Math.max(3, evaluation.score); // At least 3 for audio effort
    notes = evaluation.notes;

    // Show transcript
    await send(waId, t(lang, "audio_transcript_header", { transcript }));
    await new Promise(r => setTimeout(r, 400));
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
  if (state.step !== "confirm_restart") {
    await updateState(supabase, waId, "confirm_restart", state.data);
    await send(waId, t(lang, "restart_confirm"));
    return;
  }
}

// ============== MAIN MESSAGE PROCESSOR ==============

async function processMessage(
  supabase: SupabaseClientType,
  waId: string,
  userName: string | null,
  messageText: string,
  audioData?: { media_id: string; mime_type?: string }
): Promise<void> {
  const user = await getOrCreateUser(supabase, waId, userName);
  if (!user) return;

  const state = await getOrCreateState(supabase, waId);
  if (!state) return;

  const displayName = userName?.split(" ")[0] || "friend";
  const normalized = messageText.trim().toUpperCase();
  const lower = messageText.toLowerCase().trim();
  
  // Get user's preferred language (default to Spanish for initial picker message)
  let lang: Language = user.preferred_language || "es";

  // ========== LANGUAGE PICKER (MANDATORY FOR NEW USERS) ==========
  
  // If user has no preferred_language, show language picker first
  if (!user.preferred_language) {
    // Check if this is a language selection response
    const selectedLang = parseLanguageChoice(messageText);
    
    if (selectedLang) {
      // User selected a language
      const showTranslations = selectedLang !== "en";
      await updateUserLanguage(supabase, waId, selectedLang, showTranslations);
      
      await trackEvent(supabase, waId, "language_selected", {
        language: selectedLang,
        source: "picker",
        raw_input: messageText,
      });
      
      // Update user object locally
      lang = selectedLang;
      
      const confirmKey = `language_confirm_${selectedLang}`;
      await send(waId, t(selectedLang, confirmKey));
      
      await new Promise(r => setTimeout(r, 500));
      
      // Now continue with welcome flow
      await send(waId, t(lang, "welcome", { name: displayName }));
      await updateState(supabase, waId, "pre_placement", state.data);
      return;
    } else {
      // Show language picker (using neutral/bilingual message)
      await send(waId, I18N.language_picker.es); // Use Spanish as default for picker
      return;
    }
  }

  // ========== LANGUAGE CHANGE COMMAND (ANYTIME) ==========
  
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

  if (lower === "review" || lower === "repaso" || lower === "repasar" || lower === "revisão" || lower === "revisar") {
    if (progress) {
      // Use getAccessStatus for paywall check
      const accessStatus = getAccessStatus(user, waId);
      
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
      await handlePlacementQuestion(supabase, waId, messageText, state, lang);
      break;
    }

    case "placement_written": {
      await handlePlacementWritten(supabase, waId, messageText, state, lang);
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
      if (["NEXT", "SIGUIENTE", "PRÓXIMO", "OK", "SI", "SÍ", "SIM", "YES"].includes(normalized)) {
        await send(waId, t(lang, "select_goal"));
        await updateState(supabase, waId, "select_goal", state.data);
      } else {
        await send(waId, t(lang, "type_next"));
      }
      break;
    }

    case "select_goal": {
      const goal = parseGoal(messageText) || "general";
      progress!.goal = goal;
      progress!.onboarding_complete = true;
      
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
      if (["NEXT", "SIGUIENTE", "PRÓXIMO", "OK", "CONTINUAR"].includes(normalized)) {
        // Use getAccessStatus for paywall check
        const accessStatus = getAccessStatus(user, waId);
        
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
        });
      } else {
        await handleExerciseAnswer(supabase, waId, messageText, state, lang);
      }
      break;
    }

    case "day_production": {
      if (audioData) {
        await handleDayProductionWithTranscription(supabase, waId, state, user, lang, audioData);
      } else {
        await handleDayProduction(supabase, waId, messageText, state, user, lang);
      }
      break;
    }

    case "review_exercise": {
      // Pass audioData if present for audio transcription
      if (audioData) {
        await handleReviewAnswerWithAudio(supabase, waId, state, lang, audioData);
      } else {
        await handleReviewAnswer(supabase, waId, messageText, state, lang);
      }
      break;
    }

    default: {
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
