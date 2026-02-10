import { MessageCircle, CheckCircle, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

const WHATSAPP_LINK = "https://wa.me/34657100100?text=Hello";

const plans = [
  {
    name: "Prueba Gratis",
    price: "€0",
    period: "7 días",
    badge: null,
    highlight: false,
    features: [
      "20 lecciones completas",
      "Feedback IA ilimitado",
      "Correcciones detalladas",
      "Sin tarjeta de crédito",
    ],
    cta: "Empezar Gratis",
  },
  {
    name: "Premium",
    price: "€9",
    period: "/mes",
    badge: "Popular",
    highlight: true,
    features: [
      "Lecciones ilimitadas",
      "Práctica con audio",
      "Vocabulario personalizado",
      "Soporte prioritario",
      "Acceso a todos los niveles",
    ],
    cta: "Elegir Premium",
  },
];

const Pricing = () => (
  <section id="planes" className="py-24 px-4">
    <div className="container mx-auto max-w-4xl">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent-foreground text-sm font-medium mb-6">
          <Gift className="w-3.5 h-3.5" />
          <span>Planes Simples</span>
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Empieza Gratis, Crece a Tu Ritmo
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Sin compromisos. Cancela cuando quieras.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border p-7 flex flex-col ${
              plan.highlight
                ? "border-primary/30 bg-card shadow-elevated"
                : "border-border/50 bg-card shadow-soft"
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full gradient-hero text-primary-foreground text-xs font-semibold">
                {plan.badge}
              </div>
            )}

            <h3 className="font-display text-lg font-semibold mb-2">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-display text-4xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground text-sm">{plan.period}</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Button
              className={`w-full py-5 ${plan.highlight ? "gradient-hero shadow-soft" : ""}`}
              variant={plan.highlight ? "default" : "outline"}
              asChild
            >
              <a href={WHATSAPP_LINK}>
                <MessageCircle className="w-4 h-4 mr-2" />
                {plan.cta}
              </a>
            </Button>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Pricing;
