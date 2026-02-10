import { Smartphone, Clock, Brain, Briefcase } from "lucide-react";

const items = [
  {
    icon: Smartphone,
    title: "Sin Apps Complejas",
    desc: "Usa el WhatsApp que ya tienes instalado. Cero configuración.",
  },
  {
    icon: Clock,
    title: "5 Minutos al Día",
    desc: "Lecciones cortas que caben en tu rutina. Aprende en el metro, en el descanso, donde sea.",
  },
  {
    icon: Brain,
    title: "Correcciones Inteligentes",
    desc: "IA que entiende tus errores y adapta las explicaciones a tu ritmo de aprendizaje.",
  },
  {
    icon: Briefcase,
    title: "Enfocado en Tu Objetivo",
    desc: "Vocabulario y ejercicios adaptados para trabajo, viajes o conversación casual.",
  },
];

const Benefits = () => (
  <section id="beneficios" className="py-24 px-4">
    <div className="container mx-auto max-w-5xl">
      <div className="text-center mb-16">
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          ¿Por Qué SpeakEasily?
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Diferente a cualquier app de inglés que hayas probado.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {items.map((item) => (
          <div
            key={item.title}
            className="group bg-card rounded-2xl border border-border/40 p-6 hover:shadow-soft hover:border-primary/20 transition-all duration-300"
          >
            <div className="flex gap-4 items-start">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold mb-1.5">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Benefits;
