// Post-build SEO prerender: generates per-route HTML files in dist/
// with correct <title>, <meta description>, canonical, hreflang and og:* tags.
// Fixes Google Search Console "Error de redirección" caused by the SPA's
// shared index.html declaring canonical = "/" for every route.

// Pure Node ESM, no external dependencies.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");
const BASE_URL = "https://speakeasily.nexo-digital.app";

const ROUTES = [
  {
    path: "/",
    title: "SpeakEasily - Aprende inglés por WhatsApp | Clases de inglés online gratis",
    description:
      "Aprende inglés por WhatsApp con lecciones personalizadas de IA. Curso de inglés online gratis: 5 min/día, sin descargar apps. Prueba 7 días gratis.",
  },
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

function normalizePath(path) {
  return path === "/" ? "/" : path.replace(/\/$/, "");
}

function buildPageUrl(path) {
  const normalized = normalizePath(path);
  return `${BASE_URL}${normalized}`;
}

function buildHreflangBlock(path) {
  const baseUrl = buildPageUrl(path);
  return [
    `    <link rel="alternate" hreflang="es-ES" href="${baseUrl}" />`,
    `    <link rel="alternate" hreflang="pt-BR" href="${baseUrl}?lang=pt" />`,
    `    <link rel="alternate" hreflang="en-US" href="${baseUrl}?lang=en" />`,
    `    <link rel="alternate" hreflang="x-default" href="${baseUrl}" />`,
  ].join("\n");
}

function replaceMeta(html, regex, replacement, fallbackPattern) {
  if (regex.test(html)) {
    return html.replace(regex, replacement);
  }
  return html.replace(fallbackPattern, `$1${replacement}$2`);
}

function rewriteHtml(template, route) {
  const canonicalUrl = buildPageUrl(route.path);
  let html = template;

  html = replaceMeta(
    html,
    /<title>[\s\S]*?<\/title>/,
    `<title>${route.title}</title>`,
    /(<head[^>]*>)/,
  );

  html = replaceMeta(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${route.description}" />`,
    /(<meta\s+name="viewport"[^>]*>)/,
  );

  html = replaceMeta(
    html,
    /<link\s+rel="canonical"[^>]*\/>/,
    `<link rel="canonical" href="${canonicalUrl}" />`,
    /(<meta\s+name="author"\s+content="[^"]*"\s*\/>)(\r?\n)?/,
  );

  html = html.replace(/\s*<link\s+rel="alternate"[^>]*\/>\s*\n?/g, "");

  const hreflangBlock = buildHreflangBlock(route.path);
  if (/<link\s+rel="canonical"[^>]*\/>/.test(html)) {
    html = html.replace(
      /(<link\s+rel="canonical"[^>]*\/>)(\r?\n)?/,
      `$1$2
    <!-- Hreflang -->
${hreflangBlock}$2`,
    );
  } else {
    html = html.replace(/<\/head>/, `    <!-- Hreflang -->\n${hreflangBlock}\n</head>`);
  }

  html = replaceMeta(
    html,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${canonicalUrl}" />`,
    /(<meta\s+property="og:type"[^>]*\/>)/,
  );

  html = replaceMeta(
    html,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${route.title}" />`,
    /(<meta\s+property="og:type"[^>]*\/>)/,
  );

  html = replaceMeta(
    html,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${route.description}" />`,
    /(<meta\s+property="og:type"[^>]*\/>)/,
  );

  html = replaceMeta(
    html,
    /<meta\s+property="og:locale"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:locale" content="es_ES" />`,
    /(<meta\s+property="og:site_name"[^>]*\/>)/,
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
    const outPath = resolve(DIST, route.path === "/" ? "index.html" : `${route.path.replace(/^\//, "")}.html`);
    writeFileSync(outPath, html, "utf8");
    written += 1;
  }

  console.log(`[prerender-seo] wrote ${written} route HTML files in dist/`);
}

main();
