import { MessageCircle } from "lucide-react";
import { landingCopy, type Language } from "@/lib/i18n";

interface FooterProps {
  lang: Language;
}

const CONTENT_LINKS = [
  { href: "/aprender-ingles-por-whatsapp", label: "Aprender inglés por WhatsApp" },
  { href: "/clases-de-ingles-online", label: "Clases de inglés online" },
  { href: "/aprender-ingles-rapido", label: "Aprender inglés rápido" },
  { href: "/curso-de-ingles-gratis", label: "Curso de inglés gratis" },
  { href: "/ingles-para-el-trabajo", label: "Inglés para el trabajo" },
  { href: "/ingles-para-viajar", label: "Inglés para viajar" },
] as const;

const Footer = ({ lang }: FooterProps) => {
  const copy = landingCopy[lang].footer;

  return (
    <footer className="border-t border-border/40 bg-card px-4 py-10">
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-3 text-center md:text-left">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-hero">
                <MessageCircle className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-display text-sm font-semibold">SpeakEasily</span>
            </div>

            <div className="space-y-0.5 text-xs leading-relaxed text-muted-foreground">
              <div>{copy.copyright}</div>
              <div>IVA / NIPC: PT517286688</div>
              <div>
                {copy.website}:{" "}
                <a
                  href="https://speakeasily.nexo-digital.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline transition-colors hover:text-foreground"
                >
                  speakeasily.nexo-digital.app
                </a>
              </div>
              <div>
                {copy.contact}:{" "}
                <a href="mailto:contacto@nexo-digital.app" className="underline transition-colors hover:text-foreground">
                  contacto@nexo-digital.app
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border/50 bg-background p-6">
            <h3 className="font-display text-base font-semibold text-foreground">Recursos recomendados</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Explora guías útiles para aprender inglés con más contexto, más confianza y un camino más claro.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {CONTENT_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-xl border border-border/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
