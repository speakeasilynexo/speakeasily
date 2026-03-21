import { useSEO } from "@/hooks/useSEO";
import { useLanguage } from "@/hooks/useLanguage";
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
import ContentGuides from "@/components/landing/ContentGuides";
import { landingCopy } from "@/lib/i18n";

const Index = () => {
  const { lang, setLanguage } = useLanguage();
  const copy = landingCopy[lang];

  useSEO({
    title: copy.seo.title,
    description: copy.seo.description,
    path: "/",
    lang,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header lang={lang} onLanguageChange={setLanguage} />
      <HeroSection lang={lang} />
      <SocialProof lang={lang} />
      <HowItWorks lang={lang} />
      <Benefits lang={lang} />
      <DemoChat lang={lang} />
      <Pricing lang={lang} />
      <ContentGuides />
      <FAQ lang={lang} />
      <FinalCta lang={lang} />
      <Footer lang={lang} />
    </div>
  );
};

export default Index;
