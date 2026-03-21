import { useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { landingCopy, type Language } from "@/lib/i18n";

interface FAQProps {
  lang: Language;
}

const FAQ = ({ lang }: FAQProps) => {
  const copy = landingCopy[lang].faq;

  useEffect(() => {
    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: copy.items.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    };

    const id = "faq-jsonld";
    let script = document.getElementById(id) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(faqJsonLd);

    return () => {
      script?.remove();
    };
  }, [copy.items]);

  return (
    <section id="faq" className="bg-card px-4 py-24">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-14 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold tracking-tight md:text-4xl">{copy.title}</h2>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">{copy.description}</p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {copy.items.map((faq, index) => (
            <AccordionItem key={faq.q} value={`faq-${index}`} className="rounded-xl border border-border/50 bg-background px-5">
              <AccordionTrigger className="text-left text-sm font-medium hover:no-underline sm:text-base">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
