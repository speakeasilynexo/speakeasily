import { MessageCircle, Sparkles, Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const WHATSAPP_LINK = "https://wa.me/34657100100?text=Hello";

const HeroSection = () => (
  <section className="relative pt-28 pb-24 px-4 overflow-hidden">
    {/* Subtle background with existing gradient */}
    <div className="absolute inset-0 gradient-subtle" />
    <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl hidden sm:block" />
    <div className="absolute bottom-10 -right-32 w-80 h-80 rounded-full bg-accent/5 blur-3xl hidden sm:block" />

    <div className="container mx-auto max-w-6xl relative">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Aprende inglés sin descargar apps</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-foreground leading-[1.1] tracking-tight mb-6">
            Aprende inglés{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              por WhatsApp con IA
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-lg">
            Clases de inglés online con lecciones cortas, IA inteligente y progreso real. Todo en la app que ya usas todos los días.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="gradient-hero text-base px-6 py-6 shadow-elevated w-full sm:w-auto"
              asChild
            >
              <a href={WHATSAPP_LINK}>
                <MessageCircle className="w-5 h-5 mr-2" />
                Empieza Gratis por WhatsApp
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-6 py-6 border-border/60 w-full sm:w-auto"
              asChild
            >
              <a href="#como-funciona">
                Cómo Funciona
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-5 flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            7 días gratis · Sin tarjeta de crédito
          </p>
        </div>

        {/* Phone Mockup */}
        <div className="relative max-w-xs mx-auto lg:mx-0 lg:ml-auto">
          <div className="absolute inset-0 gradient-hero opacity-10 blur-3xl rounded-full scale-110 hidden sm:block" />
          <div className="relative bg-card rounded-[2rem] shadow-elevated border border-border/40 p-3">
            {/* Phone top bar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 mb-2">
              <div className="w-7 h-7 rounded-full gradient-hero flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-semibold leading-tight">SpeakEasily</p>
                <p className="text-[10px] text-muted-foreground leading-tight">En línea</p>
              </div>
            </div>
            {/* Chat bubbles */}
            <div className="bg-muted/50 rounded-2xl p-3 space-y-2.5">
              <div className="flex gap-2">
                <div className="bg-card rounded-2xl rounded-tl-sm p-2.5 shadow-soft max-w-[85%]">
                  <p className="text-xs leading-relaxed">🎓 ¡Hola! Soy tu coach de inglés. ¿Vamos a descubrir tu nivel?</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm p-2.5 max-w-[80%]">
                  <p className="text-xs">Hello! 👋</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="bg-card rounded-2xl rounded-tl-sm p-2.5 shadow-soft max-w-[85%]">
                  <p className="text-xs leading-relaxed">🔥 ¡Excelente! Tu nivel: <strong>Intermedio</strong> 📙</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="bg-card rounded-2xl rounded-tl-sm p-2.5 shadow-soft max-w-[85%]">
                  <p className="text-xs leading-relaxed">📖 <strong>Lección 1</strong> — Present Perfect</p>
                  <p className="text-xs mt-1 leading-relaxed">✏️ Completa: "She ___ (work) here since 2020."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
