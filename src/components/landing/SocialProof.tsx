const stats = [
  { value: "5 min/día", label: "es todo lo que necesitas" },
  { value: "IA Adaptativa", label: "aprende contigo" },
  { value: "100% WhatsApp", label: "cero descargas" },
];

const SocialProof = () => (
  <section className="py-16 px-4 border-y border-border/30">
    <div className="container mx-auto max-w-4xl">
      <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
        {stats.map((s) => (
          <div key={s.value}>
            <div className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1">
              {s.value}
            </div>
            <div className="text-muted-foreground text-xs sm:text-sm">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default SocialProof;
