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

export const contentPages: ContentPage[] = [
  {
    slug: "aprender-ingles-por-whatsapp",
    metaTitle: "Aprender inglés por WhatsApp con IA | SpeakEasily",
    metaDescription:
      "Aprende inglés por WhatsApp con lecciones cortas, práctica real e inteligencia artificial. Empieza gratis y mejora tu inglés cada día.",
    h1: "Aprender inglés por WhatsApp es más fácil de lo que parece",
    intro:
      "Si ya usas WhatsApp todos los días, también puedes usarlo para mejorar tu inglés sin complicarte la vida. En lugar de abrir otra app, memorizar listas eternas o perder tiempo con clases que no se adaptan a ti, puedes practicar desde una conversación real y simple. SpeakEasily combina WhatsApp con inteligencia artificial para enviarte ejercicios breves, correcciones claras y práctica útil según tu nivel. Es una forma cómoda de avanzar poco a poco, con constancia, sin sentir que estás empezando de cero cada semana.",
    benefits: [
      {
        icon: "message-circle",
        title: "Todo pasa en WhatsApp",
        description:
          "No necesitas instalar herramientas nuevas ni aprender a usar otra plataforma. Practicas inglés en el entorno que ya conoces.",
      },
      {
        icon: "brain",
        title: "IA que se adapta a ti",
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
          "La inteligencia artificial analiza tus respuestas, corrige errores, adapta ejercicios y te da explicaciones según tu nivel y objetivo.",
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
      "Descubre clases de inglés online por WhatsApp con inteligencia artificial, práctica personalizada y una experiencia flexible para tu ritmo.",
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
        title: "Contenido personalizado",
        description:
          "La inteligencia artificial adapta ejemplos, correcciones y ejercicios a tu nivel actual para evitar que pierdas tiempo con contenido genérico.",
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
          "Sí. SpeakEasily puede adaptarse tanto si estás empezando como si quieres recuperar fluidez y corregir errores frecuentes.",
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
          "Combina microlecciones, práctica por WhatsApp, correcciones inmediatas e inteligencia artificial para mantener una progresión constante y personalizada.",
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
          "No. También puede servir si ya estudiaste antes y quieres retomar el inglés con un formato más práctico y menos pesado.",
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
      "Cuando necesitas inglés para el trabajo, no buscas un curso lleno de temas genéricos que tardan meses en llegar a lo útil. Lo que necesitas es practicar vocabulario, respuestas y estructuras que realmente aparecen en reuniones, correos, entrevistas o conversaciones con clientes. SpeakEasily te ayuda a hacerlo desde WhatsApp, con una experiencia más ligera y constante. La inteligencia artificial adapta las correcciones y te propone ejercicios más alineados con objetivos profesionales. Así puedes mejorar paso a paso sin desconectarte de tu rutina laboral ni depender de clases largas difíciles de mantener.",
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
          "Aporta correcciones rápidas, adaptación del contenido y una práctica más alineada con tus necesidades reales de trabajo.",
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
