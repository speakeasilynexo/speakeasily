import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Check, ArrowLeft, CheckCircle, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/landing/LanguageSwitcher";
import { buildLocalizedPath, type Language } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

type PlanType = "mensual" | "trimestral" | "semestral";

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
} as const;

const WHATSAPP_LINK = "https://wa.me/34657100100";
const SUPABASE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export default function Subscribe() {
  const { lang, setLanguage } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("trimestral");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const source = searchParams.get("source") || "direct";
  const waId = searchParams.get("wa_id") || null;

  const seoTitles: Record<Language, string> = {
    es: "Suscríbete - SpeakEasily",
    pt: "Assine - SpeakEasily",
    en: "Subscribe - SpeakEasily",
  };
  const seoDescriptions: Record<Language, string> = {
    es: "Elige tu plan y empieza a aprender inglés por WhatsApp con SpeakEasily.",
    pt: "Escolha seu plano e comece a aprender inglês pelo WhatsApp com SpeakEasily.",
    en: "Choose your plan and start learning English via WhatsApp with SpeakEasily.",
  };

  useSEO({
    title: seoTitles[lang],
    description: seoDescriptions[lang],
    path: "/subscribe",
    lang,
  });

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

    void trackPageView();
  }, [lang, source, waId]);

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

      const result = (await response.json()) as { error?: string; url?: string };

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

  const selectedPlanInfo = PLANS.find((plan) => plan.id === selectedPlan);

  if (!selectedPlanInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
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

          <LanguageSwitcher currentLanguage={lang} onChange={setLanguage} />
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 pb-16 pt-28">
        <section className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent-foreground">
            <Gift className="h-3.5 w-3.5" />
            <span>{I18N.choose_plan[lang]}</span>
          </div>
          <h1 className="mb-4 font-display text-3xl font-bold tracking-tight text-balance md:text-4xl lg:text-5xl">
            {I18N.headline[lang]}
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">{I18N.subheadline[lang]}</p>
        </section>

        <section className="mb-16">
          <div className="rounded-2xl border border-primary/20 bg-card p-7 shadow-soft md:p-10">
            <h2 className="mb-6 text-center font-display text-lg font-semibold md:text-xl">{I18N.benefits_title[lang]}</h2>
            <ul className="mx-auto max-w-lg space-y-3.5">
              {BENEFITS[lang].map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => void handlePlanSelect(plan.id)}
                className={`relative flex cursor-pointer flex-col rounded-2xl border p-6 transition-all ${
                  plan.recommended ? "border-primary/30 bg-card shadow-elevated" : "border-border/50 bg-card shadow-soft"
                } ${selectedPlan === plan.id ? "border-primary ring-2 ring-primary" : "hover:border-primary/40"}`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-semibold text-primary-foreground gradient-hero">
                    {I18N.recommended[lang]}
                  </div>
                )}

                <p className="mb-1 text-xs font-medium text-muted-foreground">{plan.subtitle[lang]}</p>
                <h3 className="mb-3 font-display text-base font-semibold">{plan.name[lang]}</h3>

                <div className="mb-5 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period[lang]}</span>
                </div>

                <div className="mt-auto flex justify-center">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
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

        <p className="mb-10 text-center text-sm text-muted-foreground">{I18N.cancel_anytime[lang]}</p>

        <div className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="w-full gap-2 whitespace-normal px-8 py-5 text-base font-semibold shadow-soft gradient-hero sm:w-auto"
            onClick={() => void handleSubscribe()}
            disabled={isLoading}
          >
            {isLoading ? I18N.processing[lang] : `${I18N.choose_btn[lang]} ${selectedPlanInfo.name[lang]} - ${selectedPlanInfo.price}`}
          </Button>

          <Button variant="outline" size="lg" className="w-full gap-2 py-5 sm:w-auto" asChild>
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

      <footer className="border-t border-border/40 bg-card px-4 py-10">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-hero">
                <MessageCircle className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-display text-sm font-semibold">SpeakEasily</span>
            </div>
            <div className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{I18N.footer[lang]}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
