import { Link } from "react-router-dom";
import { MessageCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalizedPath, type Language } from "@/lib/i18n";

const I18N = {
  title: {
    pt: "Pagamento confirmado! 🎉",
    es: "¡Pago confirmado! 🎉",
    en: "Payment confirmed! 🎉",
  },
  welcome: {
    pt: "Bem-vindo ao SpeakEasily",
    es: "Bienvenido a SpeakEasily",
    en: "Welcome to SpeakEasily",
  },
  message: {
    pt: "Seu plano foi ativado com sucesso. Agora volte ao WhatsApp e escreva NEXT para continuar aprendendo!",
    es: "Tu plan ha sido activado con éxito. Ahora vuelve a WhatsApp y escribe NEXT para seguir aprendiendo.",
    en: "Your plan has been activated successfully. Now go back to WhatsApp and type NEXT to keep learning!",
  },
  cta: {
    pt: "Voltar ao WhatsApp",
    es: "Volver a WhatsApp",
    en: "Back to WhatsApp",
  },
  back: {
    pt: "Voltar ao início",
    es: "Volver al inicio",
    en: "Back to home",
  },
} as const;

const WHATSAPP_LINK = "https://wa.me/34657100100";

export default function Success() {
  const { lang } = useLanguage();

  const seoTitles: Record<Language, string> = {
    es: "Pago confirmado - SpeakEasily",
    pt: "Pagamento confirmado - SpeakEasily",
    en: "Payment confirmed - SpeakEasily",
  };
  const seoDescriptions: Record<Language, string> = {
    es: "Tu plan ha sido activado con éxito. Vuelve a WhatsApp para seguir aprendiendo inglés.",
    pt: "Seu plano foi ativado com sucesso. Volte ao WhatsApp para continuar aprendendo inglês.",
    en: "Your plan has been activated successfully. Go back to WhatsApp to keep learning English.",
  };

  useSEO({
    title: seoTitles[lang],
    description: seoDescriptions[lang],
    path: "/success",
    lang,
    noindex: true,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link
            to={buildLocalizedPath("/", lang)}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{I18N.back[lang]}</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-hero shadow-soft">
              <MessageCircle className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">SpeakEasily</span>
          </div>

          <div className="w-16" />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-20">
        <div className="mx-auto max-w-md space-y-8 text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>

          <div className="space-y-3">
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{I18N.title[lang]}</h1>
            <p className="text-lg font-medium text-primary">{I18N.welcome[lang]}</p>
            <p className="leading-relaxed text-muted-foreground">{I18N.message[lang]}</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button size="lg" className="w-full gap-2 py-5 text-base font-semibold shadow-soft gradient-hero" asChild>
              <a href={WHATSAPP_LINK}>
                <MessageCircle className="h-5 w-5" />
                {I18N.cta[lang]}
              </a>
            </Button>

            <Button variant="outline" size="lg" className="w-full py-5" asChild>
              <Link to={buildLocalizedPath("/", lang)}>{I18N.back[lang]}</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 bg-card px-4 py-6">
        <div className="container mx-auto text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg gradient-hero">
              <MessageCircle className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-display text-sm font-semibold">SpeakEasily</span>
          </div>
          <p className="text-xs text-muted-foreground">SpeakEasily • PT517286688</p>
        </div>
      </footer>
    </div>
  );
}
