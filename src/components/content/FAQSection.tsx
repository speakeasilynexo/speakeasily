import { useEffect, useState } from "react";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  items: FAQItem[];
  title: string;
  description: string;
}

const CONTENT_FAQ_SCRIPT_ID = "content-faq-jsonld";

const FAQSection = ({ items, title, description }: FAQSectionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    // Remove any previous content FAQ script to avoid duplicates
    const existing = document.getElementById(CONTENT_FAQ_SCRIPT_ID);
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = CONTENT_FAQ_SCRIPT_ID;
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [items]);

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6" aria-labelledby="faq-title">
      <div className="mb-8 max-w-2xl">
        <h2 id="faq-title" className="text-3xl font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-600">
          {description}
        </p>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          const answerId = `faq-answer-${index}`;

          return (
            <div key={item.question} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span className="text-base font-medium text-slate-900">{item.question}</span>
                <span className="text-lg font-semibold text-green-600">{isOpen ? "-" : "+"}</span>
              </button>
              {isOpen ? (
                <div id={answerId} className="border-t border-slate-100 px-5 py-4 text-sm leading-7 text-slate-600">
                  {item.answer}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FAQSection;
