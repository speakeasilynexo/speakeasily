import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/landing/LanguageSwitcher";
import { landingCopy, type Language } from "@/lib/i18n";

const WHATSAPP_LINK = "https://wa.me/34657100100?text=Hello";

interface HeaderProps {
  lang: Language;
  onLanguageChange: (language: Language) => void;
}

const Header = ({ lang, onLanguageChange }: HeaderProps) => {
  const copy = landingCopy[lang].header;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="container mx-auto flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-hero shadow-soft">
            <MessageCircle className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">SpeakEasily</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#como-funciona" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {copy.howItWorks}
          </a>
          <a href="#beneficios" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {copy.benefits}
          </a>
          <a href="#planes" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {copy.plans}
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button size="sm" className="gradient-hero text-xs shadow-soft sm:text-sm" asChild>
            <a href={WHATSAPP_LINK}>{copy.cta}</a>
          </Button>
          <LanguageSwitcher currentLanguage={lang} onChange={onLanguageChange} />
        </div>
      </div>
    </header>
  );
};

export default Header;
