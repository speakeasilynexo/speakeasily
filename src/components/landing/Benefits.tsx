import { Smartphone, Clock, Brain, Briefcase } from "lucide-react";
import { landingCopy, type Language } from "@/lib/i18n";

const icons = [Smartphone, Clock, Brain, Briefcase] as const;

interface BenefitsProps {
  lang: Language;
}

const Benefits = ({ lang }: BenefitsProps) => {
  const copy = landingCopy[lang].benefits;

  return (
    <section id="beneficios" className="px-4 py-24">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold tracking-tight md:text-4xl">{copy.title}</h2>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">{copy.description}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {copy.items.map((item, index) => {
            const Icon = icons[index];

            return (
              <div
                key={item.title}
                className="group rounded-2xl border border-border/40 bg-card p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-soft"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-1.5 font-display text-base font-semibold">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
