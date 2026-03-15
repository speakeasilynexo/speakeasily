

## SEO Optimization — Apontar para `https://speakeasily.nexo-digital.app/`

### Ficheiros a criar/editar

**1. `index.html`** — Adicionar canonical, URLs absolutas no OG/Twitter, e JSON-LD structured data:
- `<link rel="canonical" href="https://speakeasily.nexo-digital.app/" />`
- `og:url` com domínio completo
- `og:image` e `twitter:image` com URL absoluta
- JSON-LD com schemas `Organization` + `WebApplication`

**2. `public/sitemap.xml`** — Criar com as 3 rotas públicas:
- `https://speakeasily.nexo-digital.app/` (priority 1.0)
- `https://speakeasily.nexo-digital.app/subscribe` (priority 0.8)
- `https://speakeasily.nexo-digital.app/success` (priority 0.3)

**3. `public/robots.txt`** — Simplificar e adicionar referência ao sitemap:
```
User-agent: *
Allow: /
Sitemap: https://speakeasily.nexo-digital.app/sitemap.xml
```

**4. `src/hooks/useSEO.ts`** — Hook leve que atualiza `<title>`, `<meta description>` e `<link canonical>` dinamicamente por página.

**5. Páginas** (`Index.tsx`, `Subscribe.tsx`, `Success.tsx`) — Chamar `useSEO` com título, descrição e path específicos de cada página para canonical dinâmico.

