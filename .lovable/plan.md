

## SEO Internacional — PT, ES, EN

Implementar `hreflang` tags e metadata dinâmica para que o Google indexe corretamente as 3 versões de idioma.

### Alterações

**1. `src/hooks/useSEO.ts`** — Expandir para aceitar `lang`, atualizar `<html lang>`, `og:locale`, e gerir tags `hreflang` dinamicamente.

**2. `index.html`** — Adicionar tags `hreflang` base (es, pt, en, x-default) e `og:locale:alternate`.

**3. `public/sitemap.xml`** — Adicionar namespace `xhtml` e `<xhtml:link rel="alternate">` em cada URL para os 3 idiomas.

**4. `src/pages/Index.tsx`** — Suportar `?lang=` via `useSearchParams` e passar `lang` ao `useSEO`.

**5. `src/pages/Subscribe.tsx`** e `src/pages/Success.tsx` — Passar `lang` ao `useSEO`.

### Detalhes técnicos

O `useSEO` hook vai:
- Receber `lang?: "pt" | "es" | "en"` (default `"es"`)
- Atualizar `document.documentElement.lang` (ex: `"pt"`, `"es"`, `"en"`)
- Atualizar `og:locale` (ex: `es_ES`, `pt_BR`, `en_US`)
- Criar/atualizar 4 tags `<link rel="alternate" hreflang="...">` (es, pt, en, x-default)
- O canonical aponta para a URL com `?lang=` para pt/en, sem query para es (default)

Sitemap terá formato:
```xml
<url>
  <loc>https://speakeasily.nexo-digital.app/</loc>
  <xhtml:link rel="alternate" hreflang="es" href=".../" />
  <xhtml:link rel="alternate" hreflang="pt" href=".../?lang=pt" />
  <xhtml:link rel="alternate" hreflang="en" href=".../?lang=en" />
</url>
```

