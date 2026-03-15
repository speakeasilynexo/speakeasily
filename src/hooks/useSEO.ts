import { useEffect } from "react";

const BASE_URL = "https://speakeasily.nexo-digital.app";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
}

export function useSEO({ title, description, path = "/" }: SEOProps) {
  useEffect(() => {
    document.title = title;

    const canonicalUrl = `${BASE_URL}${path}`;

    // Canonical
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
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (meta) {
      meta.content = description;
    }

    // OG tags
    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.content = canonicalUrl;
    }

    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.content = title;
    }

    const ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.content = description;
    }
  }, [title, description, path]);
}
