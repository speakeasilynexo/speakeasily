import { MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const WHATSAPP_LINK = "https://wa.me/34657100100?text=Hello";

const FinalCta = () => (
  <section className="py-24 px-4 gradient-subtle relative overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 blur-3xl rounded-full hidden sm:block" />
    <div className="container mx-auto max-w-2xl text-center relative">
      <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 tracking-tight">
        ¿Listo para Aprender Inglés Gratis?
      </h2>
      <p className="text-muted-foreground text-lg mb-8">
        Empieza tu curso de inglés por WhatsApp y verás tu progreso en pocos días.
      </p>
      <Button
        size="lg"
        className="gradient-hero text-base px-8 py-6 shadow-elevated w-full sm:w-auto"
        asChild
      >
        <a href={WHATSAPP_LINK}>
          <MessageCircle className="w-5 h-5 mr-2" />
          Iniciar Mi Viaje
          <ArrowRight className="w-5 h-5 ml-2" />
        </a>
      </Button>
    </div>
  </section>
);

export default FinalCta;
