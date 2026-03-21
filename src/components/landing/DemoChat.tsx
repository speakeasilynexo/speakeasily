import { landingCopy, type Language } from "@/lib/i18n";

interface DemoChatProps {
  lang: Language;
}

const DemoChat = ({ lang }: DemoChatProps) => {
  const copy = landingCopy[lang].demoChat;

  return (
    <section className="bg-card px-4 py-24">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold tracking-tight md:text-4xl">{copy.title}</h2>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">{copy.description}</p>
        </div>

        <div className="mx-auto max-w-md space-y-3 rounded-2xl border border-border/40 bg-muted/40 p-4 shadow-soft sm:p-5">
          {copy.messages.map((message, index) => (
            <Bubble key={`${message.side}-${index}`} side={message.side} text={message.text} isAudio={message.isAudio} />
          ))}
        </div>
      </div>
    </section>
  );
};

interface BubbleProps {
  side: "left" | "right";
  text: string;
  isAudio: boolean;
}

const Bubble = ({ side, text, isAudio }: BubbleProps) => {
  if (side === "right") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-primary-foreground">
          {isAudio ? (
            <div className="flex items-center gap-2">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground/30">
                <div className="ml-0.5 h-0 w-0 border-y-[3px] border-y-transparent border-l-[5px] border-l-primary-foreground" />
              </div>
              <div className="flex h-3 items-end gap-[2px]">
                {[3, 5, 8, 6, 10, 7, 4, 9, 5, 7, 3].map((height, index) => (
                  <div key={index} className="w-[2px] rounded-full bg-primary-foreground/60" style={{ height: `${height}px` }} />
                ))}
              </div>
              <span className="text-xs opacity-80">0:04</span>
            </div>
          ) : (
            <p className="whitespace-pre-line text-xs leading-relaxed">{text}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-card px-3 py-2 shadow-soft">
        <p className="whitespace-pre-line text-xs leading-relaxed">{text}</p>
      </div>
    </div>
  );
};

export default DemoChat;
