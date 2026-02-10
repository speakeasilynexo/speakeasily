const steps = [
  {
    num: "1",
    title: 'Envía "Hello"',
    desc: "Abre WhatsApp y manda un mensaje simple. ¡Listo, ya empezaste!",
  },
  {
    num: "2",
    title: "La IA Evalúa Tu Nivel",
    desc: "3 preguntas rápidas y descubres tu nivel actual de inglés.",
  },
  {
    num: "3",
    title: "Lecciones Personalizadas",
    desc: "Recibe ejercicios adaptados a tu objetivo: trabajo, viaje o conversación.",
  },
];

const HowItWorks = () => (
  <section id="como-funciona" className="py-24 px-4 bg-card">
    <div className="container mx-auto max-w-5xl">
      <div className="text-center mb-16">
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 tracking-tight">Cómo Funciona</h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Empieza en menos de 1 minuto. Sin descargas, sin registros complicados.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((s) => (
          <div
            key={s.num}
            className="relative bg-background rounded-2xl border border-border/50 p-8 text-center hover:shadow-soft transition-shadow duration-300"
          >
            <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-6 shadow-soft">
              <span className="text-xl font-display font-bold text-primary-foreground">{s.num}</span>
            </div>
            <h3 className="font-display text-lg font-semibold mb-3">{s.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
