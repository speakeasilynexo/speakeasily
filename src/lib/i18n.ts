export type Language = "es" | "en" | "pt";

const STORAGE_KEY = "speakeasily-language";

export const supportedLanguages: readonly Language[] = ["es", "en", "pt"];

function normalizeLanguage(value: string | null | undefined): Language | null {
  if (!value) return null;

  const normalized = value.toLowerCase();

  if (normalized === "es" || normalized.startsWith("es-")) return "es";
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  if (normalized === "pt" || normalized.startsWith("pt-")) return "pt";

  return null;
}

export function getLanguageFromParam(param: string | null): Language | null {
  return normalizeLanguage(param);
}

export function getSavedLanguage(): Language | null {
  if (typeof window === "undefined") return null;
  return normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
}

export function saveLanguage(language: Language): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, language);
}

export function getDefaultLanguage(): Language {
  if (typeof navigator === "undefined") return "es";

  for (const browserLanguage of navigator.languages) {
    const normalized = normalizeLanguage(browserLanguage);
    if (normalized) return normalized;
  }

  return normalizeLanguage(navigator.language) ?? "es";
}

export function resolveLanguage(param: string | null): Language {
  return getLanguageFromParam(param) ?? getSavedLanguage() ?? getDefaultLanguage();
}

export function buildLocalizedPath(path: string, language: Language): string {
  if (language === "es") return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}lang=${language}`;
}

export const languageLabels: Record<Language, { short: string; full: string; flag: string }> = {
  es: { short: "ES", full: "Español", flag: "🇪🇸" },
  en: { short: "EN", full: "English", flag: "🇺🇸" },
  pt: { short: "PT", full: "Português (Brasil)", flag: "🇧🇷" },
};

export const landingCopy = {
  es: {
    seo: {
      title: "SpeakEasily - Aprende inglés por WhatsApp | Clases de inglés online gratis",
      description:
        "Aprende inglés por WhatsApp con un curso guiado de 7 días e IA. Curso de inglés online gratis: 5 min/día, sin descargar apps. Prueba 7 días gratis.",
    },
    header: {
      howItWorks: "Cómo funciona",
      benefits: "Beneficios",
      plans: "Planes",
      cta: "Prueba gratis",
    },
    hero: {
      badge: "Aprende inglés sin descargar apps",
      titleBefore: "Aprende inglés",
      titleHighlight: "por WhatsApp con IA",
      description:
        "Clases de inglés online con lecciones cortas, IA inteligente y progreso real. Todo en la app que ya usas todos los días.",
      primaryCta: "Prueba gratis en WhatsApp",
      secondaryCta: "Cómo funciona",
      footnote: "7 días gratis · Sin tarjeta de crédito",
      online: "En línea",
      chatIntro: "🎓 ¡Hola! Soy tu coach de inglés. ¿Vamos a descubrir tu nivel?",
      chatLevel: "🔥 ¡Excelente! Tu nivel: Intermedio 📝",
      chatLessonTitle: "📖 Lección 1 — Present Perfect",
      chatLessonPrompt: "✏️ Completa: \"She ___ (work) here since 2020.\"",
    },
    socialProof: {
      stats: [
        { value: "5 min/día", label: "es todo lo que necesitas" },
        { value: "IA adaptativa", label: "aprende contigo" },
        { value: "100% WhatsApp", label: "cero descargas" },
      ],
    },
    howItWorks: {
      title: "Cómo funciona nuestro curso de inglés",
      description: "Empieza en menos de 1 minuto. Sin descargas, sin registros complicados.",
      steps: [
        { num: "1", title: 'Envía "Hello"', desc: "Abre WhatsApp y manda un mensaje simple. Listo, ya empezaste." },
        { num: "2", title: "La IA evalúa tu nivel", desc: "3 preguntas rápidas y descubres tu nivel actual de inglés." },
        {
          num: "3",
          title: "Curso guiado de 7 días",
          desc: "Recibe ejercicios guiados para tu objetivo: trabajo, viaje o conversación.",
        },
      ],
    },
    benefits: {
      title: "¿Por qué aprender inglés con SpeakEasily?",
      description: "Diferente a cualquier app o curso de inglés online que hayas probado.",
      items: [
        { title: "Sin apps complejas", desc: "Usa el WhatsApp que ya tienes instalado. Cero configuración." },
        {
          title: "5 minutos al día",
          desc: "Lecciones cortas que caben en tu rutina. Aprende en el metro, en el descanso, donde sea.",
        },
        {
          title: "Correcciones inteligentes",
          desc: "IA que entiende tus errores y te da explicaciones claras para reforzar cada punto.",
        },
        {
          title: "Enfocado en tu objetivo",
          desc: "Vocabulario y ejercicios orientados a trabajo, viajes o conversación casual.",
        },
      ],
    },
    demoChat: {
      title: "Así se ve una lección",
      description: "Un ejemplo real de cómo aprendes inglés por WhatsApp.",
      messages: [
        { side: "left", text: "📖 *Lección 3* — Ordering food", isAudio: false },
        { side: "left", text: "✏️ Traduce al inglés:\n🇪🇸 \"Me gustaría un café con leche, por favor.\"", isAudio: false },
        { side: "right", text: "I would like a coffee with milk, please.", isAudio: false },
        {
          side: "left",
          text:
            "✅ *¡Muy bien!* 🌟\n\n🇺🇸 \"I'd like a latte, please.\"\n🇪🇸 _Me gustaría un café con leche._\n\n💡 Tip: \"latte\" es más natural que \"coffee with milk\".\n\n🔁 Repite: *\"I'd like a latte, please.\"*",
          isAudio: false,
        },
        { side: "right", text: "🎤 0:04", isAudio: true },
        { side: "left", text: "🎉 *¡Perfecto!* Pronunciación clara.\n\n👉 Siguiente ejercicio →", isAudio: false },
      ],
    },
    pricing: {
      badge: "Planes simples",
      title: "Empieza gratis, crece a tu ritmo",
      description: "Sin compromisos. Cancela cuando quieras.",
      plans: [
        {
          name: "Mensual",
          period: "/mes",
          badge: null,
          cta: "Elegir mensual",
          features: ["Curso de 7 días estructurado", "Feedback IA en cada ejercicio", "Correcciones detalladas", "Práctica con audio"],
        },
        {
          name: "Trimestral",
          period: "/3 meses",
          badge: "Recomendado",
          cta: "Elegir trimestral",
          features: [
            "Curso de 7 días estructurado",
            "Práctica con audio",
            "Repaso inteligente",
            "Soporte prioritario",
            "Mejor equilibrio precio/valor",
          ],
        },
        {
          name: "Semestral",
          period: "/6 meses",
          badge: "Mejor ahorro",
          cta: "Elegir semestral",
          features: [
            "Curso de 7 días estructurado",
            "Práctica con audio",
            "Repaso inteligente",
            "Soporte prioritario",
            "Mayor ahorro a largo plazo",
          ],
        },
      ],
    },
    faq: {
      title: "Preguntas frecuentes sobre aprender inglés por WhatsApp",
      description: "Todo lo que necesitas saber sobre nuestro curso de inglés online.",
      items: [
        {
          q: "¿Cómo funciona aprender inglés por WhatsApp con SpeakEasily?",
          a: "Simplemente envías un mensaje a nuestro número de WhatsApp y nuestra IA comienza con una evaluación rápida y un curso guiado de 7 días. No necesitas descargar ninguna app ni crear una cuenta. Todo sucede en la misma conversación de WhatsApp que ya usas a diario.",
        },
        {
          q: "¿Necesito descargar alguna aplicación para las clases de inglés online?",
          a: "No, SpeakEasily funciona 100% dentro de WhatsApp. No necesitas instalar nada. Solo envía un mensaje y empieza tu curso de inglés al instante.",
        },
        {
          q: "¿Cuánto tiempo necesito al día para aprender inglés?",
          a: "Con solo 5 minutos al día puedes mejorar tu inglés. Las lecciones son cortas y están diseñadas para encajar en tu rutina: en el metro, en el descanso del trabajo o antes de dormir.",
        },
        {
          q: "¿El curso de inglés por WhatsApp es gratis?",
          a: "Sí, puedes empezar gratis con una prueba de 7 días sin necesidad de tarjeta de crédito. Después, ofrecemos planes accesibles desde 7,99€/mes para seguir aprendiendo inglés a tu ritmo.",
        },
        {
          q: "¿Cómo se adaptan las lecciones a mi nivel de inglés?",
          a: "Al comenzar, nuestra IA evalúa tu nivel con 3 preguntas rápidas. Recibes un plan de 7 días adaptado a tus objetivos y errores detectados, con correcciones personalizadas en cada ejercicio.",
        },
        {
          q: "¿Puedo aprender inglés para el trabajo o para viajar?",
          a: "Sí, SpeakEasily incluye práctica orientada a tu objetivo: inglés profesional para el trabajo, inglés práctico para viajar o conversación casual para el día a día.",
        },
        {
          q: "¿En qué idiomas está disponible SpeakEasily?",
          a: "SpeakEasily está disponible para hablantes de español, portugués e inglés. La interfaz y las explicaciones se adaptan a tu idioma nativo para que aprendas inglés de forma más natural.",
        },
      ],
    },
    finalCta: {
      title: "¿Listo para aprender inglés gratis?",
      description: "Empieza tu curso de inglés por WhatsApp y verás tu progreso en pocos días.",
      cta: "Prueba gratis en WhatsApp",
    },
    footer: {
      copyright: "© 2026 SpeakEasily · Aprende inglés por WhatsApp",
      website: "Sitio web",
      contact: "Contacto",
    },
  },
  en: {
    seo: {
      title: "SpeakEasily - Learn English via WhatsApp | Free Online English Lessons",
      description:
        "Learn English on WhatsApp with a guided 7-day course and AI. Free online English course: 5 min/day, no app downloads. Try 7 days free.",
    },
    header: { howItWorks: "How it works", benefits: "Benefits", plans: "Plans", cta: "Start free" },
    hero: {
      badge: "Learn English without downloading apps",
      titleBefore: "Learn English",
      titleHighlight: "on WhatsApp with AI",
      description:
        "Online English lessons with short sessions, smart AI, and real progress. Everything inside the app you already use every day.",
      primaryCta: "Start free on WhatsApp",
      secondaryCta: "How it works",
      footnote: "7 days free · No credit card required",
      online: "Online",
      chatIntro: "🎓 Hi! I'm your English coach. Want to discover your level?",
      chatLevel: "🔥 Excellent! Your level: Intermediate 📝",
      chatLessonTitle: "📖 Lesson 1 — Present Perfect",
      chatLessonPrompt: "✏️ Complete: \"She ___ (work) here since 2020.\"",
    },
    socialProof: {
      stats: [
        { value: "5 min/day", label: "is all you need" },
        { value: "Adaptive AI", label: "learns with you" },
        { value: "100% WhatsApp", label: "zero downloads" },
      ],
    },
    howItWorks: {
      title: "How our English course works",
      description: "Start in less than 1 minute. No downloads, no complicated sign-up.",
      steps: [
        { num: "1", title: 'Send "Hello"', desc: "Open WhatsApp and send a simple message. That's it, you've started." },
        { num: "2", title: "AI checks your level", desc: "Answer 3 quick questions and discover your current English level." },
        {
          num: "3",
          title: "Guided 7-day course",
          desc: "Receive guided exercises for your goal: work, travel, or conversation.",
        },
      ],
    },
    benefits: {
      title: "Why learn English with SpeakEasily?",
      description: "Different from any app or online English course you've tried before.",
      items: [
        { title: "No complicated apps", desc: "Use the WhatsApp you already have installed. Zero setup." },
        {
          title: "5 minutes a day",
          desc: "Short lessons that fit your routine. Learn on the train, on your break, anywhere.",
        },
        {
          title: "Smart corrections",
          desc: "AI understands your mistakes and gives clear explanations to reinforce each point.",
        },
        {
          title: "Focused on your goal",
          desc: "Vocabulary and exercises focused on work, travel, or casual conversation.",
        },
      ],
    },
    demoChat: {
      title: "What a lesson looks like",
      description: "A real example of how you learn English on WhatsApp.",
      messages: [
        { side: "left", text: "📖 *Lesson 3* — Ordering food", isAudio: false },
        { side: "left", text: "✏️ Translate into English:\n🇪🇸 \"Me gustaría un café con leche, por favor.\"", isAudio: false },
        { side: "right", text: "I would like a coffee with milk, please.", isAudio: false },
        {
          side: "left",
          text:
            "✅ *Very good!* 🌟\n\n🇺🇸 \"I'd like a latte, please.\"\n🇪🇸 _Me gustaría un café con leche._\n\n💡 Tip: \"latte\" sounds more natural than \"coffee with milk\".\n\n🔁 Repeat: *\"I'd like a latte, please.\"*",
          isAudio: false,
        },
        { side: "right", text: "🎤 0:04", isAudio: true },
        { side: "left", text: "🎉 *Perfect!* Clear pronunciation.\n\n👉 Next exercise →", isAudio: false },
      ],
    },
    pricing: {
      badge: "Simple plans",
      title: "Start free, grow at your pace",
      description: "No commitments. Cancel anytime.",
      plans: [
        {
          name: "Monthly",
          period: "/month",
          badge: null,
          cta: "Choose monthly",
          features: ["Structured 7-day course", "AI feedback on every exercise", "Detailed corrections", "Audio practice"],
        },
        {
          name: "Quarterly",
          period: "/3 months",
          badge: "Recommended",
          cta: "Choose quarterly",
          features: [
            "Structured 7-day course",
            "Audio practice",
            "Smart review",
            "Priority support",
            "Best price/value balance",
          ],
        },
        {
          name: "Biannual",
          period: "/6 months",
          badge: "Best savings",
          cta: "Choose biannual",
          features: [
            "Structured 7-day course",
            "Audio practice",
            "Smart review",
            "Priority support",
            "More long-term savings",
          ],
        },
      ],
    },
    faq: {
      title: "Frequently asked questions about learning English on WhatsApp",
      description: "Everything you need to know about our online English course.",
      items: [
        {
          q: "How does learning English on WhatsApp with SpeakEasily work?",
          a: "You simply send a message to our WhatsApp number and our AI starts with a quick level check and a guided 7-day course. You don't need to download any app or create an account. Everything happens inside the same WhatsApp chat you already use every day.",
        },
        {
          q: "Do I need to download any app for the online English lessons?",
          a: "No. SpeakEasily works 100% inside WhatsApp. You don't need to install anything. Just send a message and start your English course right away.",
        },
        {
          q: "How much time do I need each day to learn English?",
          a: "With just 5 minutes a day, you can improve your English. The lessons are short and designed to fit your routine: on the train, during a work break, or before bed.",
        },
        {
          q: "Is the English course on WhatsApp free?",
          a: "Yes. You can start free with a 7-day trial and no credit card required. After that, we offer affordable plans from €7.99/month so you can keep learning English at your own pace.",
        },
        {
          q: "How are the lessons adapted to my English level?",
          a: "When you start, our AI checks your level with 3 quick questions. You receive a 7-day plan adapted to your goals and detected mistakes, with personalized corrections in every exercise.",
        },
        {
          q: "Can I learn English for work or travel?",
          a: "Yes. SpeakEasily includes practice focused on your goal: professional English for work, practical English for travel, or casual conversation for everyday life.",
        },
        {
          q: "Which languages is SpeakEasily available in?",
          a: "SpeakEasily is available for Spanish, Portuguese, and English speakers. The interface and explanations adapt to your native language so learning English feels more natural.",
        },
      ],
    },
    finalCta: {
      title: "Ready to learn English for free?",
      description: "Start your English course on WhatsApp and see progress in just a few days.",
      cta: "Start free on WhatsApp",
    },
    footer: {
      copyright: "© 2026 SpeakEasily · Learn English on WhatsApp",
      website: "Website",
      contact: "Contact",
    },
  },
  pt: {
    seo: {
      title: "SpeakEasily - Aprenda inglês pelo WhatsApp | Aulas de inglês online grátis",
      description:
        "Aprenda inglês pelo WhatsApp com um curso guiado de 7 dias e IA. Curso de inglês online grátis: 5 min/dia, sem baixar apps. Teste 7 dias grátis.",
    },
    header: { howItWorks: "Como funciona", benefits: "Benefícios", plans: "Planos", cta: "Teste grátis" },
    hero: {
      badge: "Aprenda inglês sem baixar aplicativos",
      titleBefore: "Aprenda inglês",
      titleHighlight: "pelo WhatsApp com IA",
      description:
        "Aulas de inglês online com lições curtas, IA inteligente e progresso real. Tudo no app que você já usa todos os dias.",
      primaryCta: "Teste grátis no WhatsApp",
      secondaryCta: "Como funciona",
      footnote: "7 dias grátis · Sem cartão de crédito",
      online: "Online",
      chatIntro: "🎓 Olá! Sou seu coach de inglês. Vamos descobrir seu nível?",
      chatLevel: "🔥 Excelente! Seu nível: Intermediário 📝",
      chatLessonTitle: "📖 Lição 1 — Present Perfect",
      chatLessonPrompt: "✏️ Complete: \"She ___ (work) here since 2020.\"",
    },
    socialProof: {
      stats: [
        { value: "5 min/dia", label: "é tudo o que você precisa" },
        { value: "IA adaptativa", label: "aprende com você" },
        { value: "100% WhatsApp", label: "zero downloads" },
      ],
    },
    howItWorks: {
      title: "Como funciona nosso curso de inglês",
      description: "Comece em menos de 1 minuto. Sem downloads, sem cadastros complicados.",
      steps: [
        { num: "1", title: 'Envie "Hello"', desc: "Abra o WhatsApp e mande uma mensagem simples. Pronto, você já começou." },
        { num: "2", title: "A IA avalia seu nível", desc: "3 perguntas rápidas e você descobre seu nível atual de inglês." },
        {
          num: "3",
          title: "Curso guiado de 7 dias",
          desc: "Receba exercícios guiados para o seu objetivo: trabalho, viagem ou conversação.",
        },
      ],
    },
    benefits: {
      title: "Por que aprender inglês com SpeakEasily?",
      description: "Diferente de qualquer app ou curso de inglês online que você já testou.",
      items: [
        { title: "Sem apps complicados", desc: "Use o WhatsApp que você já tem instalado. Zero configuração." },
        {
          title: "5 minutos por dia",
          desc: "Lições curtas que cabem na sua rotina. Aprenda no metrô, no intervalo, onde quiser.",
        },
        {
          title: "Correções inteligentes",
          desc: "IA que entende seus erros e dá explicações claras para reforçar cada ponto.",
        },
        {
          title: "Focado no seu objetivo",
          desc: "Vocabulário e exercícios voltados para trabalho, viagens ou conversa casual.",
        },
      ],
    },
    demoChat: {
      title: "Assim é uma lição",
      description: "Um exemplo real de como você aprende inglês pelo WhatsApp.",
      messages: [
        { side: "left", text: "📖 *Lição 3* — Ordering food", isAudio: false },
        { side: "left", text: "✏️ Traduza para o inglês:\n🇧🇷 \"Eu gostaria de um café com leite, por favor.\"", isAudio: false },
        { side: "right", text: "I would like a coffee with milk, please.", isAudio: false },
        {
          side: "left",
          text:
            "✅ *Muito bom!* 🌟\n\n🇺🇸 \"I'd like a latte, please.\"\n🇧🇷 _Eu gostaria de um café com leite._\n\n💡 Dica: \"latte\" soa mais natural do que \"coffee with milk\".\n\n🔁 Repita: *\"I'd like a latte, please.\"*",
          isAudio: false,
        },
        { side: "right", text: "🎤 0:04", isAudio: true },
        { side: "left", text: "🎉 *Perfeito!* Pronúncia clara.\n\n👉 Próximo exercício →", isAudio: false },
      ],
    },
    pricing: {
      badge: "Planos simples",
      title: "Comece grátis, avance no seu ritmo",
      description: "Sem compromisso. Cancele quando quiser.",
      plans: [
        {
          name: "Mensal",
          period: "/mês",
          badge: null,
          cta: "Escolher mensal",
          features: ["Curso de 7 dias estruturado", "Feedback de IA em cada exercício", "Correções detalhadas", "Prática com áudio"],
        },
        {
          name: "Trimestral",
          period: "/3 meses",
          badge: "Recomendado",
          cta: "Escolher trimestral",
          features: [
            "Curso de 7 dias estruturado",
            "Prática com áudio",
            "Revisão inteligente",
            "Suporte prioritário",
            "Melhor equilíbrio entre preço e valor",
          ],
        },
        {
          name: "Semestral",
          period: "/6 meses",
          badge: "Melhor economia",
          cta: "Escolher semestral",
          features: [
            "Curso de 7 dias estruturado",
            "Prática com áudio",
            "Revisão inteligente",
            "Suporte prioritário",
            "Mais economia no longo prazo",
          ],
        },
      ],
    },
    faq: {
      title: "Perguntas frequentes sobre aprender inglês pelo WhatsApp",
      description: "Tudo o que você precisa saber sobre nosso curso de inglês online.",
      items: [
        {
          q: "Como funciona aprender inglês pelo WhatsApp com SpeakEasily?",
          a: "Você só precisa enviar uma mensagem para nosso número no WhatsApp e nossa IA começa com uma avaliação rápida e um curso guiado de 7 dias. Não é preciso baixar nenhum app nem criar conta. Tudo acontece na mesma conversa do WhatsApp que você já usa todos os dias.",
        },
        {
          q: "Preciso baixar algum aplicativo para as aulas de inglês online?",
          a: "Não. O SpeakEasily funciona 100% dentro do WhatsApp. Você não precisa instalar nada. Basta enviar uma mensagem e começar seu curso de inglês imediatamente.",
        },
        {
          q: "Quanto tempo por dia eu preciso para aprender inglês?",
          a: "Com apenas 5 minutos por dia você já consegue melhorar seu inglês. As lições são curtas e feitas para caber na sua rotina: no metrô, no intervalo do trabalho ou antes de dormir.",
        },
        {
          q: "O curso de inglês pelo WhatsApp é grátis?",
          a: "Sim. Você pode começar grátis com um teste de 7 dias sem precisar de cartão de crédito. Depois disso, oferecemos planos acessíveis a partir de €7,99/mês para continuar aprendendo no seu ritmo.",
        },
        {
          q: "Como as lições se adaptam ao meu nível de inglês?",
          a: "Ao começar, nossa IA avalia seu nível com 3 perguntas rápidas. Você recebe um plano de 7 dias adaptado aos seus objetivos e erros detectados, com correções personalizadas em cada exercício.",
        },
        {
          q: "Posso aprender inglês para trabalho ou viagem?",
          a: "Sim. O SpeakEasily inclui prática voltada ao seu objetivo: inglês profissional para trabalho, inglês prático para viagem ou conversação para o dia a dia.",
        },
        {
          q: "Em quais idiomas o SpeakEasily está disponível?",
          a: "O SpeakEasily está disponível para falantes de espanhol, português e inglês. A interface e as explicações se adaptam ao seu idioma nativo para que aprender inglês seja mais natural.",
        },
      ],
    },
    finalCta: {
      title: "Pronto para aprender inglês grátis?",
      description: "Comece seu curso de inglês pelo WhatsApp e veja progresso em poucos dias.",
      cta: "Teste grátis no WhatsApp",
    },
    footer: {
      copyright: "© 2026 SpeakEasily · Aprenda inglês pelo WhatsApp",
      website: "Site",
      contact: "Contato",
    },
  },
} as const;
