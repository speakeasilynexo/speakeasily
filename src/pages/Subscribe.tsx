import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Check, ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PlanType = "mensual" | "trimestral" | "semestral";

interface PlanInfo {
  id: PlanType;
  name: string;
  price: string;
  priceValue: number;
  period: string;
  subtitle: string;
  recommended?: boolean;
}

const PLANS: PlanInfo[] = [
  {
    id: "mensual",
    name: "Mensual",
    price: "€12,99",
    priceValue: 12.99,
    period: "/mes",
    subtitle: "Flexible",
  },
  {
    id: "trimestral",
    name: "Trimestral",
    price: "€29,99",
    priceValue: 29.99,
    period: "/3 meses",
    subtitle: "Mejor equilibrio",
    recommended: true,
  },
  {
    id: "semestral",
    name: "Semestral",
    price: "€49,99",
    priceValue: 49.99,
    period: "/6 meses",
    subtitle: "Mejor ahorro",
  },
];

const BENEFITS = [
  "Audios y práctica real (listening + shadowing)",
  "Corrección inmediata y explicaciones claras",
  "Revisión inteligente de tus errores (para no olvidar)",
  "Progreso visible y módulos nuevos cada semana",
];

const WHATSAPP_LINK = "https://wa.me/34657100100";

export default function Subscribe() {
  const [searchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("trimestral");
  const [isLoading, setIsLoading] = useState(false);
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
            referrer: document.referrer || null,
          },
        });
      } catch (error) {
        console.error("Error tracking page view:", error);
      }
    };
    
    trackPageView();
  }, [waId, source]);

  const handlePlanSelect = async (planId: PlanType) => {
    setSelectedPlan(planId);
    
    try {
      await supabase.from("wa_events").insert({
        wa_id: waId || "web_visitor",
        event_type: "plan_selected",
        metadata: {
          plan: planId,
          source,
        },
      });
    } catch (error) {
      console.error("Error tracking plan selection:", error);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);

    try {
      await supabase.from("wa_events").insert({
        wa_id: waId || "web_visitor",
        event_type: "subscribe_clicked",
        metadata: {
          plan: selectedPlan,
          source,
        },
      });

      // Placeholder: Stripe not integrated yet
      toast({
        title: "Pago en configuración",
        description: "Te avisaremos cuando esté habilitado. ¡Gracias por tu interés!",
      });
    } catch (error) {
      console.error("Error tracking subscribe click:", error);
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
              <span className="hidden sm:inline">Volver</span>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">SpeakEasily</span>
            </div>
            <div className="w-16" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero */}
        <section className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Sigue aprendiendo inglés con SpeakEasily
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Lecciones cortas por WhatsApp, audios, correcciones y revisión inteligente. 
            Sin apps complicadas.
          </p>
        </section>

        {/* Benefits */}
        <section className="mb-12">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 md:p-8">
            <h2 className="text-lg font-semibold mb-4 text-center">¿Qué incluye tu suscripción?</h2>
            <ul className="space-y-3 max-w-md mx-auto">
              {BENEFITS.map((benefit, index) => (
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
          <h2 className="text-xl font-semibold mb-6 text-center">Elige tu plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all hover:shadow-md ${
                  selectedPlan === plan.id
                    ? "ring-2 ring-primary border-primary"
                    : "hover:border-primary/50"
                }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.recommended && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Recomendado
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 mx-auto ${
                      selectedPlan === plan.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {selectedPlan === plan.id && (
                      <Check className="h-4 w-4 text-primary-foreground m-auto" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Anti-fear text */}
        <p className="text-center text-muted-foreground text-sm mb-8">
          Cancela cuando quieras. Mantienes acceso hasta el fin del período.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button
            size="lg"
            className="w-full sm:w-auto gap-2 px-8"
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              "Procesando..."
            ) : (
              <>
                Elegir {selectedPlanInfo.name} — {selectedPlanInfo.price}
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto gap-2"
            asChild
          >
            <a href={WHATSAPP_LINK}>
              <MessageCircle className="h-4 w-4" />
              Volver a WhatsApp
            </a>
          </Button>
        </div>

        {/* FAQ / Trust */}
        <section className="text-center text-sm text-muted-foreground">
          <p>
            ¿Tienes dudas? Escríbenos por WhatsApp y te ayudamos.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          SpeakEasily • Tu coach de inglés por WhatsApp
        </div>
      </footer>
    </div>
  );
}
