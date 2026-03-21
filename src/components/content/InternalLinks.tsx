export interface InternalLinkItem {
  href: string;
  label: string;
}

interface InternalLinksProps {
  links: InternalLinkItem[];
}

const InternalLinks = ({ links }: InternalLinksProps) => {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6" aria-labelledby="internal-links-title">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
        <h2 id="internal-links-title" className="text-2xl font-semibold tracking-tight text-slate-900">
          También te puede interesar
        </h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:border-green-600 hover:text-green-800"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InternalLinks;
