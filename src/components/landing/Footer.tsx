import { MessageCircle } from "lucide-react";
import { landingCopy, type Language } from "@/lib/i18n";

interface FooterProps {
  lang: Language;
}

const Footer = ({ lang }: FooterProps) => {
  const copy = landingCopy[lang].footer;

  return (
    <footer className="border-t border-border/40 bg-card px-4 py-10">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
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
      </div>
    </footer>
  );
};

export default Footer;
