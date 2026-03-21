import type { ReactNode } from "react";

interface ContentLayoutProps {
  children: ReactNode;
  breadcrumb: string;
}

const ContentLayout = ({ children, breadcrumb }: ContentLayoutProps) => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/" className="text-xl font-semibold tracking-tight text-slate-900">
            SpeakEasily
          </a>
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
            <a href="/" className="transition-colors hover:text-green-700">
              Inicio
            </a>
            <span className="px-2 text-slate-300">{">"}</span>
            <span className="text-slate-700">{breadcrumb}</span>
          </nav>
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
