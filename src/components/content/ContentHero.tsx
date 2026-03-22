import { MessageCircle } from "lucide-react";
import type { Language } from "@/lib/i18n";
import type { ContentUICopy } from "@/lib/contentI18n";

interface ContentHeroProps {
  badge: string;
  h1: string;
  intro: string;
  copy: ContentUICopy;
}

const ContentHero = ({ badge, h1, intro, copy }: ContentHeroProps) => {
  return (
    <section className="bg-gradient-to-b from-green-50 via-white to-white px-5 pb-6 pt-8 sm:px-6 sm:pb-10 sm:pt-14">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[20px] border border-green-100 bg-white p-6 shadow-md sm:rounded-[28px] sm:p-10 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-10">
        {/* Decorative WhatsApp icon */}
        <div className="pointer-events-none absolute -right-8 -top-8 hidden h-40 w-40 text-green-100 opacity-30 sm:block lg:right-4 lg:top-4 lg:h-56 lg:w-56">
          <MessageCircle className="h-full w-full" strokeWidth={0.7} />
        </div>

        <div className="relative z-10 max-w-2xl">
          <p className="mb-4 inline-flex rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-xs font-medium text-green-700 sm:text-sm">
            {badge}
          </p>

          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            {h1}
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
            {intro}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-3">
            <a
              href="https://wa.me/34657100100?text=Hello"
              className="inline-flex items-center justify-center rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              {copy.heroPrimaryCta}
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-green-300 hover:text-green-700"
            >
              {copy.heroSecondaryCta}
            </a>
          </div>
        </div>

        {/* Right-side cards (desktop only) */}
        <div className="mt-6 grid gap-4 lg:mt-0">
          <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-6">
            <p className="text-xs font-medium text-green-700 sm:text-sm">{copy.heroCardLabel}</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:mt-3 sm:text-2xl">
              {copy.heroCardTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:mt-3 sm:leading-7">
              {copy.heroCardDescription}
            </p>
          </div>
          <div className="rounded-[20px] border border-slate-200 bg-slate-900 p-5 text-white shadow-sm sm:rounded-[28px] sm:p-6">
            <p className="text-xs font-medium text-green-300 sm:text-sm">{copy.heroCardDarkLabel}</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight sm:mt-3 sm:text-2xl">
              {copy.heroCardDarkTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300 sm:mt-3 sm:leading-7">
              {copy.heroCardDarkDescription}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContentHero;
