import { useSearchParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import Benefits from "@/components/landing/Benefits";
import DemoChat from "@/components/landing/DemoChat";
import SocialProof from "@/components/landing/SocialProof";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

type Language = "pt" | "es" | "en";

const SEO_TITLES: Record<Language, string> = {
  es: "SpeakEasily - Aprende inglés por WhatsApp | Clases de inglés online gratis",
  pt: "SpeakEasily - Aprenda inglês pelo WhatsApp | Aulas de inglês online grátis",
  en: "SpeakEasily - Learn English via WhatsApp | Free Online English Lessons",
};

const SEO_DESCS: Record<Language, string> = {
  es: "Aprende inglés por WhatsApp con lecciones personalizadas de IA. Curso de inglés online gratis: 5 min/día, sin descargar apps. Prueba 7 días gratis.",
  pt: "Aprenda inglês pelo WhatsApp com lições personalizadas de IA. Curso de inglês online grátis: 5 min/dia, sem baixar apps. Teste 7 dias grátis.",
  en: "Learn English on WhatsApp with personalized AI lessons. Free online English course: 5 min/day, no app downloads. Try 7 days free.",
};

function getLang(param: string | null): Language {
  if (param === "pt" || param === "es" || param === "en") return param;
  return "es";
}

const Index = () => {
  const [searchParams] = useSearchParams();
  const lang = getLang(searchParams.get("lang"));

  useSEO({
    title: SEO_TITLES[lang],
    description: SEO_DESCS[lang],
    path: "/",
    lang,
  });

  return (
  <div className="min-h-screen bg-background">
    <Header />
    <HeroSection />
    <SocialProof />
    <HowItWorks />
    <Benefits />
    <DemoChat />
    <Pricing />
    <FAQ />
    <FinalCta />
    <Footer />
  </div>
  );
};

export default Index;
