import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/landing/LanguageSwitcher";
import { landingCopy, type Language } from "@/lib/i18n";

const WHATSAPP_LINK = "https://wa.me/34657100100?text=Hello";
const CONTENT_LINKS = [
  { href: "/aprender-ingles-por-whatsapp", label: "WhatsApp" },
  { href: "/clases-de-ingles-online", label: "Clases online" },
  { href: "/aprender-ingles-rapido", label: "Inglés rápido" },
  { href: "/curso-de-ingles-gratis", label: "Curso gratis" },
  { href: "/ingles-para-el-trabajo", label: "Trabajo" },
  { href: "/ingles-para-viajar", label: "Viajes" },
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/metodologia", label: "Metodología" },
  { href: "/pronunciacion", label: "Pronunciación" },
  { href: "/correccion-en-tiempo-real", label: "Corrección" },
  { href: "/preguntas-frecuentes", label: "FAQ" },
  { href: "/ingles-para-principiantes", label: "Principiantes" },
] as const;

interface HeaderProps {
  lang: Language;
  onLanguageChange: (language: Language) => void;
}

const Header = ({ lang, onLanguageChange }: HeaderProps) => {
  const copy = landingCopy[lang].header;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
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
          <div className="group relative">
            <button type="button" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Recursos
            </button>
            <div className="invisible absolute right-0 top-full z-10 mt-3 w-[34rem] rounded-2xl border border-border/60 bg-background/95 p-2 opacity-0 shadow-elevated backdrop-blur transition-all duration-200 group-hover:visible group-hover:opacity-100">
              <div className="grid grid-cols-2 gap-1">
              {CONTENT_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button size="sm" className="gradient-hero text-xs shadow-soft sm:text-sm" asChild>
            <a href={WHATSAPP_LINK}>{copy.cta}</a>
          </Button>
          <LanguageSwitcher currentLanguage={lang} onChange={onLanguageChange} />
        </div>
      </div>

      <div className="border-t border-border/40 bg-background/85 px-4 py-2 md:hidden">
        <div className="container mx-auto flex gap-2 overflow-x-auto">
          {CONTENT_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
