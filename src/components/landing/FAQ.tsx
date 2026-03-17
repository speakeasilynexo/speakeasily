import { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "¿Cómo funciona aprender inglés por WhatsApp con SpeakEasily?",
    a: "Simplemente envías un mensaje a nuestro número de WhatsApp y nuestra IA comienza a enseñarte inglés con lecciones personalizadas. No necesitas descargar ninguna app ni crear una cuenta. Todo sucede en la misma conversación de WhatsApp que ya usas a diario.",
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
    a: "Al comenzar, nuestra IA evalúa tu nivel con 3 preguntas rápidas. Luego, cada ejercicio y corrección se adapta automáticamente a tus puntos fuertes y débiles, creando un curso de inglés verdaderamente personalizado.",
  },
  {
    q: "¿Puedo aprender inglés para el trabajo o para viajar?",
    a: "Sí, SpeakEasily adapta el vocabulario y los ejercicios a tu objetivo: inglés profesional para el trabajo, inglés práctico para viajar o conversación casual para el día a día.",
  },
  {
    q: "¿En qué idiomas está disponible SpeakEasily?",
    a: "SpeakEasily está disponible para hablantes de español, portugués e inglés. La interfaz y las explicaciones se adaptan a tu idioma nativo para que aprendas inglés de forma más natural.",
  },
];

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.a,
    },
  })),
};

const FAQ = () => {
  useEffect(() => {
    const id = "faq-jsonld";
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(FAQ_JSONLD);

    return () => {
      script?.remove();
    };
  }, []);

  return (
    <section id="faq" className="py-24 px-4 bg-card">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Preguntas Frecuentes sobre Aprender Inglés por WhatsApp
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Todo lo que necesitas saber sobre nuestro curso de inglés online.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="bg-background rounded-xl border border-border/50 px-5"
            >
              <AccordionTrigger className="text-left text-sm sm:text-base font-medium hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
