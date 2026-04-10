import type { Language } from "@/lib/i18n";
import { newEsPages, newEnPages, newPtPages } from "./newContentPages";

export type ContentPage = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  benefits: {
    icon: string;
    title: string;
    description: string;
  }[];
  faq: {
    question: string;
    answer: string;
  }[];
  internalLinks: {
    href: string;
    label: string;
  }[];
};

const esPages: ContentPage[] = [
  {
    slug: "aprender-ingles-por-whatsapp",
    metaTitle: "Aprender inglés por WhatsApp con IA | SpeakEasily",
    metaDescription:
      "Aprende inglés por WhatsApp con lecciones cortas, práctica real e inteligencia artificial. Empieza gratis y mejora tu inglés cada día.",
    h1: "Aprender inglés por WhatsApp es más fácil de lo que parece",
    intro:
      "Si ya usas WhatsApp todos los días, también puedes usarlo para mejorar tu inglés sin complicarte la vida. En lugar de abrir otra app, memorizar listas eternas o perder tiempo con clases difíciles de mantener, puedes practicar desde una conversación real y simple. SpeakEasily combina WhatsApp con inteligencia artificial para enviarte ejercicios breves, correcciones claras y una estructura guiada de 7 días. Es una forma cómoda de avanzar poco a poco, con constancia, sin sentir que estás empezando de cero cada semana.",
    benefits: [
      {
        icon: "message-circle",
        title: "Todo pasa en WhatsApp",
        description:
          "No necesitas instalar herramientas nuevas ni aprender a usar otra plataforma. Practicas inglés en el entorno que ya conoces.",
      },
      {
        icon: "brain",
        title: "IA que refuerza tus fallos",
        description:
          "La inteligencia artificial detecta tus errores más comunes y ajusta las explicaciones para que entiendas mejor cada punto.",
      },
      {
        icon: "clock-3",
        title: "Rutina realista",
        description:
          "Puedes avanzar con sesiones cortas de pocos minutos, ideal si trabajas, estudias o simplemente no quieres depender de horarios fijos.",
      },
    ],
    faq: [
      {
        question: "¿De verdad se puede aprender inglés por WhatsApp?",
        answer:
          "Sí. La clave no es la app en sí, sino la constancia y la calidad de la práctica. WhatsApp facilita que practiques cada día de forma natural y sin fricción.",
      },
      {
        question: "¿Qué hace la inteligencia artificial en SpeakEasily?",
        answer:
          "La inteligencia artificial analiza tus respuestas, corrige errores y activa repasos inteligentes basados en tus fallos reales.",
      },
      {
        question: "¿Sirve si tengo poco tiempo?",
        answer:
          "Sí. Está pensado para personas que quieren avanzar con lecciones cortas y sostenibles, sin depender de clases largas o calendarios complejos.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Volver al inicio" },
      { href: "/clases-de-ingles-online", label: "Ver clases de inglés online" },
      { href: "/aprender-ingles-rapido", label: "Descubrir cómo aprender inglés rápido" },
    ],
  },
  {
    slug: "clases-de-ingles-online",
    metaTitle: "Clases de inglés online con IA y WhatsApp",
    metaDescription:
      "Descubre clases de inglés online por WhatsApp con inteligencia artificial, práctica guiada y una experiencia flexible para tu ritmo.",
    h1: "Clases de inglés online que sí encajan en tu vida",
    intro:
      "Muchas personas abandonan las clases de inglés online porque les piden demasiado tiempo, demasiada organización o demasiada energía al final del día. La idea de SpeakEasily es justo la contraria: llevar el aprendizaje a un formato simple, directo y fácil de mantener. A través de WhatsApp y con apoyo de inteligencia artificial, recibes actividades breves, correcciones y práctica enfocada en situaciones reales. Así no dependes de horarios rígidos ni de videollamadas eternas. Aprendes cuando puedes, pero con una estructura clara para seguir avanzando.",
    benefits: [
      {
        icon: "monitor-smartphone",
        title: "Sin clases pesadas",
        description:
          "No necesitas reservar una hora ni conectarte a una plataforma compleja. Tu clase sucede en pequeños bloques dentro de WhatsApp.",
      },
      {
        icon: "sparkles",
        title: "Contenido guiado",
        description:
          "El curso combina una estructura de 7 días con correcciones y repaso inteligente basado en tus errores reales.",
      },
      {
        icon: "target",
        title: "Más útil para la vida real",
        description:
          "Practicas vocabulario, estructuras y respuestas que puedes usar en trabajo, viajes o conversaciones cotidianas.",
      },
    ],
    faq: [
      {
        question: "¿En qué se diferencian estas clases de inglés online?",
        answer:
          "Se diferencian en que son más ligeras, más prácticas y más fáciles de mantener. Usas WhatsApp y recibes apoyo de inteligencia artificial en cada paso.",
      },
      {
        question: "¿Necesito hacer videollamadas?",
        answer:
          "No. El sistema está pensado para funcionar dentro de WhatsApp, con mensajes, ejercicios y práctica guiada sin depender de videollamadas.",
      },
      {
        question: "¿Es útil para principiantes y niveles intermedios?",
        answer:
          "Sí. La evaluación inicial detecta tu nivel, y el recorrido guiado actual se centra en una base A1 con repaso inteligente de tus errores.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Volver al inicio" },
      { href: "/aprender-ingles-por-whatsapp", label: "Aprender inglés por WhatsApp" },
      { href: "/curso-de-ingles-gratis", label: "Explorar un curso de inglés gratis" },
    ],
  },
  {
    slug: "aprender-ingles-rapido",
    metaTitle: "Cómo aprender inglés rápido con WhatsApp e IA",
    metaDescription:
      "Aprende inglés rápido con microlecciones por WhatsApp, correcciones con inteligencia artificial y práctica enfocada en situaciones reales.",
    h1: "Cómo aprender inglés rápido sin agobiarte en el intento",
    intro:
      "Aprender inglés rápido no significa estudiar sin parar durante semanas y agotarte al tercer día. Normalmente significa aprender mejor, practicar más a menudo y enfocarte en lo que realmente te sirve. Ahí es donde SpeakEasily marca la diferencia. En WhatsApp recibes ejercicios cortos, revisión inmediata y apoyo de inteligencia artificial para corregir errores en el momento. En lugar de avanzar por teoría infinita, trabajas con ejemplos claros y repetición útil. Esa combinación de constancia, feedback rápido y contenido relevante es la que suele acelerar el progreso de verdad.",
    benefits: [
      {
        icon: "zap",
        title: "Feedback inmediato",
        description:
          "Cuando corriges un error en el momento, aprendes más rápido que si esperas días para revisar lo que fallaste.",
      },
      {
        icon: "repeat",
        title: "Repetición útil",
        description:
          "WhatsApp facilita practicar a diario y volver a estructuras importantes hasta que empiecen a salir con naturalidad.",
      },
      {
        icon: "bot",
        title: "IA centrada en tus fallos",
        description:
          "La inteligencia artificial no te da ejercicios al azar: se enfoca en lo que necesitas reforzar para avanzar antes.",
      },
    ],
    faq: [
      {
        question: "¿Se puede aprender inglés rápido de verdad?",
        answer:
          "Sí, pero suele depender más del sistema que de la intensidad. Si practicas con frecuencia, recibes correcciones claras y trabajas objetivos concretos, el avance llega antes.",
      },
      {
        question: "¿Qué método usa SpeakEasily?",
        answer:
          "Combina microlecciones, práctica por WhatsApp, correcciones inmediatas e inteligencia artificial para mantener una progresión constante con repaso inteligente.",
      },
      {
        question: "¿Cuánto tiempo necesito al día?",
        answer:
          "No necesitas horas. Lo más importante es una práctica breve pero frecuente, algo que puedas sostener cada día sin romper tu rutina.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Volver al inicio" },
      { href: "/clases-de-ingles-online", label: "Ver clases de inglés online" },
      { href: "/ingles-para-el-trabajo", label: "Mejorar inglés para el trabajo" },
    ],
  },
  {
    slug: "curso-de-ingles-gratis",
    metaTitle: "Curso de inglés gratis por WhatsApp con IA",
    metaDescription:
      "Empieza un curso de inglés gratis por WhatsApp con inteligencia artificial, lecciones simples y práctica real desde tu móvil.",
    h1: "Un curso de inglés gratis puede ser el mejor punto de partida",
    intro:
      "Empezar con un curso de inglés gratis es una forma inteligente de comprobar si un método encaja contigo antes de comprometerte más. El problema es que muchos cursos gratuitos son demasiado básicos, impersonales o están llenos de promesas y poca práctica real. SpeakEasily plantea algo más útil: comenzar gratis dentro de WhatsApp, con ejercicios breves y apoyo de inteligencia artificial para darte correcciones y mantener el ritmo. Así puedes probar una experiencia real de aprendizaje, ver si se adapta a tu día a día y decidir con más criterio cómo quieres seguir avanzando.",
    benefits: [
      {
        icon: "gift",
        title: "Entrada fácil",
        description:
          "Puedes empezar sin fricción, entender cómo funciona el sistema y ver si el formato por WhatsApp se adapta a tu rutina.",
      },
      {
        icon: "circle-check-big",
        title: "Experiencia útil desde el primer día",
        description:
          "No se trata solo de contenido promocional. La práctica con inteligencia artificial te permite probar el valor real del método.",
      },
      {
        icon: "wallet",
        title: "Menos riesgo, mejor decisión",
        description:
          "Antes de pagar nada, puedes comprobar si el enfoque, el ritmo y la claridad de las correcciones son lo que necesitas.",
      },
    ],
    faq: [
      {
        question: "¿Qué incluye el curso de inglés gratis?",
        answer:
          "Incluye una muestra real del aprendizaje por WhatsApp, con lecciones breves, práctica guiada y apoyo de inteligencia artificial para corregir respuestas.",
      },
      {
        question: "¿Es solo para principiantes?",
        answer:
          "La evaluación inicial identifica tu nivel, pero el curso guiado actual trabaja una base A1 de 7 días con correcciones y repaso inteligente.",
      },
      {
        question: "¿Luego tengo que continuar obligatoriamente?",
        answer:
          "No. La idea de empezar gratis es precisamente que pruebes si te funciona antes de decidir si quieres seguir.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Volver al inicio" },
      { href: "/aprender-ingles-por-whatsapp", label: "Aprender inglés por WhatsApp" },
      { href: "/ingles-para-viajar", label: "Practicar inglés para viajar" },
    ],
  },
  {
    slug: "ingles-para-el-trabajo",
    metaTitle: "Inglés para el trabajo con WhatsApp e IA",
    metaDescription:
      "Mejora tu inglés para el trabajo con práctica por WhatsApp, inteligencia artificial y lecciones enfocadas en situaciones profesionales.",
    h1: "Inglés para el trabajo sin perder tiempo con contenido irrelevante",
    intro:
      "Cuando necesitas inglés para el trabajo, no buscas un curso lleno de temas genéricos que tardan meses en llegar a lo útil. Lo que necesitas es practicar vocabulario, respuestas y estructuras que realmente aparecen en reuniones, correos, entrevistas o conversaciones con clientes. SpeakEasily te ayuda a hacerlo desde WhatsApp, con una experiencia más ligera y constante. La inteligencia artificial corrige tus respuestas y te ayuda a reforzar errores frecuentes con repaso inteligente. Así puedes mejorar paso a paso sin desconectarte de tu rutina laboral ni depender de clases largas difíciles de mantener.",
    benefits: [
      {
        icon: "briefcase-business",
        title: "Enfoque profesional",
        description:
          "La práctica puede centrarse en contextos laborales reales como presentaciones, reuniones, correos y comunicación diaria.",
      },
      {
        icon: "messages-square",
        title: "Aprendizaje integrado en tu día",
        description:
          "Usar WhatsApp hace más fácil encontrar pequeños momentos para practicar sin bloquear una hora completa en agenda.",
      },
      {
        icon: "brain-circuit",
        title: "Correcciones más útiles",
        description:
          "La inteligencia artificial detecta errores frecuentes y te ayuda a sonar más claro, natural y profesional.",
      },
    ],
    faq: [
      {
        question: "¿Sirve para entrevistas y reuniones?",
        answer:
          "Sí. Puede ayudarte a practicar estructuras, vocabulario y respuestas frecuentes en situaciones profesionales donde necesitas comunicarte con más seguridad.",
      },
      {
        question: "¿Tengo que tener un nivel alto para empezar?",
        answer:
          "No. Puedes empezar desde un nivel básico o intermedio y trabajar el inglés profesional de forma progresiva.",
      },
      {
        question: "¿Qué aporta la inteligencia artificial aquí?",
        answer:
          "Aporta correcciones rápidas, repaso inteligente de tus errores y práctica útil para situaciones reales de trabajo.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Volver al inicio" },
      { href: "/clases-de-ingles-online", label: "Explorar clases de inglés online" },
      { href: "/aprender-ingles-rapido", label: "Aprender inglés más rápido" },
    ],
  },
  {
    slug: "ingles-para-viajar",
    metaTitle: "Inglés para viajar con práctica en WhatsApp",
    metaDescription:
      "Practica inglés para viajar por WhatsApp con inteligencia artificial y lecciones breves para hablar con más seguridad en tus viajes.",
    h1: "Inglés para viajar con más confianza y menos bloqueos",
    intro:
      "Aprender inglés para viajar no va solo de memorizar frases sueltas. Lo importante es sentirte capaz de pedir ayuda, entender respuestas, resolver situaciones y hablar con más calma cuando estás fuera de casa. SpeakEasily te permite practicar ese tipo de inglés desde WhatsApp, con lecciones simples y una dinámica fácil de seguir. Gracias a la inteligencia artificial, puedes recibir correcciones, repetir estructuras útiles y reforzar vocabulario clave para aeropuertos, hoteles, restaurantes o desplazamientos. Es una forma práctica de llegar a tu próximo viaje con más seguridad y menos miedo a quedarte en blanco.",
    benefits: [
      {
        icon: "plane",
        title: "Vocabulario para situaciones reales",
        description:
          "Practicas expresiones que sí aparecen cuando viajas: pedir direcciones, hacer check-in, preguntar precios o resolver imprevistos.",
      },
      {
        icon: "map-pinned",
        title: "Más confianza para comunicarte",
        description:
          "Al repetir contextos habituales en WhatsApp, te resulta más fácil reaccionar cuando estás cara a cara durante el viaje.",
      },
      {
        icon: "cpu",
        title: "IA que corrige y refuerza",
        description:
          "La inteligencia artificial te ayuda a detectar errores, fijar frases útiles y entender formas más naturales de expresarte.",
      },
    ],
    faq: [
      {
        question: "¿Qué tipo de inglés se practica para viajar?",
        answer:
          "Se practica inglés funcional para situaciones cotidianas: transporte, alojamiento, comida, compras, preguntas básicas y resolución de problemas.",
      },
      {
        question: "¿Puedo usar SpeakEasily antes de un viaje cercano?",
        answer:
          "Sí. Es especialmente útil si quieres reforzar rápido expresiones prácticas y ganar soltura en poco tiempo desde WhatsApp.",
      },
      {
        question: "¿También ayuda con comprensión?",
        answer:
          "Sí. Además de practicar respuestas, puedes acostumbrarte a estructuras y vocabulario que luego aparecen en conversaciones reales durante el viaje.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Volver al inicio" },
      { href: "/curso-de-ingles-gratis", label: "Probar un curso de inglés gratis" },
      { href: "/aprender-ingles-por-whatsapp", label: "Ver cómo aprender inglés por WhatsApp" },
    ],
  },
];

const enPages: ContentPage[] = [
  {
    slug: "aprender-ingles-por-whatsapp",
    metaTitle: "Learn English on WhatsApp with AI | SpeakEasily",
    metaDescription:
      "Learn English on WhatsApp with short lessons, real practice, and artificial intelligence. Start free and improve your English every day.",
    h1: "Learning English on WhatsApp is easier than you think",
    intro:
      "If you already use WhatsApp every day, you can also use it to improve your English without complicating your life. Instead of opening another app, memorizing endless lists, or wasting time with classes that don't adapt to you, you can practice through a real and simple conversation. SpeakEasily combines WhatsApp with artificial intelligence to send you short exercises, clear corrections, and useful practice based on your level. It's a comfortable way to progress step by step, with consistency, without feeling like you're starting from scratch every week.",
    benefits: [
      {
        icon: "message-circle",
        title: "Everything happens on WhatsApp",
        description:
          "You don't need to install new tools or learn to use another platform. You practice English in the environment you already know.",
      },
      {
        icon: "brain",
        title: "AI that adapts to you",
        description:
          "Artificial intelligence detects your most common mistakes and adjusts explanations so you understand each point better.",
      },
      {
        icon: "clock-3",
        title: "Realistic routine",
        description:
          "You can progress with short sessions of just a few minutes, ideal if you work, study, or simply don't want to depend on fixed schedules.",
      },
    ],
    faq: [
      {
        question: "Can you really learn English on WhatsApp?",
        answer:
          "Yes. The key is not the app itself, but consistency and quality of practice. WhatsApp makes it easy to practice every day naturally and without friction.",
      },
      {
        question: "What does artificial intelligence do in SpeakEasily?",
        answer:
          "AI analyzes your answers, corrects mistakes, adapts exercises, and gives you explanations based on your level and goals.",
      },
      {
        question: "Does it work if I have little time?",
        answer:
          "Yes. It's designed for people who want to progress with short, sustainable lessons, without depending on long classes or complex schedules.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Back to home" },
      { href: "/clases-de-ingles-online", label: "See online English classes" },
      { href: "/aprender-ingles-rapido", label: "Discover how to learn English fast" },
    ],
  },
  {
    slug: "clases-de-ingles-online",
    metaTitle: "Online English classes with AI and WhatsApp",
    metaDescription:
      "Discover online English classes on WhatsApp with artificial intelligence, personalized practice, and a flexible experience at your pace.",
    h1: "Online English classes that actually fit your life",
    intro:
      "Many people quit online English classes because they demand too much time, too much organization, or too much energy at the end of the day. SpeakEasily's idea is exactly the opposite: bring learning to a simple, direct, and easy-to-maintain format. Through WhatsApp and with AI support, you receive short activities, corrections, and practice focused on real situations. You don't depend on rigid schedules or endless video calls. You learn when you can, but with a clear structure to keep progressing.",
    benefits: [
      {
        icon: "monitor-smartphone",
        title: "No heavy classes",
        description:
          "You don't need to book an hour or connect to a complex platform. Your class happens in small blocks inside WhatsApp.",
      },
      {
        icon: "sparkles",
        title: "Personalized content",
        description:
          "AI adapts examples, corrections, and exercises to your current level to avoid wasting time with generic content.",
      },
      {
        icon: "target",
        title: "More useful for real life",
        description:
          "You practice vocabulary, structures, and answers that you can use at work, traveling, or in everyday conversations.",
      },
    ],
    faq: [
      {
        question: "How are these online English classes different?",
        answer:
          "They are lighter, more practical, and easier to maintain. You use WhatsApp and receive AI support at every step.",
      },
      {
        question: "Do I need to do video calls?",
        answer:
          "No. The system is designed to work inside WhatsApp, with messages, exercises, and guided practice without depending on video calls.",
      },
      {
        question: "Is it useful for beginners and intermediate levels?",
        answer:
          "Yes. SpeakEasily can adapt whether you're just starting or want to recover fluency and correct frequent mistakes.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Back to home" },
      { href: "/aprender-ingles-por-whatsapp", label: "Learn English on WhatsApp" },
      { href: "/curso-de-ingles-gratis", label: "Explore a free English course" },
    ],
  },
  {
    slug: "aprender-ingles-rapido",
    metaTitle: "How to learn English fast with WhatsApp and AI",
    metaDescription:
      "Learn English fast with micro-lessons on WhatsApp, AI corrections, and practice focused on real situations.",
    h1: "How to learn English fast without burning out",
    intro:
      "Learning English fast doesn't mean studying non-stop for weeks and burning out on the third day. It usually means learning better, practicing more often, and focusing on what really serves you. That's where SpeakEasily makes the difference. On WhatsApp, you receive short exercises, immediate review, and AI support to correct errors on the spot. Instead of advancing through endless theory, you work with clear examples and useful repetition. That combination of consistency, quick feedback, and relevant content is what truly accelerates progress.",
    benefits: [
      {
        icon: "zap",
        title: "Immediate feedback",
        description:
          "When you correct a mistake on the spot, you learn faster than if you wait days to review what you got wrong.",
      },
      {
        icon: "repeat",
        title: "Useful repetition",
        description:
          "WhatsApp makes it easy to practice daily and return to important structures until they come out naturally.",
      },
      {
        icon: "bot",
        title: "AI focused on your mistakes",
        description:
          "AI doesn't give you random exercises: it focuses on what you need to reinforce to advance faster.",
      },
    ],
    faq: [
      {
        question: "Can you really learn English fast?",
        answer:
          "Yes, but it usually depends more on the system than on intensity. If you practice frequently, receive clear corrections, and work on specific goals, progress comes sooner.",
      },
      {
        question: "What method does SpeakEasily use?",
        answer:
          "It combines micro-lessons, WhatsApp practice, immediate corrections, and AI to maintain constant and personalized progression.",
      },
      {
        question: "How much time do I need per day?",
        answer:
          "You don't need hours. The most important thing is brief but frequent practice, something you can sustain every day without breaking your routine.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Back to home" },
      { href: "/clases-de-ingles-online", label: "See online English classes" },
      { href: "/ingles-para-el-trabajo", label: "Improve English for work" },
    ],
  },
  {
    slug: "curso-de-ingles-gratis",
    metaTitle: "Free English course on WhatsApp with AI",
    metaDescription:
      "Start a free English course on WhatsApp with artificial intelligence, simple lessons, and real practice from your phone.",
    h1: "A free English course can be the best starting point",
    intro:
      "Starting with a free English course is a smart way to check if a method works for you before committing further. The problem is that many free courses are too basic, impersonal, or full of promises with little real practice. SpeakEasily offers something more useful: start free inside WhatsApp, with short exercises and AI support to give you corrections and keep the pace. This way you can try a real learning experience, see if it fits your daily life, and make a better-informed decision about how you want to keep progressing.",
    benefits: [
      {
        icon: "gift",
        title: "Easy entry",
        description:
          "You can start without friction, understand how the system works, and see if the WhatsApp format fits your routine.",
      },
      {
        icon: "circle-check-big",
        title: "Useful experience from day one",
        description:
          "It's not just promotional content. Practicing with AI lets you experience the real value of the method.",
      },
      {
        icon: "wallet",
        title: "Less risk, better decision",
        description:
          "Before paying anything, you can check if the approach, pace, and clarity of corrections are what you need.",
      },
    ],
    faq: [
      {
        question: "What does the free English course include?",
        answer:
          "It includes a real sample of WhatsApp learning, with short lessons, guided practice, and AI support to correct answers.",
      },
      {
        question: "Is it only for beginners?",
        answer:
          "No. It can also work if you've studied before and want to pick up English again with a more practical and lighter format.",
      },
      {
        question: "Do I have to continue afterward?",
        answer:
          "No. The idea of starting free is precisely so you can test if it works for you before deciding whether to continue.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Back to home" },
      { href: "/aprender-ingles-por-whatsapp", label: "Learn English on WhatsApp" },
      { href: "/ingles-para-viajar", label: "Practice English for travel" },
    ],
  },
  {
    slug: "ingles-para-el-trabajo",
    metaTitle: "English for work with WhatsApp and AI",
    metaDescription:
      "Improve your English for work with WhatsApp practice, artificial intelligence, and lessons focused on professional situations.",
    h1: "English for work without wasting time on irrelevant content",
    intro:
      "When you need English for work, you're not looking for a course full of generic topics that take months to get to what's useful. What you need is to practice vocabulary, answers, and structures that actually come up in meetings, emails, interviews, or conversations with clients. SpeakEasily helps you do this from WhatsApp, with a lighter and more consistent experience. AI adapts corrections and proposes exercises more aligned with professional goals. This way you can improve step by step without disconnecting from your work routine or depending on long classes that are hard to maintain.",
    benefits: [
      {
        icon: "briefcase-business",
        title: "Professional focus",
        description:
          "Practice can focus on real work contexts like presentations, meetings, emails, and daily communication.",
      },
      {
        icon: "messages-square",
        title: "Learning integrated into your day",
        description:
          "Using WhatsApp makes it easier to find small moments to practice without blocking a full hour in your schedule.",
      },
      {
        icon: "brain-circuit",
        title: "More useful corrections",
        description:
          "AI detects frequent mistakes and helps you sound clearer, more natural, and more professional.",
      },
    ],
    faq: [
      {
        question: "Does it work for interviews and meetings?",
        answer:
          "Yes. It can help you practice structures, vocabulary, and frequent answers in professional situations where you need to communicate with more confidence.",
      },
      {
        question: "Do I need a high level to start?",
        answer:
          "No. You can start from a basic or intermediate level and work on professional English progressively.",
      },
      {
        question: "What does AI contribute here?",
        answer:
          "It provides quick corrections, content adaptation, and practice more aligned with your real work needs.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Back to home" },
      { href: "/clases-de-ingles-online", label: "Explore online English classes" },
      { href: "/aprender-ingles-rapido", label: "Learn English faster" },
    ],
  },
  {
    slug: "ingles-para-viajar",
    metaTitle: "English for travel with WhatsApp practice",
    metaDescription:
      "Practice English for travel on WhatsApp with artificial intelligence and short lessons to speak with more confidence on your trips.",
    h1: "English for travel with more confidence and fewer blocks",
    intro:
      "Learning English for travel is not just about memorizing random phrases. What matters is feeling capable of asking for help, understanding answers, solving situations, and speaking more calmly when you're away from home. SpeakEasily lets you practice this kind of English from WhatsApp, with simple lessons and an easy-to-follow dynamic. Thanks to AI, you can receive corrections, repeat useful structures, and reinforce key vocabulary for airports, hotels, restaurants, or getting around. It's a practical way to arrive at your next trip with more confidence and less fear of drawing a blank.",
    benefits: [
      {
        icon: "plane",
        title: "Vocabulary for real situations",
        description:
          "You practice expressions that actually come up when traveling: asking for directions, checking in, asking prices, or solving unexpected issues.",
      },
      {
        icon: "map-pinned",
        title: "More confidence to communicate",
        description:
          "By repeating common contexts on WhatsApp, it's easier to react when you're face to face during your trip.",
      },
      {
        icon: "cpu",
        title: "AI that corrects and reinforces",
        description:
          "AI helps you detect errors, fix useful phrases, and understand more natural ways to express yourself.",
      },
    ],
    faq: [
      {
        question: "What type of English is practiced for travel?",
        answer:
          "Functional English for everyday situations: transport, accommodation, food, shopping, basic questions, and problem solving.",
      },
      {
        question: "Can I use SpeakEasily before an upcoming trip?",
        answer:
          "Yes. It's especially useful if you want to quickly reinforce practical expressions and gain fluency in a short time from WhatsApp.",
      },
      {
        question: "Does it also help with comprehension?",
        answer:
          "Yes. In addition to practicing answers, you can get used to structures and vocabulary that then appear in real conversations during your trip.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Back to home" },
      { href: "/curso-de-ingles-gratis", label: "Try a free English course" },
      { href: "/aprender-ingles-por-whatsapp", label: "See how to learn English on WhatsApp" },
    ],
  },
];

const ptPages: ContentPage[] = [
  {
    slug: "aprender-ingles-por-whatsapp",
    metaTitle: "Aprender inglês pelo WhatsApp com IA | SpeakEasily",
    metaDescription:
      "Aprenda inglês pelo WhatsApp com lições curtas, prática real e inteligência artificial. Comece grátis e melhore seu inglês todos os dias.",
    h1: "Aprender inglês pelo WhatsApp é mais fácil do que parece",
    intro:
      "Se você já usa o WhatsApp todos os dias, também pode usá-lo para melhorar seu inglês sem complicar a vida. Em vez de abrir outro app, decorar listas intermináveis ou perder tempo com aulas que não se adaptam a você, pode praticar a partir de uma conversa real e simples. O SpeakEasily combina WhatsApp com inteligência artificial para enviar exercícios curtos, correções claras e prática útil de acordo com seu nível. É uma forma confortável de avançar aos poucos, com constância, sem sentir que está recomeçando do zero toda semana.",
    benefits: [
      {
        icon: "message-circle",
        title: "Tudo acontece no WhatsApp",
        description:
          "Você não precisa instalar ferramentas novas nem aprender a usar outra plataforma. Pratica inglês no ambiente que já conhece.",
      },
      {
        icon: "brain",
        title: "IA que se adapta a você",
        description:
          "A inteligência artificial detecta seus erros mais comuns e ajusta as explicações para que você entenda melhor cada ponto.",
      },
      {
        icon: "clock-3",
        title: "Rotina realista",
        description:
          "Você pode avançar com sessões curtas de poucos minutos, ideal se trabalha, estuda ou simplesmente não quer depender de horários fixos.",
      },
    ],
    faq: [
      {
        question: "Dá mesmo para aprender inglês pelo WhatsApp?",
        answer:
          "Sim. A chave não é o app em si, mas a constância e a qualidade da prática. O WhatsApp facilita praticar todos os dias de forma natural e sem atrito.",
      },
      {
        question: "O que a inteligência artificial faz no SpeakEasily?",
        answer:
          "A IA analisa suas respostas, corrige erros, adapta exercícios e dá explicações de acordo com seu nível e objetivo.",
      },
      {
        question: "Funciona se eu tenho pouco tempo?",
        answer:
          "Sim. Foi pensado para pessoas que querem avançar com lições curtas e sustentáveis, sem depender de aulas longas ou calendários complexos.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Voltar ao início" },
      { href: "/clases-de-ingles-online", label: "Ver aulas de inglês online" },
      { href: "/aprender-ingles-rapido", label: "Descubrir como aprender inglês rápido" },
    ],
  },
  {
    slug: "clases-de-ingles-online",
    metaTitle: "Aulas de inglês online com IA e WhatsApp",
    metaDescription:
      "Descubra aulas de inglês online pelo WhatsApp com inteligência artificial, prática personalizada e uma experiência flexível no seu ritmo.",
    h1: "Aulas de inglês online que realmente encaixam na sua vida",
    intro:
      "Muitas pessoas abandonam as aulas de inglês online porque pedem tempo demais, organização demais ou energia demais no final do dia. A ideia do SpeakEasily é exatamente o oposto: levar o aprendizado para um formato simples, direto e fácil de manter. Pelo WhatsApp e com apoio de inteligência artificial, você recebe atividades breves, correções e prática focada em situações reais. Assim não depende de horários rígidos nem de videochamadas intermináveis. Aprende quando pode, mas com uma estrutura clara para continuar avançando.",
    benefits: [
      {
        icon: "monitor-smartphone",
        title: "Sem aulas pesadas",
        description:
          "Você não precisa reservar uma hora nem se conectar a uma plataforma complexa. Sua aula acontece em pequenos blocos dentro do WhatsApp.",
      },
      {
        icon: "sparkles",
        title: "Conteúdo personalizado",
        description:
          "A inteligência artificial adapta exemplos, correções e exercícios ao seu nível atual para evitar que perca tempo com conteúdo genérico.",
      },
      {
        icon: "target",
        title: "Mais útil para a vida real",
        description:
          "Você pratica vocabulário, estruturas e respostas que pode usar no trabalho, em viagens ou em conversas do dia a dia.",
      },
    ],
    faq: [
      {
        question: "No que essas aulas de inglês online são diferentes?",
        answer:
          "São mais leves, mais práticas e mais fáceis de manter. Você usa o WhatsApp e recebe apoio de inteligência artificial em cada passo.",
      },
      {
        question: "Preciso fazer videochamadas?",
        answer:
          "Não. O sistema foi pensado para funcionar dentro do WhatsApp, com mensagens, exercícios e prática guiada sem depender de videochamadas.",
      },
      {
        question: "É útil para iniciantes e níveis intermediários?",
        answer:
          "Sim. O SpeakEasily pode se adaptar tanto se você está começando quanto se quer recuperar fluência e corrigir erros frequentes.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Voltar ao início" },
      { href: "/aprender-ingles-por-whatsapp", label: "Aprender inglês pelo WhatsApp" },
      { href: "/curso-de-ingles-gratis", label: "Explorar um curso de inglês grátis" },
    ],
  },
  {
    slug: "aprender-ingles-rapido",
    metaTitle: "Como aprender inglês rápido com WhatsApp e IA",
    metaDescription:
      "Aprenda inglês rápido com microlições pelo WhatsApp, correções com inteligência artificial e prática focada em situações reais.",
    h1: "Como aprender inglês rápido sem se esgotar na tentativa",
    intro:
      "Aprender inglês rápido não significa estudar sem parar durante semanas e se esgotar no terceiro dia. Normalmente significa aprender melhor, praticar com mais frequência e focar no que realmente serve. É aí que o SpeakEasily faz a diferença. No WhatsApp, você recebe exercícios curtos, revisão imediata e apoio de inteligência artificial para corrigir erros na hora. Em vez de avançar por teoria infinita, você trabalha com exemplos claros e repetição útil. Essa combinação de constância, feedback rápido e conteúdo relevante é o que costuma acelerar o progresso de verdade.",
    benefits: [
      {
        icon: "zap",
        title: "Feedback imediato",
        description:
          "Quando você corrige um erro na hora, aprende mais rápido do que se esperar dias para revisar o que errou.",
      },
      {
        icon: "repeat",
        title: "Repetição útil",
        description:
          "O WhatsApp facilita praticar diariamente e voltar a estruturas importantes até que saiam com naturalidade.",
      },
      {
        icon: "bot",
        title: "IA focada nos seus erros",
        description:
          "A inteligência artificial não dá exercícios aleatórios: foca no que você precisa reforçar para avançar antes.",
      },
    ],
    faq: [
      {
        question: "Dá para aprender inglês rápido de verdade?",
        answer:
          "Sim, mas costuma depender mais do sistema do que da intensidade. Se você pratica com frequência, recebe correções claras e trabalha objetivos concretos, o avanço chega antes.",
      },
      {
        question: "Que método o SpeakEasily usa?",
        answer:
          "Combina microlições, prática pelo WhatsApp, correções imediatas e inteligência artificial para manter uma progressão constante e personalizada.",
      },
      {
        question: "Quanto tempo preciso por dia?",
        answer:
          "Não precisa de horas. O mais importante é uma prática breve mas frequente, algo que consiga manter todos os dias sem quebrar a rotina.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Voltar ao início" },
      { href: "/clases-de-ingles-online", label: "Ver aulas de inglês online" },
      { href: "/ingles-para-el-trabajo", label: "Melhorar inglês para o trabalho" },
    ],
  },
  {
    slug: "curso-de-ingles-gratis",
    metaTitle: "Curso de inglês grátis pelo WhatsApp com IA",
    metaDescription:
      "Comece um curso de inglês grátis pelo WhatsApp com inteligência artificial, lições simples e prática real do seu celular.",
    h1: "Um curso de inglês grátis pode ser o melhor ponto de partida",
    intro:
      "Começar com um curso de inglês grátis é uma forma inteligente de verificar se um método funciona para você antes de se comprometer mais. O problema é que muitos cursos gratuitos são básicos demais, impessoais ou cheios de promessas e pouca prática real. O SpeakEasily propõe algo mais útil: começar grátis dentro do WhatsApp, com exercícios breves e apoio de inteligência artificial para dar correções e manter o ritmo. Assim você pode experimentar uma experiência real de aprendizado, ver se se adapta ao seu dia a dia e decidir com mais critério como quer continuar avançando.",
    benefits: [
      {
        icon: "gift",
        title: "Entrada fácil",
        description:
          "Você pode começar sem atrito, entender como o sistema funciona e ver se o formato pelo WhatsApp se adapta à sua rotina.",
      },
      {
        icon: "circle-check-big",
        title: "Experiência útil desde o primeiro dia",
        description:
          "Não é só conteúdo promocional. A prática com inteligência artificial permite experimentar o valor real do método.",
      },
      {
        icon: "wallet",
        title: "Menos risco, melhor decisão",
        description:
          "Antes de pagar qualquer coisa, você pode verificar se a abordagem, o ritmo e a clareza das correções são o que precisa.",
      },
    ],
    faq: [
      {
        question: "O que inclui o curso de inglês grátis?",
        answer:
          "Inclui uma amostra real do aprendizado pelo WhatsApp, com lições breves, prática guiada e apoio de inteligência artificial para corrigir respostas.",
      },
      {
        question: "É só para iniciantes?",
        answer:
          "Não. Também pode servir se você já estudou antes e quer retomar o inglês com um formato mais prático e mais leve.",
      },
      {
        question: "Depois tenho que continuar obrigatoriamente?",
        answer:
          "Não. A ideia de começar grátis é justamente para você testar se funciona antes de decidir se quer continuar.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Voltar ao início" },
      { href: "/aprender-ingles-por-whatsapp", label: "Aprender inglês pelo WhatsApp" },
      { href: "/ingles-para-viajar", label: "Praticar inglês para viajar" },
    ],
  },
  {
    slug: "ingles-para-el-trabajo",
    metaTitle: "Inglês para o trabalho com WhatsApp e IA",
    metaDescription:
      "Melhore seu inglês para o trabalho com prática pelo WhatsApp, inteligência artificial e lições focadas em situações profissionais.",
    h1: "Inglês para o trabalho sem perder tempo com conteúdo irrelevante",
    intro:
      "Quando você precisa de inglês para o trabalho, não busca um curso cheio de temas genéricos que demoram meses para chegar ao que é útil. O que precisa é praticar vocabulário, respostas e estruturas que realmente aparecem em reuniões, e-mails, entrevistas ou conversas com clientes. O SpeakEasily ajuda você a fazer isso pelo WhatsApp, com uma experiência mais leve e constante. A inteligência artificial adapta as correções e propõe exercícios mais alinhados com objetivos profissionais. Assim você pode melhorar passo a passo sem se desconectar da rotina de trabalho nem depender de aulas longas difíceis de manter.",
    benefits: [
      {
        icon: "briefcase-business",
        title: "Foco profissional",
        description:
          "A prática pode se centrar em contextos de trabalho reais como apresentações, reuniões, e-mails e comunicação diária.",
      },
      {
        icon: "messages-square",
        title: "Aprendizado integrado ao seu dia",
        description:
          "Usar o WhatsApp facilita encontrar pequenos momentos para praticar sem bloquear uma hora inteira na agenda.",
      },
      {
        icon: "brain-circuit",
        title: "Correções mais úteis",
        description:
          "A inteligência artificial detecta erros frequentes e ajuda você a soar mais claro, natural e profissional.",
      },
    ],
    faq: [
      {
        question: "Serve para entrevistas e reuniões?",
        answer:
          "Sim. Pode ajudar a praticar estruturas, vocabulário e respostas frequentes em situações profissionais onde precisa se comunicar com mais segurança.",
      },
      {
        question: "Preciso ter um nível alto para começar?",
        answer:
          "Não. Você pode começar de um nível básico ou intermediário e trabalhar o inglês profissional de forma progressiva.",
      },
      {
        question: "O que a inteligência artificial contribui aqui?",
        answer:
          "Oferece correções rápidas, adaptação do conteúdo e uma prática mais alinhada com suas necessidades reais de trabalho.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Voltar ao início" },
      { href: "/clases-de-ingles-online", label: "Explorar aulas de inglês online" },
      { href: "/aprender-ingles-rapido", label: "Aprender inglês mais rápido" },
    ],
  },
  {
    slug: "ingles-para-viajar",
    metaTitle: "Inglês para viajar com prática no WhatsApp",
    metaDescription:
      "Pratique inglês para viajar pelo WhatsApp com inteligência artificial e lições breves para falar com mais segurança nas suas viagens.",
    h1: "Inglês para viajar com mais confiança e menos bloqueios",
    intro:
      "Aprender inglês para viajar não é só decorar frases soltas. O importante é se sentir capaz de pedir ajuda, entender respostas, resolver situações e falar com mais calma quando está fora de casa. O SpeakEasily permite praticar esse tipo de inglês pelo WhatsApp, com lições simples e uma dinâmica fácil de seguir. Graças à inteligência artificial, você pode receber correções, repetir estruturas úteis e reforçar vocabulário-chave para aeroportos, hotéis, restaurantes ou deslocamentos. É uma forma prática de chegar à sua próxima viagem com mais segurança e menos medo de ficar sem palavras.",
    benefits: [
      {
        icon: "plane",
        title: "Vocabulário para situações reais",
        description:
          "Você pratica expressões que realmente aparecem quando viaja: pedir direções, fazer check-in, perguntar preços ou resolver imprevistos.",
      },
      {
        icon: "map-pinned",
        title: "Mais confiança para se comunicar",
        description:
          "Ao repetir contextos comuns no WhatsApp, fica mais fácil reagir quando está cara a cara durante a viagem.",
      },
      {
        icon: "cpu",
        title: "IA que corrige e reforça",
        description:
          "A inteligência artificial ajuda a detectar erros, fixar frases úteis e entender formas mais naturais de se expressar.",
      },
    ],
    faq: [
      {
        question: "Que tipo de inglês se pratica para viajar?",
        answer:
          "Inglês funcional para situações do dia a dia: transporte, hospedagem, comida, compras, perguntas básicas e resolução de problemas.",
      },
      {
        question: "Posso usar o SpeakEasily antes de uma viagem próxima?",
        answer:
          "Sim. É especialmente útil se quer reforçar rapidamente expressões práticas e ganhar desenvoltura em pouco tempo pelo WhatsApp.",
      },
      {
        question: "Também ajuda com compreensão?",
        answer:
          "Sim. Além de praticar respostas, você pode se acostumar com estruturas e vocabulário que depois aparecem em conversas reais durante a viagem.",
      },
    ],
    internalLinks: [
      { href: "/", label: "Voltar ao início" },
      { href: "/curso-de-ingles-gratis", label: "Experimentar um curso de inglês grátis" },
      { href: "/aprender-ingles-por-whatsapp", label: "Ver como aprender inglês pelo WhatsApp" },
    ],
  },
];

const allPages: Record<Language, ContentPage[]> = {
  es: [...esPages, ...newEsPages],
  en: [...enPages, ...newEnPages],
  pt: [...ptPages, ...newPtPages],
};

export function getContentPages(lang: Language): ContentPage[] {
  return allPages[lang];
}

/** Default export for backward compatibility (Spanish) */
export const contentPages = esPages;
