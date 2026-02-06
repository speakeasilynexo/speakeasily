import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Check, ArrowLeft, Sparkles } from "lucide-react";
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
    price: "€12,99",
    priceValue: 12.99,
    period: { pt: "/mês", es: "/mes", en: "/month" },
    subtitle: { pt: "Flexível", es: "Flexible", en: "Flexible" },
  },
  {
    id: "trimestral",
    name: { pt: "Trimestral", es: "Trimestral", en: "Quarterly" },
    price: "€29,99",
    priceValue: 29.99,
    period: { pt: "/3 meses", es: "/3 meses", en: "/3 months" },
    subtitle: { pt: "Melhor equilíbrio", es: "Mejor equilibrio", en: "Best balance" },
    recommended: true,
  },
  {
    id: "semestral",
    name: { pt: "Semestral", es: "Semestral", en: "Biannual" },
    price: "€49,99",
    priceValue: 49.99,
    period: { pt: "/6 meses", es: "/6 meses", en: "/6 months" },
    subtitle: { pt: "Maior economia", es: "Mejor ahorro", en: "Best savings" },
  },
];

const BENEFITS: Record<Language, string[]> = {
  pt: [
    "Áudios e prática real (listening + shadowing)",
    "Correção imediata e explicações claras",
    "Revisão inteligente dos seus erros (para não esquecer)",
    "Progresso visível e módulos novos toda semana",
  ],
  es: [
    "Audios y práctica real (listening + shadowing)",
    "Corrección inmediata y explicaciones claras",
    "Revisión inteligente de tus errores (para no olvidar)",
    "Progreso visible y módulos nuevos cada semana",
  ],
  en: [
    "Audio and real practice (listening + shadowing)",
    "Immediate feedback and clear explanations",
    "Smart review of your mistakes (so you don't forget)",
    "Visible progress and new modules every week",
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
    pt: "SpeakEasily • Seu coach de inglês por WhatsApp",
    es: "SpeakEasily • Tu coach de inglés por WhatsApp",
    en: "SpeakEasily • Your English coach on WhatsApp",
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
  return "es"; // Default to Spanish
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
        metadata: {
          plan: planId,
          source,
          lang,
        },
      });
    } catch (error) {
      console.error("Error tracking plan selection:", error);
    }
  };

  const handleSubscribe = async () => {
    if (!waId) {
      toast({
        title: I18N.error_title[lang],
        description: I18N.error_no_wa_id[lang],
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await supabase.from("wa_events").insert({
        wa_id: waId,
        event_type: "subscribe_clicked",
        metadata: { plan: selectedPlan, source, lang },
      });

      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/activate-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wa_id: waId, plan: selectedPlan, source }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || I18N.error_generic[lang]);
      }

      const planName = PLANS.find(p => p.id === selectedPlan)?.name[lang] || selectedPlan;
      toast({
        title: I18N.success_title[lang],
        description: I18N.success_msg[lang].replace("{plan}", planName),
      });

    } catch (error) {
      console.error("Error activating subscription:", error);
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
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{I18N.back[lang]}</span>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">SpeakEasily</span>
            </div>
            {/* Language Selector */}
            <div className="flex gap-1">
              {(["pt", "es", "en"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => handleLanguageChange(l)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    lang === l
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {l === "pt" ? "🇧🇷 PT" : l === "es" ? "🇪🇸 ES" : "🇺🇸 EN"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero */}
        <section className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{I18N.headline[lang]}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{I18N.subheadline[lang]}</p>
        </section>

        {/* Benefits */}
        <section className="mb-12">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 md:p-8">
            <h2 className="text-lg font-semibold mb-4 text-center">{I18N.benefits_title[lang]}</h2>
            <ul className="space-y-3 max-w-md mx-auto">
              {BENEFITS[lang].map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>✅ {benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Plans */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-6 text-center">{I18N.choose_plan[lang]}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all hover:shadow-md ${
                  selectedPlan === plan.id ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
                }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.recommended && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">{I18N.recommended[lang]}</Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{plan.name[lang]}</CardTitle>
                  <CardDescription>{plan.subtitle[lang]}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period[lang]}</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 mx-auto ${
                      selectedPlan === plan.id ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}
                  >
                    {selectedPlan === plan.id && <Check className="h-4 w-4 text-primary-foreground m-auto" />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <p className="text-center text-muted-foreground text-sm mb-8">{I18N.cancel_anytime[lang]}</p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button size="lg" className="w-full sm:w-auto gap-2 px-8" onClick={handleSubscribe} disabled={isLoading}>
            {isLoading ? I18N.processing[lang] : `${I18N.choose_btn[lang]} ${selectedPlanInfo.name[lang]} — ${selectedPlanInfo.price}`}
          </Button>
          
          <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2" asChild>
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

      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          {I18N.footer[lang]}
        </div>
      </footer>
    </div>
  );
}
