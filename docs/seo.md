# SEO

## Sitemap

Current production sitemap:

- `https://speakeasily.nexo-digital.app/sitemap.xml`

Current indexable routes included in the sitemap:

- `/`

Notes:

- `/#como-funciona`, `/#beneficios`, `/#planes` and other landing anchors are not separate routes, so they are not listed as sitemap URLs.
- `/subscribe`, `/success` and `/u/:waId` are not included because they are transactional or private flows and should not be indexed.
- If routes like `/blog`, `/legal/*` or localized path-based URLs are added later, they must be added to the existing sitemap sources:
  - `public/sitemap.xml`
  - `supabase/functions/sitemap/index.ts`

## Como Enviar Sitemap Ao Google

1. Abra o Google Search Console e selecione a propriedade do domínio.
2. Vá em `Sitemaps`, informe o caminho `/sitemap.xml` e clique em `Enviar`.
3. Verifique se o status aparece como `Éxito` e corrija qualquer erro reportado.
4. Após o deploy, use `Inspección de URL` na home e em `/blog` quando existir para solicitar indexação.
5. Revise `Cobertura` / `Indexação` e corrija URLs bloqueadas ou excluídas indevidamente.
