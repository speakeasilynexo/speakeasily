import { MessageCircle, Sparkles, Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { landingCopy, type Language } from "@/lib/i18n";

const WHATSAPP_LINK = "https://wa.me/34657100100?text=Hello";

interface HeroSectionProps {
  lang: Language;
}

const HeroSection = ({ lang }: HeroSectionProps) => {
  const copy = landingCopy[lang].hero;

  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-28">
      <div className="absolute inset-0 gradient-subtle" />
      <div className="absolute top-20 hidden h-96 w-96 rounded-full bg-primary/5 blur-3xl sm:-left-32 sm:block" />
      <div className="absolute bottom-10 hidden h-80 w-80 rounded-full bg-accent/5 blur-3xl sm:-right-32 sm:block" />

      <div className="container relative mx-auto max-w-6xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="animate-slide-up">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{copy.badge}</span>
            </div>

            <h1 className="mb-6 font-display text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-[3.5rem]">
              {copy.titleBefore}{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {copy.titleHighlight}
              </span>
            </h1>

            <p className="mb-10 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">{copy.description}</p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="w-full px-6 py-6 text-base shadow-elevated gradient-hero sm:w-auto" asChild>
                <a href={WHATSAPP_LINK}>
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {copy.primaryCta}
                </a>
              </Button>
              <Button size="lg" variant="outline" className="w-full border-border/60 px-6 py-6 text-base sm:w-auto" asChild>
                <a href="#como-funciona">
                  {copy.secondaryCta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>

            <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <Gift className="h-4 w-4 text-primary" />
              {copy.footnote}
            </p>
          </div>

          <div className="relative mx-auto max-w-xs lg:ml-auto lg:mr-0">
            <div className="absolute inset-0 hidden scale-110 rounded-full opacity-10 blur-3xl gradient-hero sm:block" />
            <div className="relative rounded-[2rem] border border-border/40 bg-card p-3 shadow-elevated">
              <div className="mb-2 flex items-center gap-2 border-b border-border/30 px-3 py-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full gradient-hero">
                  <MessageCircle className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs font-semibold leading-tight">SpeakEasily</p>
                  <p className="text-[10px] leading-tight text-muted-foreground">{copy.online}</p>
                </div>
              </div>

              <div className="space-y-2.5 rounded-2xl bg-muted/50 p-3">
                <div className="flex gap-2">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-card p-2.5 shadow-soft">
                    <p className="text-xs leading-relaxed">{copy.chatIntro}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary p-2.5 text-primary-foreground">
                    <p className="text-xs">Hello! 👋</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-card p-2.5 shadow-soft">
                    <p className="text-xs leading-relaxed">{copy.chatLevel}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-card p-2.5 shadow-soft">
                    <p className="text-xs leading-relaxed">{copy.chatLessonTitle}</p>
                    <p className="mt-1 text-xs leading-relaxed">{copy.chatLessonPrompt}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
