import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

type Language = "pt" | "es" | "en";

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
    es: "Tu plan ha sido activado con éxito. ¡Ahora vuelve a WhatsApp y escribe NEXT para seguir aprendiendo!",
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

function getLang(param: string | null): Language {
  if (param === "pt" || param === "es" || param === "en") return param;
  return "es";
}

export default function Success() {
  const [searchParams] = useSearchParams();
  const lang = getLang(searchParams.get("lang"));

  const SEO_TITLES: Record<Language, string> = {
    es: "Pago confirmado - SpeakEasily",
    pt: "Pagamento confirmado - SpeakEasily",
    en: "Payment confirmed - SpeakEasily",
  };
  const SEO_DESCS: Record<Language, string> = {
    es: "Tu plan ha sido activado con éxito. Vuelve a WhatsApp para seguir aprendiendo inglés.",
    pt: "Seu plano foi ativado com sucesso. Volte ao WhatsApp para continuar aprendendo inglês.",
    en: "Your plan has been activated successfully. Go back to WhatsApp to keep learning English.",
  };

  useSEO({
    title: SEO_TITLES[lang],
    description: SEO_DESCS[lang],
    path: "/success",
    lang,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{I18N.back[lang]}</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shadow-soft">
              <MessageCircle className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">SpeakEasily</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 pt-20 pb-16">
        <div className="text-center max-w-md mx-auto space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>

          <div className="space-y-3">
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              {I18N.title[lang]}
            </h1>
            <p className="text-lg font-medium text-primary">
              {I18N.welcome[lang]}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {I18N.message[lang]}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full gap-2 py-5 gradient-hero shadow-soft text-base font-semibold"
              asChild
            >
              <a href={WHATSAPP_LINK}>
                <MessageCircle className="h-5 w-5" />
                {I18N.cta[lang]}
              </a>
            </Button>

            <Button variant="outline" size="lg" className="w-full py-5" asChild>
              <Link to="/">{I18N.back[lang]}</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-border/40 bg-card">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg gradient-hero flex items-center justify-center">
              <MessageCircle className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-sm">SpeakEasily</span>
          </div>
          <p className="text-xs text-muted-foreground">
            SpeakEasily • PT517286688
          </p>
        </div>
      </footer>
    </div>
  );
}
