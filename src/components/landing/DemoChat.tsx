const DemoChat = () => (
  <section className="py-24 px-4 bg-card">
    <div className="container mx-auto max-w-3xl">
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Así Se Ve una Lección
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Un ejemplo real de cómo aprendes inglés por WhatsApp.
        </p>
      </div>

      <div className="max-w-md mx-auto bg-muted/40 rounded-2xl border border-border/40 p-4 sm:p-5 space-y-3 shadow-soft">
        {/* Bot message */}
        <Bubble side="left" text="📖 *Lección 3* — Ordering food" />
        <Bubble side="left" text='✏️ Traduce al inglés:\n🇪🇸 "Me gustaría un café con leche, por favor."' />

        {/* User reply */}
        <Bubble side="right" text="I would like a coffee with milk, please." />

        {/* Bot feedback */}
        <Bubble
          side="left"
          text={'✅ *¡Muy bien!* 🌟\n\n🇺🇸 "I\'d like a latte, please."\n🇪🇸 _Me gustaría un café con leche._\n\n💡 Tip: "latte" es más natural que "coffee with milk".\n\n🔁 Repite: *"I\'d like a latte, please."*'}
        />

        {/* User repeat */}
        <Bubble side="right" text="🎤 0:04" isAudio />

        {/* Bot confirm */}
        <Bubble side="left" text="🎉 *¡Perfecto!* Pronunciación clara.\n\n👉 Siguiente ejercicio →" />
      </div>
    </div>
  </section>
);

interface BubbleProps {
  side: "left" | "right";
  text: string;
  isAudio?: boolean;
}

const Bubble = ({ side, text, isAudio }: BubbleProps) => {
  if (side === "right") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%]">
          {isAudio ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary-foreground/30 flex items-center justify-center">
                <div className="w-0 h-0 border-l-[5px] border-l-primary-foreground border-y-[3px] border-y-transparent ml-0.5" />
              </div>
              <div className="flex gap-[2px] items-end h-3">
                {[3, 5, 8, 6, 10, 7, 4, 9, 5, 7, 3].map((h, i) => (
                  <div key={i} className="w-[2px] bg-primary-foreground/60 rounded-full" style={{ height: `${h}px` }} />
                ))}
              </div>
              <span className="text-xs opacity-80">0:04</span>
            </div>
          ) : (
            <p className="text-xs leading-relaxed whitespace-pre-line">{text}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="bg-card rounded-2xl rounded-tl-sm px-3 py-2 shadow-soft max-w-[85%]">
        <p className="text-xs leading-relaxed whitespace-pre-line">{text}</p>
      </div>
    </div>
  );
};

export default DemoChat;
