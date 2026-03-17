import { useEffect } from "react";

const BASE_URL = "https://speakeasily.nexo-digital.app";

type SupportedLang = "pt" | "es" | "en";

const LOCALE_MAP: Record<SupportedLang, string> = {
  es: "es_ES",
  pt: "pt_BR",
  en: "en_US",
};

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  lang?: SupportedLang;
  noindex?: boolean;
}

function getCanonicalUrl(path: string, lang?: SupportedLang): string {
  const base = `${BASE_URL}${path}`;
  if (!lang || lang === "es") return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}lang=${lang}`;
}

function getHreflangUrl(path: string, lang: SupportedLang): string {
  if (lang === "es") return `${BASE_URL}${path}`;
  const base = `${BASE_URL}${path}`;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}lang=${lang}`;
}

function upsertMeta(attr: string, value: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${value}"]`);
  if (el) {
    el.content = content;
  } else {
    el = document.createElement("meta");
    el.setAttribute(attr.split("=")[0].includes("property") ? "property" : "name", value);
    el.content = content;
    document.head.appendChild(el);
  }
}

function upsertLink(rel: string, hreflang: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(
    `link[rel="alternate"][hreflang="${hreflang}"]`
  );
  if (el) {
    el.href = href;
  } else {
    el = document.createElement("link");
    el.rel = rel;
    el.hreflang = hreflang;
    el.href = href;
    document.head.appendChild(el);
  }
}

export function useSEO({ title, description, path = "/", lang = "es", noindex = false }: SEOProps) {
  useEffect(() => {
    // Title
    document.title = title;

    // Noindex
    let robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (noindex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement("meta");
        robotsMeta.name = "robots";
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.content = "noindex, nofollow";
    } else if (robotsMeta) {
      robotsMeta.remove();
    }

    // HTML lang
    document.documentElement.lang = lang;

    // Canonical
    const canonicalUrl = getCanonicalUrl(path, lang);
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (link) {
      link.href = canonicalUrl;
    } else {
      link = document.createElement("link");
      link.rel = "canonical";
      link.href = canonicalUrl;
      document.head.appendChild(link);
    }

    // Meta description
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (meta) meta.content = description;

    // OG tags
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:locale", LOCALE_MAP[lang]);

    // Hreflang tags
    const langs: SupportedLang[] = ["es", "pt", "en"];
    for (const l of langs) {
      upsertLink("alternate", l, getHreflangUrl(path, l));
    }
    upsertLink("alternate", "x-default", getHreflangUrl(path, "es"));
  }, [title, description, path, lang]);
}
