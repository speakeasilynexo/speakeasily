import {
  MessageCircle,
  BookOpen,
  Trophy,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Clock,
  Brain,
  Plane,
  Briefcase,
  Gift,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const whatsappLink = "https://wa.me/TU_NUMERO?text=Hello";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/90 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">SpeakEasily</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#como-funciona" className="text-muted-foreground hover:text-foreground transition-colors">
              Cómo Funciona
            </a>
            <a href="#beneficios" className="text-muted-foreground hover:text-foreground transition-colors">
              Beneficios
            </a>
            <a href="#prueba" className="text-muted-foreground hover:text-foreground transition-colors">
              Prueba Gratis
            </a>
          </nav>
          <Button className="gradient-hero" asChild>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              Empieza Ahora
            </a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 gradient-subtle">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Aprende inglés sin descargar apps</span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Aprende inglés{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  directamente desde WhatsApp
                </span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Lecciones cortas, IA inteligente y progreso real. Todo en la app que ya usas todos los días.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="gradient-hero text-lg px-8 py-6 shadow-elevated" asChild>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Empieza Gratis por WhatsApp
                  </a>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />7 días gratis • Sin tarjeta de crédito
              </p>
            </div>

            {/* Phone Mockup */}
            <div className="relative max-w-sm mx-auto lg:mx-0 lg:ml-auto">
              <div className="absolute inset-0 gradient-hero opacity-20 blur-3xl rounded-full" />
              <div className="relative bg-card rounded-3xl shadow-elevated border border-border p-4">
                <div className="bg-muted rounded-2xl p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full gradient-hero flex-shrink-0" />
                    <div className="bg-card rounded-2xl rounded-tl-sm p-3 shadow-soft max-w-[85%]">
                      <p className="text-sm">🎓 ¡Hola! Soy tu coach de inglés. ¿Vamos a descubrir tu nivel?</p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm p-3 max-w-[80%]">
                      <p className="text-sm">Hello!</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full gradient-hero flex-shrink-0" />
                    <div className="bg-card rounded-2xl rounded-tl-sm p-3 shadow-soft max-w-[85%]">
                      <p className="text-sm">🔥 ¡Excelente! Tu nivel: Intermedio 📙</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full gradient-hero flex-shrink-0" />
                    <div className="bg-card rounded-2xl rounded-tl-sm p-3 shadow-soft max-w-[85%]">
                      <p className="text-sm">📖 Lección 1 — Present Perfect</p>
                      <p className="text-sm mt-1">✏️ Completa: "She ___ (work) here since 2020."</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-20 px-4 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Cómo Funciona</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Empieza en menos de 1 minuto. Sin descargas, sin registros complicados.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-6 shadow-elevated">
                <span className="text-3xl font-display font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">Envía "Hello"</h3>
              <p className="text-muted-foreground">Abre WhatsApp y manda un mensaje simple. ¡Listo, ya empezaste!</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-6 shadow-elevated">
                <span className="text-3xl font-display font-bold text-primary-foreground">2</span>
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">La IA Evalúa Tu Nivel</h3>
              <p className="text-muted-foreground">3 preguntas rápidas y descubres tu nivel actual de inglés.</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-6 shadow-elevated">
                <span className="text-3xl font-display font-bold text-primary-foreground">3</span>
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">Lecciones Personalizadas</h3>
              <p className="text-muted-foreground">
                Recibe ejercicios adaptados a tu objetivo: trabajo, viaje o conversación.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">¿Por Qué SpeakEasily?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Diferente a cualquier app de inglés que hayas probado.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-soft hover:shadow-elevated transition-all duration-300 border-0 bg-secondary/30">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">Sin Apps Complejas</h3>
                <p className="text-muted-foreground text-sm">
                  Usa el WhatsApp que ya tienes instalado. Cero configuración.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-elevated transition-all duration-300 border-0 bg-secondary/30">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">5 Minutos al Día</h3>
                <p className="text-muted-foreground text-sm">
                  Lecciones cortas que caben en tu rutina. Aprende en el metro, en el descanso, donde sea.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-elevated transition-all duration-300 border-0 bg-secondary/30">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">Correcciones Inteligentes</h3>
                <p className="text-muted-foreground text-sm">
                  IA que entiende tus errores y adapta las explicaciones a tu ritmo de aprendizaje.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-elevated transition-all duration-300 border-0 bg-secondary/30">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">Enfocado en Tu Objetivo</h3>
                <p className="text-muted-foreground text-sm">
                  Vocabulario y ejercicios adaptados para trabajo, viajes o conversación casual.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trial Section */}
      <section id="prueba" className="py-20 px-4 bg-card">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium mb-6">
              <Gift className="w-4 h-4" />
              <span>Oferta Especial</span>
            </div>

            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Prueba Gratis por 7 Días</h2>

            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Experimenta 20 lecciones completas sin pagar nada. Sin tarjeta de crédito, sin compromiso.
            </p>

            <div className="bg-background rounded-2xl p-8 shadow-elevated border border-border max-w-xl mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-primary">7</div>
                  <div className="text-sm text-muted-foreground">días gratis</div>
                </div>
                <div className="hidden md:block w-px h-12 bg-border" />
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-primary">20</div>
                  <div className="text-sm text-muted-foreground">lecciones incluidas</div>
                </div>
                <div className="hidden md:block w-px h-12 bg-border" />
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-primary">∞</div>
                  <div className="text-sm text-muted-foreground">feedback IA</div>
                </div>
              </div>

              <Button size="lg" className="w-full gradient-hero text-lg py-6 shadow-elevated" asChild>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Empezar Mi Prueba Gratis
                </a>
              </Button>

              <p className="text-xs text-muted-foreground mt-4">Al hacer clic, serás redirigido a WhatsApp</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-display font-bold text-foreground mb-2">5 min/día</div>
              <div className="text-muted-foreground">es todo lo que necesitas</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-foreground mb-2">IA Adaptativa</div>
              <div className="text-muted-foreground">aprende contigo</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-foreground mb-2">100% WhatsApp</div>
              <div className="text-muted-foreground">cero descargas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 gradient-subtle">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">¿Listo para Hablar Inglés?</h2>
          <p className="text-muted-foreground text-lg mb-8">Empieza ahora y verás tu progreso en pocos días.</p>
          <Button size="lg" className="gradient-hero text-lg px-8 py-6 shadow-elevated" asChild>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-5 h-5 mr-2" />
              Iniciar Mi Viaje
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold ">SpeakEasily</span>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-right">
              © 2026 SpeakEasily. Aprende inglés por WhatsApp. 64.696.664 ELIAS ISRAEL MENDES CNPJ: 64.696.664/0001-10
              Contato: contato@nexo-digital.app
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
