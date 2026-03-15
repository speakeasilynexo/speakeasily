import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import Benefits from "@/components/landing/Benefits";
import DemoChat from "@/components/landing/DemoChat";
import SocialProof from "@/components/landing/SocialProof";
import Pricing from "@/components/landing/Pricing";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <HeroSection />
    <SocialProof />
    <HowItWorks />
    <Benefits />
    <DemoChat />
    <Pricing />
    <FinalCta />
    <Footer />
  </div>
);

export default Index;
