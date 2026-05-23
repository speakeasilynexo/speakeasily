import { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  Bot,
  Brain,
  BrainCircuit,
  BriefcaseBusiness,
  CircleCheckBig,
  Clock3,
  Cpu,
  Gift,
  MapPinned,
  MessageCircle,
  MessagesSquare,
  MonitorSmartphone,
  Plane,
  Repeat,
  Sparkles,
  Target,
  Wallet,
  Zap,
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useLanguage } from "@/hooks/useLanguage";
import NotFound from "@/pages/NotFound";
import ContentLayout from "@/components/content/ContentLayout";
import ContentHero from "@/components/content/ContentHero";
import FAQSection from "@/components/content/FAQSection";
import ComparisonTable, { type ComparisonRow } from "@/components/content/ComparisonTable";
import CTABanner from "@/components/content/CTABanner";
import InternalLinks from "@/components/content/InternalLinks";
import HowItWorks, { type HowItWorksStep } from "@/components/content/HowItWorks";
import { getContentPages } from "@/data/contentPages";
import { contentUICopy } from "@/lib/contentI18n";

function getIcon(icon: string) {
  switch (icon) {
    case "message-circle":
      return MessageCircle;
    case "brain":
      return Brain;
    case "clock-3":
      return Clock3;
    case "monitor-smartphone":
      return MonitorSmartphone;
    case "sparkles":
      return Sparkles;
    case "target":
      return Target;
    case "zap":
      return Zap;
    case "repeat":
      return Repeat;
    case "bot":
      return Bot;
    case "gift":
      return Gift;
    case "circle-check-big":
      return CircleCheckBig;
    case "wallet":
      return Wallet;
    case "briefcase-business":
      return BriefcaseBusiness;
    case "messages-square":
      return MessagesSquare;
    case "brain-circuit":
      return BrainCircuit;
    case "plane":
      return Plane;
    case "map-pinned":
      return MapPinned;
    case "cpu":
      return Cpu;
    default:
      return Sparkles;
  }
}

type ContentPageProps = {
  staticSlug?: string;
};

const ContentPage = ({ staticSlug }: ContentPageProps) => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { lang } = useLanguage();
  const copy = contentUICopy[lang];
  const pages = getContentPages(lang);
  
  // Normalizar o slug removendo barras extras no final para garantir o match
  const normalizedSlug = (staticSlug ?? slug)?.replace(/\/\/$/, "");
  const page = pages.find((item) => item.slug === normalizedSlug);

  useSEO({
    title: page?.metaTitle ?? "SpeakEasily",
    description: page?.metaDescription ?? "Aprende inglés por WhatsApp con inteligencia artificial.",
    path: location.pathname,
    lang,
  });

  const comparisonRows: ComparisonRow[] = copy.comparisonFeatures.map((feature, i) => ({
    feature,
    speakeasily: true,
    competitor: i === 2,
  }));

  const steps: HowItWorksStep[] = copy.steps.map((step, i) => ({
    number: i + 1,
    title: step.title,
    description: step.description,
  }));

  useEffect(() => {
    if (!page) return;

    const scripts: HTMLScriptElement[] = [];

    const webPageScript = document.createElement("script");
    webPageScript.type = "application/ld+json";
    webPageScript.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.h1,
      description: page.metaDescription,
      url: `https://speakeasily.nexo-digital.app/${page.slug}`,
      inLanguage: lang === "es" ? "es-ES" : lang === "pt" ? "pt-BR" : "en-US",
      isPartOf: {
        "@type": "WebSite",
        name: "SpeakEasily",
        url: "https://speakeasily.nexo-digital.app",
      },
    });
    document.head.appendChild(webPageScript);
    scripts.push(webPageScript);

    if (page.slug === "clases-de-ingles-online") {
      const courseScript = document.createElement("script");
      courseScript.type = "application/ld+json";
      courseScript.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Course",
        name: "Clases de inglés online con SpeakEasily",
        description: page.metaDescription,
        provider: {
          "@type": "Organization",
          name: "SpeakEasily",
          url: "https://speakeasily.nexo-digital.app/",
        },
      });
      document.head.appendChild(courseScript);
      scripts.push(courseScript);
    }

    return () => {
      for (const script of scripts) {
        script.remove();
      }
    };
  }, [page]);

  if (!page) {
    return <NotFound />;
  }

  return (
    <ContentLayout breadcrumb={page.h1} currentSlug={slug ?? ""} copy={copy} pages={pages}>
      <ContentHero badge={copy.heroBadge} h1={page.h1} intro={page.intro} copy={copy} />

      <section className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-5 md:grid-cols-3">
          {page.benefits.map((benefit) => {
            const Icon = getIcon(benefit.icon);

            return (
              <article key={benefit.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-slate-900">{benefit.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{benefit.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <HowItWorks steps={steps} title={copy.howItWorksTitle} description={copy.howItWorksDescription} />
      <ComparisonTable
        rows={comparisonRows}
        speakEasilyLabel={copy.comparisonSpeakEasily}
        othersLabel={copy.comparisonOthers}
        title={copy.comparisonTitle}
      />
      <FAQSection items={page.faq} title={copy.faqTitle} description={copy.faqDescription} />
      <CTABanner title={copy.ctaTitle} description={copy.ctaDescription} buttonText={copy.ctaButton} />
      <InternalLinks links={page.internalLinks} title={copy.internalLinksTitle} />
    </ContentLayout>
  );
};

export default ContentPage;
