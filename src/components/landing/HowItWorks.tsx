import { landingCopy, type Language } from "@/lib/i18n";

interface HowItWorksProps {
  lang: Language;
}

const HowItWorks = ({ lang }: HowItWorksProps) => {
  const copy = landingCopy[lang].howItWorks;

  return (
    <section id="como-funciona" className="bg-card px-4 py-24">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold tracking-tight md:text-4xl">{copy.title}</h2>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">{copy.description}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {copy.steps.map((step) => (
            <div
              key={step.num}
              className="relative rounded-2xl border border-border/50 bg-background p-8 text-center transition-shadow duration-300 hover:shadow-soft"
            >
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl gradient-hero shadow-soft">
                <span className="font-display text-xl font-bold text-primary-foreground">{step.num}</span>
              </div>
              <h3 className="mb-3 font-display text-lg font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
