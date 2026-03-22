import { contentPages } from "@/data/contentPages";

interface ContentNavProps {
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

const ContentNav = ({ currentSlug }: ContentNavProps) => {
  return (
    <nav aria-label="Paginas de contenido" className="mx-auto max-w-6xl px-4 py-2 sm:px-6 sm:py-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {contentPages.map((page) => {
          const isActive = page.slug === currentSlug;

          return (
            <a
              key={page.slug}
              href={`/${page.slug}`}
              className={`flex-shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
              }`}
            >
              {SHORT_LABELS[page.slug] ?? page.h1}
            </a>
          );
        })}
      </div>
    </nav>
  );
};

export default ContentNav;
