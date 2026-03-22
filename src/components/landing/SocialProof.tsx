import { landingCopy, type Language } from "@/lib/i18n";

interface SocialProofProps {
  lang: Language;
}

const SocialProof = ({ lang }: SocialProofProps) => {
  const stats = landingCopy[lang].socialProof.stats;

  return (
    <section className="border-y border-border/30 px-4 py-16">
      <div className="container mx-auto max-w-4xl">
        <div className="grid grid-cols-3 gap-2 text-center sm:gap-8">
          {stats.map((stat) => (
            <div key={stat.value}>
              <div className="mb-1 font-display text-lg font-bold text-foreground sm:text-xl md:text-3xl">{stat.value}</div>
              <div className="text-[11px] text-muted-foreground sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
