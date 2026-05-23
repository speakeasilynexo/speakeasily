import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CircleHelp,
  ClipboardCheck,
  Globe,
  GraduationCap,
  MessageCircle,
  Mic,
  Plane,
  Route,
  Sparkles,
  Zap,
} from "lucide-react";

const guides = [
  {
    href: "/aprender-ingles-por-whatsapp",
    title: "Aprender inglés por WhatsApp",
    description: "Una guía clara para entender por qué practicar dentro de WhatsApp puede ayudarte a ser más constante y avanzar mejor.",
    icon: MessageCircle,
    accent: "from-green-500/20 to-emerald-500/5",
  },
  {
    href: "/clases-de-ingles-online",
    title: "Clases de inglés online",
    description: "Descubre una alternativa más flexible a las clases tradicionales con apoyo de inteligencia artificial y práctica útil.",
    icon: GraduationCap,
    accent: "from-sky-500/20 to-cyan-500/5",
  },
  {
    href: "/aprender-ingles-rapido",
    title: "Aprender inglés rápido",
    description: "Qué funciona de verdad cuando quieres avanzar antes, sin depender de métodos pesados ni sesiones imposibles de sostener.",
    icon: Zap,
    accent: "from-amber-500/20 to-orange-500/5",
  },
  {
    href: "/curso-de-ingles-gratis",
    title: "Curso de inglés gratis",
    description: "Empieza con una experiencia real, prueba el método y entiende si este formato encaja contigo antes de decidir.",
    icon: BookOpen,
    accent: "from-violet-500/20 to-fuchsia-500/5",
  },
  {
    href: "/ingles-para-el-trabajo",
    title: "Inglés para el trabajo",
    description: "Mejora tu inglés profesional con práctica enfocada en reuniones, correos, entrevistas y comunicación diaria.",
    icon: BriefcaseBusiness,
    accent: "from-slate-500/20 to-zinc-500/5",
  },
  {
    href: "/ingles-para-viajar",
    title: "Inglés para viajar",
    description: "Prepárate para hablar con más seguridad en aeropuertos, hoteles, restaurantes y situaciones reales durante tus viajes.",
    icon: Plane,
    accent: "from-teal-500/20 to-green-500/5",
  },
  {
    href: "/como-funciona",
    title: "Cómo funciona",
    description: "Conoce el flujo de aprendizaje, desde el primer mensaje hasta la práctica diaria con correcciones útiles.",
    icon: Route,
    accent: "from-lime-500/20 to-green-500/5",
  },
  {
    href: "/metodologia",
    title: "Metodología",
    description: "Entiende cómo combinamos repetición, contexto real y feedback para ayudarte a sostener el hábito.",
    icon: ClipboardCheck,
    accent: "from-indigo-500/20 to-sky-500/5",
  },
  {
    href: "/pronunciacion",
    title: "Pronunciación",
    description: "Practica sonidos, ritmo y confianza al hablar con ejercicios pensados para el día a día.",
    icon: Mic,
    accent: "from-rose-500/20 to-pink-500/5",
  },
  {
    href: "/correccion-en-tiempo-real",
    title: "Corrección en tiempo real",
    description: "Descubre cómo recibir feedback claro mientras practicas, sin esperar a una próxima clase.",
    icon: Sparkles,
    accent: "from-cyan-500/20 to-blue-500/5",
  },
  {
    href: "/preguntas-frecuentes",
    title: "Preguntas frecuentes",
    description: "Resuelve dudas sobre niveles, precios, WhatsApp, prueba gratis y funcionamiento general.",
    icon: CircleHelp,
    accent: "from-stone-500/20 to-neutral-500/5",
  },
  {
    href: "/ingles-para-principiantes",
    title: "Inglés para principiantes",
    description: "Empieza desde cero con una ruta sencilla y práctica, sin sentirte perdido entre demasiadas opciones.",
    icon: GraduationCap,
    accent: "from-emerald-500/20 to-lime-500/5",
  },
] as const;

const featuredLinks = [
  { href: "/aprender-ingles-por-whatsapp", label: "WhatsApp" },
  { href: "/clases-de-ingles-online", label: "Clases online" },
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/ingles-para-principiantes", label: "Principiantes" },
  { href: "/ingles-para-el-trabajo", label: "Trabajo" },
  { href: "/ingles-para-viajar", label: "Viajes" },
] as const;

const ContentGuides = () => {
  return (
    <section className="relative overflow-hidden border-y border-border/40 bg-card px-4 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.10),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.08),transparent_35%)]" />
      <div className="container relative mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Globe className="h-4 w-4" />
              <span>Recursos para aprender mejor</span>
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Explora guías prácticas para aprender inglés con más claridad
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Además de la experiencia principal en WhatsApp, ahora puedes acceder a contenidos útiles para entender el método, resolver dudas y encontrar el enfoque que mejor encaja con tu objetivo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {featuredLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full border border-border/60 bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {guides.map((guide) => {
            const Icon = guide.icon;

            return (
              <a
                key={guide.href}
                href={guide.href}
                className="group relative overflow-hidden rounded-[28px] border border-border/50 bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-elevated"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${guide.accent} opacity-80 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className="relative">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">{guide.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{guide.description}</p>
                  <div className="mt-6 inline-flex items-center text-sm font-semibold text-primary">
                    Leer guía
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ContentGuides;
