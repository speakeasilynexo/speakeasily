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
  es: "SpeakEasily - Aprende inglés por WhatsApp",
  pt: "SpeakEasily - Aprenda inglês pelo WhatsApp",
  en: "SpeakEasily - Learn English via WhatsApp",
};

const SEO_DESCS: Record<Language, string> = {
  es: "Aprende inglés de forma natural conversando por WhatsApp. Practica con conversaciones reales y mejora tu fluidez.",
  pt: "Aprenda inglês de forma natural conversando pelo WhatsApp. Pratique com conversas reais e melhore sua fluência.",
  en: "Learn English naturally by chatting on WhatsApp. Practice with real conversations and improve your fluency.",
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
