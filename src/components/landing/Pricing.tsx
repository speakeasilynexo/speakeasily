import { MessageCircle, CheckCircle, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { landingCopy, type Language } from "@/lib/i18n";

const WHATSAPP_LINK = "https://wa.me/34657100100?text=Hello";

const planPrices = [
  { price: "€7,99", highlight: false },
  { price: "€19,99", highlight: true },
  { price: "€34,99", highlight: false },
] as const;

interface PricingProps {
  lang: Language;
}

const Pricing = ({ lang }: PricingProps) => {
  const copy = landingCopy[lang].pricing;

  return (
    <section id="planes" className="px-4 py-24">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent-foreground">
            <Gift className="h-3.5 w-3.5" />
            <span>{copy.badge}</span>
          </div>
          <h2 className="mb-4 font-display text-3xl font-bold tracking-tight md:text-4xl">{copy.title}</h2>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">{copy.description}</p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
          {copy.plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                planPrices[index].highlight ? "border-primary/30 bg-card shadow-elevated" : "border-border/50 bg-card shadow-soft"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-6 rounded-full px-3 py-0.5 text-xs font-semibold text-primary-foreground gradient-hero">
                  {plan.badge}
                </div>
              )}

              <h3 className="mb-2 font-display text-lg font-semibold">{plan.name}</h3>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold">{planPrices[index].price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full py-5 ${planPrices[index].highlight ? "gradient-hero shadow-soft" : ""}`}
                variant={planPrices[index].highlight ? "default" : "outline"}
                asChild
              >
                <a href={WHATSAPP_LINK}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {plan.cta}
                </a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
