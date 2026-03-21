import { MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { landingCopy, type Language } from "@/lib/i18n";

const WHATSAPP_LINK = "https://wa.me/34657100100?text=Hello";

interface FinalCtaProps {
  lang: Language;
}

const FinalCta = ({ lang }: FinalCtaProps) => {
  const copy = landingCopy[lang].finalCta;

  return (
    <section className="relative overflow-hidden gradient-subtle px-4 py-24">
      <div className="absolute left-1/2 top-0 hidden h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl sm:block" />
      <div className="container relative mx-auto max-w-2xl text-center">
        <h2 className="mb-4 font-display text-3xl font-bold tracking-tight md:text-4xl">{copy.title}</h2>
        <p className="mb-8 text-lg text-muted-foreground">{copy.description}</p>
        <Button size="lg" className="w-full px-8 py-6 text-base shadow-elevated gradient-hero sm:w-auto" asChild>
          <a href={WHATSAPP_LINK}>
            <MessageCircle className="mr-2 h-5 w-5" />
            {copy.cta}
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
        </Button>
      </div>
    </section>
  );
};

export default FinalCta;
