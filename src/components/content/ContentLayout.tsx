import type { ReactNode } from "react";
import ContentNav from "@/components/content/ContentNav";

interface ContentLayoutProps {
  children: ReactNode;
  breadcrumb: string;
  currentSlug: string;
}

const SHORT_LABELS: Record<string, string> = {
  "aprender-ingles-por-whatsapp": "WhatsApp",
  "clases-de-ingles-online": "Clases online",
  "aprender-ingles-rapido": "Inglés rápido",
  "curso-de-ingles-gratis": "Curso gratis",
  "ingles-para-el-trabajo": "Trabajo",
  "ingles-para-viajar": "Viajar",
};

const ContentLayout = ({ children, breadcrumb, currentSlug }: ContentLayoutProps) => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <a href="/" className="text-xl font-semibold tracking-tight text-slate-900">
                SpeakEasily
              </a>
              <nav aria-label="Breadcrumb" className="mt-1 hidden min-w-0 items-center text-sm text-slate-500 sm:flex">
                <a href="/" className="flex-shrink-0 transition-colors hover:text-green-700">
                  Inicio
                </a>
                <span className="flex-shrink-0 px-2 text-slate-300">{">"}</span>
                <span className="truncate text-slate-700">{breadcrumb}</span>
              </nav>
            </div>

            <a
              href="https://wa.me/34657100100?text=Hello"
              className="flex-shrink-0 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              Probar
            </a>
          </div>

          <div className="mt-3 flex items-center gap-2 sm:hidden">
            <a
              href="/"
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-green-200 hover:bg-green-50 hover:text-green-700"
            >
              Inicio
            </a>
            <div className="min-w-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
              <span className="block truncate">{SHORT_LABELS[currentSlug] ?? breadcrumb}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/80">
          <ContentNav currentSlug={currentSlug} />
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-slate-900">SpeakEasily</p>
            <p className="text-sm text-slate-600">Aprende inglés por WhatsApp con ayuda de inteligencia artificial.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <a href="/" className="transition-colors hover:text-green-700">
              Inicio
            </a>
            <a href="/aprender-ingles-por-whatsapp" className="transition-colors hover:text-green-700">
              WhatsApp
            </a>
            <a href="/clases-de-ingles-online" className="transition-colors hover:text-green-700">
              Clases online
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContentLayout;
