import { MessageCircle } from "lucide-react";

const Footer = () => (
  <footer className="py-10 px-4 border-t border-border/40 bg-card">
    <div className="container mx-auto max-w-5xl">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-hero flex items-center justify-center">
            <MessageCircle className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-sm">SpeakEasily</span>
        </div>

        <div className="text-xs text-muted-foreground leading-relaxed space-y-0.5">
          <div>© 2026 SpeakEasily · Aprende inglés por WhatsApp</div>
          <div>
            SpeakEasily es una marca operada por <span className="font-medium">ELIAS ISRAEL MENDES UNIPESSOAL LDA</span>
          </div>
          <div>IVA / NIPC: PT517286688</div>
          <div>
            Sitio web:{" "}
            <a
              href="https://speakeasily.nexo-digital.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              speakeasily.nexo-digital.app
            </a>
          </div>
          <div>
            Contacto:{" "}
            <a href="mailto:contacto@nexo-digital.app" className="underline hover:text-foreground transition-colors">
              contacto@nexo-digital.app
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
