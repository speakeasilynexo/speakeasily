import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WHATSAPP_LINK = "https://wa.me/34657100100?text=Hello";

const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
    <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shadow-soft">
          <MessageCircle className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-lg tracking-tight">SpeakEasily</span>
      </div>
      <nav className="hidden md:flex items-center gap-8">
        <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Cómo Funciona
        </a>
        <a href="#beneficios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Beneficios
        </a>
        <a href="#planes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Planes
        </a>
      </nav>
      <Button size="sm" className="gradient-hero shadow-soft text-xs sm:text-sm" asChild>
        <a href={WHATSAPP_LINK}>Empieza Ahora</a>
      </Button>
    </div>
  </header>
);

export default Header;
