const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://speakeasily.nexo-digital.app";

type Language = "es" | "en" | "pt";

interface SitemapRoute {
  path: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
  alternateLanguages?: Language[];
}

const contentPaths = [
  "/aprender-ingles-por-whatsapp",
  "/clases-de-ingles-online",
  "/aprender-ingles-rapido",
  "/curso-de-ingles-gratis",
  "/ingles-para-el-trabajo",
  "/ingles-para-viajar",
  "/como-funciona",
  "/metodologia",
  "/pronunciacion",
  "/correccion-en-tiempo-real",
  "/preguntas-frecuentes",
  "/ingles-para-principiantes",
] as const;

const highPriority = ["/aprender-ingles-por-whatsapp", "/clases-de-ingles-online", "/como-funciona", "/ingles-para-principiantes"];

const routes: SitemapRoute[] = [
  {
    path: "/",
    changefreq: "weekly",
    priority: "1.0",
    alternateLanguages: ["es", "en", "pt"],
  },
  ...contentPaths.map((path) => ({
    path,
    changefreq: "weekly" as const,
    priority: highPriority.includes(path) ? "0.9" : "0.8",
    alternateLanguages: ["es", "en", "pt"] as Language[],
  })),
];

function buildUrl(path: string, language?: Language): string {
  const base = `${BASE_URL}${path}`;

  if (!language || language === "es") {
    return base;
  }

  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}lang=${language}`;
}

function buildAlternateLinks(path: string, languages: Language[]): string {
  return [
    ...languages.map((language) => `    <xhtml:link rel="alternate" hreflang="${language}" href="${buildUrl(path, language)}" />`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${buildUrl(path, "es")}" />`,
  ].join("\n");
}

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${routes
  .map((route) => {
    const alternates = route.alternateLanguages ? `${buildAlternateLinks(route.path, route.alternateLanguages)}\n` : "";

    return `  <url>
    <loc>${buildUrl(route.path)}</loc>
${alternates}    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  })
  .join("\n")}
</urlset>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(sitemapXml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
});
