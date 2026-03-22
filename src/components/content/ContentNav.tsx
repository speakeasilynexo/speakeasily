import type { ContentUICopy } from "@/lib/contentI18n";
import type { ContentPage } from "@/data/contentPages";

interface ContentNavProps {
  currentSlug: string;
  copy: ContentUICopy;
  pages: ContentPage[];
}

const ContentNav = ({ currentSlug, copy, pages }: ContentNavProps) => {
  return (
    <nav aria-label="Content pages" className="mx-auto max-w-6xl px-4 py-2 sm:px-6 sm:py-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {pages.map((page) => {
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
              {copy.navLabels[page.slug] ?? page.h1}
            </a>
          );
        })}
      </div>
    </nav>
  );
};

export default ContentNav;
