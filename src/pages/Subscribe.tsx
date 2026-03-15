import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Check, ArrowLeft, CheckCircle, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PlanType = "mensual" | "trimestral" | "semestral";
type Language = "pt" | "es" | "en";

interface PlanInfo {
  id: PlanType;
  name: Record<Language, string>;
  price: string;
  priceValue: number;
  period: Record<Language, string>;
  subtitle: Record<Language, string>;
  recommended?: boolean;
}

const PLANS: PlanInfo[] = [
  {
    id: "mensual",
    name: { pt: "Mensal", es: "Mensual", en: "Monthly" },
    price: "€7,99",
    priceValue: 7.99,
    period: { pt: "/mês", es: "/mes", en: "/month" },
    subtitle: { pt: "Flexível", es: "Flexible", en: "Flexible" },
  },
  {
    id: "trimestral",
    name: { pt: "Trimestral", es: "Trimestral", en: "Quarterly" },
    price: "€19,99",
    priceValue: 19.99,
    period: { pt: "/3 meses", es: "/3 meses", en: "/3 months" },
    subtitle: { pt: "Melhor equilíbrio", es: "Mejor equilibrio", en: "Best balance" },
    recommended: true,
  },
  {
    id: "semestral",
    name: { pt: "Semestral", es: "Semestral", en: "Biannual" },
    price: "€34,99",
    priceValue: 34.99,
    period: { pt: "/6 meses", es: "/6 meses", en: "/6 months" },
    subtitle: { pt: "Maior economia", es: "Mejor ahorro", en: "Best savings" },
  },
];

const BENEFITS: Record<Language, string[]> = {
  pt: [
    "Áudios e prática real (listening + shadowing)",
    "Correção imediata e explicações claras",
    "Tradução e revisão inteligente dos seus erros",
    "Progresso visível com microlições",
    "Aprendizado simples direto pelo WhatsApp",
  ],
  es: [
    "Audios y práctica real (listening + shadowing)",
    "Corrección inmediata y explicaciones claras",
    "Traducción y revisión inteligente de tus errores",
    "Progreso visible con microlecciones",
    "Aprendizaje simple desde WhatsApp",
  ],
  en: [
    "Audio and real practice (listening + shadowing)",
    "Immediate feedback and clear explanations",
    "Translation and smart review of your mistakes",
    "Visible progress with micro-lessons",
    "Simple learning straight from WhatsApp",
  ],
};

const I18N: Record<string, Record<Language, string>> = {
  headline: {
    pt: "Continue aprendendo inglês com SpeakEasily",
    es: "Sigue aprendiendo inglés con SpeakEasily",
    en: "Keep learning English with SpeakEasily",
  },
  subheadline: {
    pt: "Lições curtas por WhatsApp, áudios, correções e revisão inteligente. Sem apps complicados.",
    es: "Lecciones cortas por WhatsApp, audios, correcciones y revisión inteligente. Sin apps complicadas.",
    en: "Short lessons via WhatsApp, audio, corrections and smart review. No complicated apps.",
  },
  benefits_title: {
    pt: "O que inclui sua assinatura?",
    es: "¿Qué incluye tu suscripción?",
    en: "What does your subscription include?",
  },
  choose_plan: {
    pt: "Escolha seu plano",
    es: "Elige tu plan",
    en: "Choose your plan",
  },
  recommended: {
    pt: "Recomendado",
    es: "Recomendado",
    en: "Recommended",
  },
  cancel_anytime: {
    pt: "Cancele quando quiser. Mantém acesso até o fim do período.",
    es: "Cancela cuando quieras. Mantienes acceso hasta el fin del período.",
    en: "Cancel anytime. Keep access until the end of the period.",
  },
  choose_btn: {
    pt: "Escolher",
    es: "Elegir",
    en: "Choose",
  },
  back_whatsapp: {
    pt: "Voltar ao WhatsApp",
    es: "Volver a WhatsApp",
    en: "Back to WhatsApp",
  },
  back: {
    pt: "Voltar",
    es: "Volver",
    en: "Back",
  },
  questions: {
    pt: "Tem dúvidas? Nos escreva pelo WhatsApp e ajudamos.",
    es: "¿Tienes dudas? Escríbenos por WhatsApp y te ayudamos.",
    en: "Have questions? Write us on WhatsApp and we'll help.",
  },
  footer: {
    pt: "SpeakEasily • Seu coach de inglês por WhatsApp • IVA / NIPC: PT517286688 • Contacto: contacto@nexo-digital.app",
    es: "SpeakEasily • Tu coach de inglés por WhatsApp • IVA / NIPC: PT517286688 • Contacto: contacto@nexo-digital.app",
    en: "SpeakEasily • Your English coach on WhatsApp • VAT / NIPC: PT517286688 • Contact: contacto@nexo-digital.app",
  },
  processing: {
    pt: "Processando...",
    es: "Procesando...",
    en: "Processing...",
  },
  error_no_wa_id: {
    pt: "Não foi possível identificar sua conta. Por favor, volte pelo WhatsApp.",
    es: "No se pudo identificar tu cuenta. Por favor, vuelve desde WhatsApp.",
    en: "Could not identify your account. Please return from WhatsApp.",
  },
  success_title: {
    pt: "Assinatura ativada! 🎉",
    es: "¡Suscripción activada! 🎉",
    en: "Subscription activated! 🎉",
  },
  success_msg: {
    pt: "Seu plano {plan} está ativo. Volte ao WhatsApp e escreva NEXT!",
    es: "Tu plan {plan} está activo. ¡Vuelve a WhatsApp y escribe NEXT!",
    en: "Your {plan} plan is active. Go back to WhatsApp and type NEXT!",
  },
  error_title: {
    pt: "Erro",
    es: "Error",
    en: "Error",
  },
  error_generic: {
    pt: "Não foi possível ativar a assinatura. Tente novamente.",
    es: "No se pudo activar la suscripción. Intenta de nuevo.",
    en: "Could not activate subscription. Try again.",
  },
};

const WHATSAPP_LINK = "https://wa.me/34657100100";
const SUPABASE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

function getLangFromParam(param: string | null): Language {
  if (param === "pt" || param === "es" || param === "en") return param;
  return "es";
}

export default function Subscribe() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("trimestral");
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState<Language>(() => getLangFromParam(searchParams.get("lang")));
  const { toast } = useToast();

  const source = searchParams.get("source") || "direct";
  const waId = searchParams.get("wa_id") || null;

  // Track page view
  useEffect(() => {
    const trackPageView = async () => {
      try {
        await supabase.from("wa_events").insert({
          wa_id: waId || "web_visitor",
          event_type: "subscribe_viewed",
          metadata: {
            path: "/subscribe",
            source,
            lang,
            referrer: document.referrer || null,
          },
        });
      } catch (error) {
        console.error("Error tracking page view:", error);
      }
    };

    trackPageView();
  }, [waId, source, lang]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("lang", newLang);
    setSearchParams(newParams, { replace: true });
  };

  const handlePlanSelect = async (planId: PlanType) => {
    setSelectedPlan(planId);

    try {
      await supabase.from("wa_events").insert({
        wa_id: waId || "web_visitor",
        event_type: "plan_selected",
        metadata: { plan: planId, source, lang },
      });
    } catch (error) {
      console.error("Error tracking plan selection:", error);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          wa_id: waId,
          lang,
          source,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || I18N.error_generic[lang]);
      }

      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error(I18N.error_generic[lang]);
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast({
        title: I18N.error_title[lang],
        description: error instanceof Error ? error.message : I18N.error_generic[lang],
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlanInfo = PLANS.find((p) => p.id === selectedPlan)!;

  return (
    <div className="min-h-screen bg-background">
      {/* Header — matches landing */}
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

          {/* Language Selector */}
          <div className="flex gap-1">
            {(["pt", "es", "en"] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => handleLanguageChange(l)}
                className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  lang === l
                    ? "gradient-hero text-primary-foreground shadow-soft"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-28 pb-16 max-w-4xl">
        {/* Hero */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent-foreground text-sm font-medium mb-6">
            <Gift className="w-3.5 h-3.5" />
            <span>{I18N.choose_plan[lang]}</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight text-balance">
            {I18N.headline[lang]}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">{I18N.subheadline[lang]}</p>
        </section>

        {/* Benefits */}
        <section className="mb-16">
          <div className="rounded-2xl border border-primary/20 bg-card p-7 md:p-10 shadow-soft">
            <h2 className="font-display text-lg md:text-xl font-semibold mb-6 text-center">
              {I18N.benefits_title[lang]}
            </h2>
            <ul className="space-y-3.5 max-w-lg mx-auto">
              {BENEFITS[lang].map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Plans */}
        <section className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => handlePlanSelect(plan.id)}
                className={`relative rounded-2xl border p-6 flex flex-col cursor-pointer transition-all ${
                  plan.recommended
                    ? "border-primary/30 bg-card shadow-elevated"
                    : "border-border/50 bg-card shadow-soft"
                } ${selectedPlan === plan.id ? "ring-2 ring-primary border-primary" : "hover:border-primary/40"}`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full gradient-hero text-primary-foreground text-xs font-semibold whitespace-nowrap">
                    {I18N.recommended[lang]}
                  </div>
                )}

                <p className="text-muted-foreground text-xs font-medium mb-1">{plan.subtitle[lang]}</p>
                <h3 className="font-display text-base font-semibold mb-3">{plan.name[lang]}</h3>

                <div className="flex items-baseline gap-1 mb-5">
                  <span className="font-display text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period[lang]}</span>
                </div>

                <div className="mt-auto flex justify-center">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedPlan === plan.id ? "border-primary bg-primary" : "border-muted-foreground/40"
                    }`}
                  >
                    {selectedPlan === plan.id && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="text-center text-muted-foreground text-sm mb-10">{I18N.cancel_anytime[lang]}</p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button
            size="lg"
            className="w-full sm:w-auto gap-2 px-8 py-5 gradient-hero shadow-soft text-base font-semibold whitespace-normal"
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading
              ? I18N.processing[lang]
              : `${I18N.choose_btn[lang]} ${selectedPlanInfo.name[lang]} — ${selectedPlanInfo.price}`}
          </Button>

          <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 py-5" asChild>
            <a href={WHATSAPP_LINK}>
              <MessageCircle className="h-4 w-4" />
              {I18N.back_whatsapp[lang]}
            </a>
          </Button>
        </div>

        <section className="text-center text-sm text-muted-foreground">
          <p>{I18N.questions[lang]}</p>
        </section>
      </main>

      {/* Footer — matches landing */}
      <footer className="py-10 px-4 border-t border-border/40 bg-card">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-hero flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-sm">SpeakEasily</span>
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed max-w-2xl">{I18N.footer[lang]}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
