import type { Language } from "@/lib/i18n";

export interface ContentUICopy {
  heroBadge: string;
  heroCardTitle: string;
  heroCardDescription: string;
  heroCardDarkTitle: string;
  heroCardDarkDescription: string;
  heroCardDarkLabel: string;
  heroCardLabel: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  howItWorksTitle: string;
  howItWorksDescription: string;
  faqTitle: string;
  faqDescription: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaButton: string;
  internalLinksTitle: string;
  comparisonFeatures: string[];
  comparisonSpeakEasily: string;
  comparisonOthers: string;
  comparisonTitle: string;
  breadcrumbHome: string;
  headerCta: string;
  footerDescription: string;
  footerHome: string;
  footerWhatsApp: string;
  footerClasses: string;
  navLabels: Record<string, string>;
  steps: { title: string; description: string }[];
}

export const contentUICopy: Record<Language, ContentUICopy> = {
  es: {
    heroBadge: "Práctica diaria por WhatsApp",
    heroCardTitle: "Contenido práctico, claro y accionable",
    heroCardDescription:
      "Estas guías están pensadas para ayudar a usuarios reales a entender cómo aprender inglés de forma más simple, con contexto útil y sin ruido.",
    heroCardLabel: "Qué vas a encontrar",
    heroCardDarkTitle: "WhatsApp + inteligencia artificial + constancia",
    heroCardDarkDescription:
      "Una experiencia más ligera para practicar, recibir correcciones y mantener el hábito sin depender de clases pesadas.",
    heroCardDarkLabel: "Método SpeakEasily",
    heroPrimaryCta: "Prueba gratis en WhatsApp →",
    heroSecondaryCta: "Volver al inicio",
    howItWorksTitle: "Cómo funciona",
    howItWorksDescription:
      "SpeakEasily convierte tu práctica diaria de inglés en algo simple, guiado y fácil de mantener desde WhatsApp.",
    faqTitle: "Preguntas frecuentes",
    faqDescription:
      "Resolvemos las dudas más comunes para que entiendas cómo funciona SpeakEasily en WhatsApp antes de probarlo.",
    ctaTitle: "¿Listo para practicar inglés?",
    ctaDescription:
      "Escríbenos por WhatsApp y empieza tu primera lección en minutos. Sin registro, sin descargas, sin complicaciones.",
    ctaButton: "Empezar gratis por WhatsApp",
    internalLinksTitle: "También te puede interesar",
    comparisonFeatures: [
      "Aprender dentro de WhatsApp",
      "Correcciones con inteligencia artificial",
      "Lecciones cortas y fáciles de sostener",
      "Adaptación al objetivo del usuario",
    ],
    comparisonSpeakEasily: "SpeakEasily",
    comparisonOthers: "Apps tradicionales",
    comparisonTitle: "Comparativa",
    breadcrumbHome: "Inicio",
    headerCta: "Probar",
    footerDescription: "Aprende inglés por WhatsApp con ayuda de inteligencia artificial.",
    footerHome: "Inicio",
    footerWhatsApp: "WhatsApp",
    footerClasses: "Clases online",
    navLabels: {
      "aprender-ingles-por-whatsapp": "WhatsApp",
      "clases-de-ingles-online": "Clases online",
      "aprender-ingles-rapido": "Inglés rápido",
      "curso-de-ingles-gratis": "Curso gratis",
      "ingles-para-el-trabajo": "Trabajo",
      "ingles-para-viajar": "Viajar",
    },
    steps: [
      {
        title: "Escribes por WhatsApp",
        description: "Empiezas en el mismo canal que ya usas cada día, sin instalar otra app ni cambiar tu rutina.",
      },
      {
        title: "Recibes práctica guiada",
        description: "SpeakEasily te envía ejercicios breves, ejemplos claros y situaciones útiles para mejorar tu inglés.",
      },
      {
        title: "La IA corrige y adapta",
        description: "La inteligencia artificial revisa tus respuestas y enfoca la práctica en lo que más necesitas reforzar.",
      },
    ],
  },
  en: {
    heroBadge: "Daily practice on WhatsApp",
    heroCardTitle: "Practical, clear, and actionable content",
    heroCardDescription:
      "These guides are designed to help real users understand how to learn English in a simpler way, with useful context and no noise.",
    heroCardLabel: "What you'll find",
    heroCardDarkTitle: "WhatsApp + artificial intelligence + consistency",
    heroCardDarkDescription:
      "A lighter experience to practice, receive corrections, and maintain the habit without depending on heavy classes.",
    heroCardDarkLabel: "SpeakEasily Method",
    heroPrimaryCta: "Try free on WhatsApp →",
    heroSecondaryCta: "Back to home",
    howItWorksTitle: "How it works",
    howItWorksDescription:
      "SpeakEasily turns your daily English practice into something simple, guided, and easy to maintain from WhatsApp.",
    faqTitle: "Frequently asked questions",
    faqDescription:
      "We answer the most common questions so you understand how SpeakEasily works on WhatsApp before trying it.",
    ctaTitle: "Ready to practice English?",
    ctaDescription:
      "Message us on WhatsApp and start your first lesson in minutes. No sign-up, no downloads, no hassle.",
    ctaButton: "Start free on WhatsApp",
    internalLinksTitle: "You might also be interested in",
    comparisonFeatures: [
      "Learn inside WhatsApp",
      "AI-powered corrections",
      "Short, sustainable lessons",
      "Adapts to the user's goals",
    ],
    comparisonSpeakEasily: "SpeakEasily",
    comparisonOthers: "Traditional apps",
    comparisonTitle: "Comparison",
    breadcrumbHome: "Home",
    headerCta: "Try it",
    footerDescription: "Learn English on WhatsApp with the help of artificial intelligence.",
    footerHome: "Home",
    footerWhatsApp: "WhatsApp",
    footerClasses: "Online classes",
    navLabels: {
      "aprender-ingles-por-whatsapp": "WhatsApp",
      "clases-de-ingles-online": "Online classes",
      "aprender-ingles-rapido": "Learn fast",
      "curso-de-ingles-gratis": "Free course",
      "ingles-para-el-trabajo": "For work",
      "ingles-para-viajar": "For travel",
    },
    steps: [
      {
        title: "You message on WhatsApp",
        description: "You start on the same channel you already use every day, without installing another app or changing your routine.",
      },
      {
        title: "You receive guided practice",
        description: "SpeakEasily sends you short exercises, clear examples, and useful situations to improve your English.",
      },
      {
        title: "AI corrects and adapts",
        description: "Artificial intelligence reviews your answers and focuses practice on what you need to reinforce the most.",
      },
    ],
  },
  pt: {
    heroBadge: "Prática diária pelo WhatsApp",
    heroCardTitle: "Conteúdo prático, claro e acionável",
    heroCardDescription:
      "Estes guias foram pensados para ajudar usuários reais a entender como aprender inglês de forma mais simples, com contexto útil e sem ruído.",
    heroCardLabel: "O que você vai encontrar",
    heroCardDarkTitle: "WhatsApp + inteligência artificial + constância",
    heroCardDarkDescription:
      "Uma experiência mais leve para praticar, receber correções e manter o hábito sem depender de aulas pesadas.",
    heroCardDarkLabel: "Método SpeakEasily",
    heroPrimaryCta: "Teste grátis no WhatsApp →",
    heroSecondaryCta: "Voltar ao início",
    howItWorksTitle: "Como funciona",
    howItWorksDescription:
      "O SpeakEasily transforma sua prática diária de inglês em algo simples, guiado e fácil de manter pelo WhatsApp.",
    faqTitle: "Perguntas frequentes",
    faqDescription:
      "Respondemos as dúvidas mais comuns para que você entenda como o SpeakEasily funciona no WhatsApp antes de experimentar.",
    ctaTitle: "Pronto para praticar inglês?",
    ctaDescription:
      "Escreva para nós pelo WhatsApp e comece sua primeira lição em minutos. Sem cadastro, sem downloads, sem complicação.",
    ctaButton: "Começar grátis pelo WhatsApp",
    internalLinksTitle: "Também pode te interessar",
    comparisonFeatures: [
      "Aprender dentro do WhatsApp",
      "Correções com inteligência artificial",
      "Lições curtas e fáceis de manter",
      "Adaptação ao objetivo do usuário",
    ],
    comparisonSpeakEasily: "SpeakEasily",
    comparisonOthers: "Apps tradicionais",
    comparisonTitle: "Comparação",
    breadcrumbHome: "Início",
    headerCta: "Testar",
    footerDescription: "Aprenda inglês pelo WhatsApp com ajuda de inteligência artificial.",
    footerHome: "Início",
    footerWhatsApp: "WhatsApp",
    footerClasses: "Aulas online",
    navLabels: {
      "aprender-ingles-por-whatsapp": "WhatsApp",
      "clases-de-ingles-online": "Aulas online",
      "aprender-ingles-rapido": "Inglês rápido",
      "curso-de-ingles-gratis": "Curso grátis",
      "ingles-para-el-trabajo": "Trabalho",
      "ingles-para-viajar": "Viajar",
    },
    steps: [
      {
        title: "Você escreve pelo WhatsApp",
        description: "Começa no mesmo canal que já usa todos os dias, sem instalar outro app nem mudar sua rotina.",
      },
      {
        title: "Recebe prática guiada",
        description: "O SpeakEasily envia exercícios breves, exemplos claros e situações úteis para melhorar seu inglês.",
      },
      {
        title: "A IA corrige e adapta",
        description: "A inteligência artificial revisa suas respostas e foca a prática no que você mais precisa reforçar.",
      },
    ],
  },
};
