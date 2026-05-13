
## Diagnóstico

O Google Search Console reporta **"Error de redirección"** nas páginas de conteúdo (`/aprender-ingles-por-whatsapp`, `/clases-de-ingles-online`, etc.). Após inspecionar o HTML servido em produção, encontrei a causa real:

**O `index.html` é servido para TODAS as rotas (comportamento normal de SPA), e ele tem hardcoded:**

```html
<link rel="canonical" href="https://speakeasily.nexo-digital.app/" />
<link rel="alternate" hreflang="es-ES" href="https://speakeasily.nexo-digital.app/" />
<link rel="alternate" hreflang="pt-BR" href="https://speakeasily.nexo-digital.app/?lang=pt" />
<link rel="alternate" hreflang="en-US" href="https://speakeasily.nexo-digital.app/?lang=en" />
```

Quando o Googlebot busca `/aprender-ingles-por-whatsapp`, recebe HTML cuja **canonical aponta para `/`**. O Google interpreta isso como **"esta URL deve ser canonicalizada para outra"** → marca como erro de redirecionamento/canonical e não indexa.

O `useSEO` corrige a canonical depois via JS, mas:
1. O Googlebot usa primeiro o HTML estático (canonical signal).
2. Mesmo após renderizar o JS, o sinal conflitante já gera o aviso.

Isto afeta TODAS as 12 páginas de conteúdo no sitemap.

## Problema secundário: `www`

`https://www.speakeasily.nexo-digital.app/` não responde (timeout). Isto **não** causa o erro do Search Console (a propriedade é o domínio raiz), mas impede usuários que digitam "www" de chegar ao site. **Solução é DNS, não código** — adicionar registro `A www → 185.158.133.1` no registrador.

## Solução proposta (código)

Gerar **um `index.html` por rota** no build, com `<title>`, `<meta description>`, `canonical`, `hreflang` e `og:*` corretos por rota e idioma. Lovable hosting serve `dist/<rota>/index.html` quando existe, e cai no fallback SPA caso contrário — então Googlebot recebe o HTML correto na primeira requisição, e o React continua hidratando normalmente.

### Arquivos

1. **`scripts/generate-static-html.ts`** (novo)
   - Lê `index.html` como template.
   - Importa metadados das 12 páginas de `src/data/contentPages.ts` (lang `es` para HTML inicial, já que é o default; outras línguas resolvem via `?lang=`).
   - Para cada rota (`/aprender-ingles-por-whatsapp`, etc.), substitui no template:
     - `<title>` → `page.metaTitle`
     - `<meta name="description">` → `page.metaDescription`
     - `<link rel="canonical">` → URL da rota
     - 3 `<link rel="alternate" hreflang>` + `x-default` → URLs da rota com `?lang=`
     - `og:url`, `og:title`, `og:description` → idem
   - Escreve `dist/<slug>/index.html`.
   - Também regenera `dist/index.html` para garantir que canonical da home permanece `/`.

2. **`package.json`**
   - Adicionar `"postbuild": "bunx tsx scripts/generate-static-html.ts"`.
   - Sem novas dependências (`tsx` já é usado por `predev`/`prebuild` em projetos similares — se não estiver, usar `node --import tsx/esm` ou converter para `.mjs` puro com `fs`/`path` nativo). **Confirmação: vou usar `.mjs` com APIs nativas Node para zero dependências, respeitando a regra do projeto.**

3. **`index.html`**
   - Manter como está (template). O script injeta valores corretos por rota no build. A home continua apontando canonical para `/`.

### Por que funciona

- Lovable hosting (Cloudflare) serve arquivos estáticos do `dist/` quando o caminho corresponde a um arquivo. `dist/aprender-ingles-por-whatsapp/index.html` será servido em vez do fallback SPA.
- O HTML servido tem canonical correta → Google deixa de reportar "Error de redirección".
- React Router continua funcionando: o JS roda, identifica a rota, renderiza o componente.
- `useSEO` continua atualizando meta tags em mudanças de idioma client-side (sem conflito, pois apenas reforça o que já está no HTML).

### Validação após deploy

1. `curl -s https://speakeasily.nexo-digital.app/aprender-ingles-por-whatsapp | grep canonical` → deve mostrar a própria URL.
2. Search Console → "Inspecionar URL" → "Probar URL publicada" em 2-3 páginas afetadas. Solicitar reindexação.
3. Aguardar 7-14 dias para Google reprocessar; o erro deve desaparecer.

### Fora de escopo (mas recomendo separadamente)

- **DNS www**: adicionar registro `A` para `www` apontando para `185.158.133.1` no painel do registrador do domínio. Sem isto, `www.speakeasily.nexo-digital.app` continua não respondendo.
- Se quiseres, posso também opcionalmente injetar JSON-LD `BreadcrumbList` por rota no mesmo script (melhora rich results).

## Pergunta antes de implementar

Confirmas que queres que eu:
- (a) Aplique apenas a correção de canonical/hreflang via script de build (resolve o erro do Search Console); ou
- (b) (a) + também injete JSON-LD `BreadcrumbList` por rota?

E queres que eu inclua também as URLs com `?lang=en` e `?lang=pt` como rotas pré-renderizadas separadas, ou basta a versão `es` (default) do HTML inicial?
