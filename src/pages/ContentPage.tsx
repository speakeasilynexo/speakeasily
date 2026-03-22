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
import NotFound from "@/pages/NotFound";
import ContentLayout from "@/components/content/ContentLayout";
import ContentHero from "@/components/content/ContentHero";
import ContentNav from "@/components/content/ContentNav";
import FAQSection from "@/components/content/FAQSection";
import ComparisonTable, { type ComparisonRow } from "@/components/content/ComparisonTable";
import CTABanner from "@/components/content/CTABanner";
import InternalLinks from "@/components/content/InternalLinks";
import HowItWorks, { type HowItWorksStep } from "@/components/content/HowItWorks";
import { contentPages } from "@/data/contentPages";

const comparisonRows: ComparisonRow[] = [
  { feature: "Aprender dentro de WhatsApp", speakeasily: true, competitor: false },
  { feature: "Correcciones con inteligencia artificial", speakeasily: true, competitor: false },
  { feature: "Lecciones cortas y fáciles de sostener", speakeasily: true, competitor: true },
  { feature: "Adaptación al objetivo del usuario", speakeasily: true, competitor: false },
];

const steps: HowItWorksStep[] = [
  {
    number: 1,
    title: "Escribes por WhatsApp",
    description: "Empiezas en el mismo canal que ya usas cada día, sin instalar otra app ni cambiar tu rutina.",
  },
  {
    number: 2,
    title: "Recibes práctica guiada",
    description: "SpeakEasily te envía ejercicios breves, ejemplos claros y situaciones útiles para mejorar tu inglés.",
  },
  {
    number: 3,
    title: "La IA corrige y adapta",
    description: "La inteligencia artificial revisa tus respuestas y enfoca la práctica en lo que más necesitas reforzar.",
  },
];

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

const ContentPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const page = contentPages.find((item) => item.slug === slug);

  useSEO({
    title: page?.metaTitle ?? "SpeakEasily",
    description: page?.metaDescription ?? "Aprende inglés por WhatsApp con inteligencia artificial.",
    path: location.pathname,
    lang: "es",
  });

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
    <ContentLayout breadcrumb={page.h1}>
      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fff9_65%,#ffffff_100%)]">
        <div className="absolute left-[-8%] top-12 hidden h-48 w-48 rounded-full bg-green-100 blur-3xl sm:block" />
        <div className="absolute right-[-10%] top-20 hidden h-64 w-64 rounded-full bg-emerald-100 blur-3xl sm:block" />
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:gap-10 sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="max-w-3xl pt-2 sm:pt-0">
            <p className="mb-4 inline-flex rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-sm font-medium text-green-700">
              Práctica diaria por WhatsApp
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">{page.h1}</h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">{page.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://wa.me/34657100100?text=Hello"
                className="inline-flex rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
              >
                Prueba gratis en WhatsApp →
              </a>
              <a
                href="/"
                className="inline-flex rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-green-300 hover:text-green-700"
              >
                Volver al inicio
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-green-700">Qué vas a encontrar</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Contenido práctico, claro y accionable</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Estas guías están pensadas para ayudar a usuarios reales a entender cómo aprender inglés de forma más simple, con contexto útil y sin ruido.
              </p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
              <p className="text-sm font-medium text-green-300">Método SpeakEasily</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">WhatsApp + inteligencia artificial + constancia</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Una experiencia más ligera para practicar, recibir correcciones y mantener el hábito sin depender de clases pesadas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
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

      <HowItWorks steps={steps} />
      <ComparisonTable rows={comparisonRows} />
      <FAQSection items={page.faq} />
      <CTABanner />
      <InternalLinks links={page.internalLinks} />
    </ContentLayout>
  );
};

export default ContentPage;
