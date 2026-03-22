import { contentPages } from "@/data/contentPages";

interface ContentNavProps {
  currentSlug: string;
}

const ContentNav = ({ currentSlug }: ContentNavProps) => {
  return (
    <nav
      aria-label="Páginas de contenido"
      className="mx-auto max-w-6xl px-5 py-4 sm:px-6"
    >
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {contentPages.map((page) => {
          const isActive = page.slug === currentSlug;
          return (
            <a
              key={page.slug}
              href={`/${page.slug}`}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors sm:text-sm ${
                isActive
                  ? "bg-green-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-700"
              }`}
            >
              {page.h1.length > 35 ? page.h1.slice(0, 32) + "…" : page.h1}
            </a>
          );
        })}
      </div>
    </nav>
  );
};

export default ContentNav;
