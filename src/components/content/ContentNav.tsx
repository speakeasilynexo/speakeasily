import { contentPages } from "@/data/contentPages";

interface ContentNavProps {
  currentSlug: string;
}

const ContentNav = ({ currentSlug }: ContentNavProps) => {
  return (
    <nav aria-label="Páginas de contenido" className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Explorar más</p>
          <p className="text-sm text-slate-600">Otras guías y temas relacionados</p>
        </div>
        <a
          href="/"
          className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-green-300 hover:text-green-700 sm:inline-flex"
        >
          Ir al inicio
        </a>
      </div>

      <div
        className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none lg:flex-wrap lg:overflow-visible"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {contentPages.map((page) => {
          const isActive = page.slug === currentSlug;

          return (
            <a
              key={page.slug}
              href={`/${page.slug}`}
              className={`group flex min-w-[220px] flex-shrink-0 flex-col rounded-2xl border px-4 py-3 text-left transition-all sm:min-w-[250px] lg:min-w-0 lg:flex-1 ${
                isActive
                  ? "border-green-600 bg-green-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-green-200 hover:bg-green-50"
              }`}
            >
              <span
                className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                  isActive ? "text-green-100" : "text-slate-400 group-hover:text-green-600"
                }`}
              >
                {isActive ? "Página actual" : "Guía"}
              </span>
              <span className="mt-1 text-sm font-semibold leading-5 sm:text-[15px]">
                {page.h1.length > 62 ? `${page.h1.slice(0, 59)}...` : page.h1}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
};

export default ContentNav;
