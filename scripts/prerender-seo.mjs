// Post-build SEO prerender: generates per-route index.html files in dist/
// with correct <title>, <meta description>, canonical, hreflang and og:* tags.
// Fixes Google Search Console "Error de redirección" caused by the SPA's
// shared index.html declaring canonical = "/" for every route.
//
// Pure Node ESM, no external dependencies.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");
const BASE_URL = "https://speakeasily.nexo-digital.app";

// Mirror of Spanish (default) metadata from src/data/contentPages.ts and
// src/data/newContentPages.ts. Keep in sync if those metaTitle/metaDescription
// values change. Default HTML serves Spanish; ?lang=en|pt switches client-side.
const ROUTES = [
  {
    path: "/aprender-ingles-por-whatsapp",
    title: "Aprender inglés por WhatsApp con IA | SpeakEasily",
    description:
      "Aprende inglés por WhatsApp con lecciones cortas, práctica real e inteligencia artificial. Empieza gratis y mejora tu inglés cada día.",
  },
  {
    path: "/clases-de-ingles-online",
    title: "Clases de inglés online con IA y WhatsApp",
    description:
      "Clases de inglés online por WhatsApp con IA. Practica conversación, recibe correcciones y avanza con un plan personalizado.",
  },
  {
    path: "/aprender-ingles-rapido",
    title: "Aprender inglés rápido con práctica diaria por WhatsApp",
    description:
      "Aprende inglés rápido con sesiones cortas diarias por WhatsApp. Constancia + IA para avanzar sin perder tiempo.",
  },
  {
    path: "/curso-de-ingles-gratis",
    title: "Curso de inglés gratis por WhatsApp | SpeakEasily",
    description:
      "Empieza un curso de inglés gratis por WhatsApp. 7 días de prueba con IA, sin tarjeta y sin instalar nada.",
  },
  {
    path: "/ingles-para-el-trabajo",
    title: "Inglés para el trabajo: practica por WhatsApp con IA",
    description:
      "Mejora tu inglés profesional con conversaciones reales por WhatsApp. Vocabulario laboral, emails y reuniones.",
  },
  {
    path: "/ingles-para-viajar",
    title: "Inglés para viajar: frases y práctica por WhatsApp",
    description:
      "Aprende inglés para viajar con situaciones reales por WhatsApp. Aeropuerto, hotel, restaurante y más, con IA.",
  },
  {
    path: "/como-funciona",
    title: "Cómo funciona SpeakEasily: aprender inglés por WhatsApp",
    description:
      "Descubre cómo funciona SpeakEasily: lecciones por WhatsApp, IA que corrige y un plan adaptado a tu nivel.",
  },
  {
    path: "/metodologia",
    title: "Metodología SpeakEasily: aprender inglés con IA",
    description:
      "Nuestra metodología combina conversación real, repaso inteligente y feedback de IA para que aprendas inglés con constancia.",
  },
  {
    path: "/pronunciacion",
    title: "Mejora tu pronunciación en inglés por WhatsApp",
    description:
      "Practica pronunciación en inglés con audios y shadowing por WhatsApp. La IA te ayuda a sonar más natural.",
  },
  {
    path: "/correccion-en-tiempo-real",
    title: "Corrección de inglés en tiempo real con IA | SpeakEasily",
    description:
      "Recibe correcciones de inglés en tiempo real por WhatsApp. La IA te explica el error y refuerza lo que necesitas.",
  },
  {
    path: "/preguntas-frecuentes",
    title: "Preguntas frecuentes sobre SpeakEasily",
    description:
      "Respuestas a las dudas más comunes sobre aprender inglés por WhatsApp con SpeakEasily: precios, niveles, IA y más.",
  },
  {
    path: "/ingles-para-principiantes",
    title: "Inglés para principiantes por WhatsApp con IA",
    description:
      "Empieza inglés desde cero por WhatsApp. Lecciones simples, IA paciente y un plan guiado para principiantes.",
  },
];

function buildHreflangBlock(path) {
  const url = (lang) => {
    const base = `${BASE_URL}${path}`;
    if (!lang || lang === "es") return base;
    return `${base}${base.includes("?") ? "&" : "?"}lang=${lang}`;
  };
  return [
    `    <link rel="alternate" hreflang="es-ES" href="${url("es")}" />`,
    `    <link rel="alternate" hreflang="pt-BR" href="${url("pt")}" />`,
    `    <link rel="alternate" hreflang="en-US" href="${url("en")}" />`,
    `    <link rel="alternate" hreflang="x-default" href="${url("es")}" />`,
  ].join("\n");
}

function rewriteHtml(template, route) {
  const canonicalUrl = `${BASE_URL}${route.path}`;
  let html = template;

  // <title>
  html = html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${route.title}</title>`,
  );

  // <meta name="description">
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${route.description}" />`,
  );

  // <link rel="canonical">
  html = html.replace(
    /<link\s+rel="canonical"[^>]*\/?>/,
    `<link rel="canonical" href="${canonicalUrl}" />`,
  );

  // hreflang block: replace the 4 hreflang lines (es-ES, pt-BR, en-US, x-default)
  html = html.replace(
    /(\s*<link\s+rel="alternate"\s+hreflang="(?:es-ES|pt-BR|en-US|x-default)"[^>]*\/?>\s*){2,5}/,
    "\n" + buildHreflangBlock(route.path) + "\n",
  );

  // og:url, og:title, og:description
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${canonicalUrl}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${route.title}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${route.description}" />`,
  );

  return html;
}

function main() {
  const indexPath = resolve(DIST, "index.html");
  if (!existsSync(indexPath)) {
    console.warn(`[prerender-seo] dist/index.html not found at ${indexPath}; skipping.`);
    return;
  }
  const template = readFileSync(indexPath, "utf8");

  let written = 0;
  for (const route of ROUTES) {
    const html = rewriteHtml(template, route);
    const outDir = resolve(DIST, route.path.replace(/^\//, ""));
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, "index.html"), html, "utf8");
    written += 1;
  }

  console.log(`[prerender-seo] wrote ${written} per-route index.html files in dist/`);
}

main();