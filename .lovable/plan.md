

## Plano: Corrigir Erros SEO do Semrush

### Resumo da Auditoria (62 findings)

O relatório tem 3 categorias: **Erros**, **Advertências** e **Avisos**. Muitos são problemas de infraestrutura/hosting que não podemos resolver no código. Vou separar o que podemos e o que não podemos corrigir.

### O que PODEMOS corrigir no código

| # | Problema | Solução |
|---|----------|---------|
| 1 | **Dados estruturados inválidos** | Corrigir JSON-LD no `index.html` — validar com Google Rich Results Test e ajustar campos obrigatórios |
| 2 | **Conflitos de hreflang** | Revisar hreflang tags no `index.html` e no hook `useSEO.ts` — garantir códigos ISO corretos (es → es-ES, pt → pt-BR, en → en-US) |
| 3 | **Sitemap com páginas incorretas** | Verificar que `/subscribe` e `/success` não estão no sitemap; verificar que todas as URLs retornam 200 |
| 4 | **Páginas sem encabezado H1** | Verificar que `/subscribe` e `/success` têm `<h1>` |
| 5 | **Baixa relação texto-HTML** | Adicionar mais conteúdo textual semântico nas páginas (usar tags `<article>`, `<section>`, `<main>`) |
| 6 | **Páginas sem metadescrição** | Garantir que Subscribe e Success usam `useSEO` com descrições |
| 7 | **Imagens sem atributo ALT** | Auditar todas as imagens e adicionar `alt` descritivos |
| 8 | **Múltiplos H1 em páginas** | Corrigir páginas que tenham mais de um `<h1>` |
| 9 | **Criar arquivo llms.txt** | Criar `public/llms.txt` para compatibilidade com motores de busca IA |
| 10 | **Sitemap não referenciado no robots.txt** | Já está — verificar se Semrush leu a versão antiga |
| 11 | **Hreflang com formato incorreto** | Mudar de `es` → `es-ES`, `pt` → `pt-BR`, `en` → `en-US` nos atributos hreflang |

### O que NÃO podemos corrigir (infraestrutura/hosting)

- Páginas que não puderam ser rastreadas (timeout do servidor)
- Códigos de estado 4XX/5XX (depende do hosting)
- Problemas de DNS
- Certificado SSL / HTTPS / HSTS
- Resolução de WWW
- Recursos externos bloqueados

### Ficheiros a alterar

1. **`index.html`** — Corrigir JSON-LD (adicionar campos obrigatórios), corrigir hreflang para formato `es-ES`
2. **`src/hooks/useSEO.ts`** — Corrigir hreflang para usar códigos regionais (`es-ES` em vez de `es`)
3. **`src/pages/Subscribe.tsx`** — Adicionar `useSEO` com noindex + H1 se não tiver
4. **`src/pages/Success.tsx`** — Adicionar `useSEO` com noindex + H1 se não tiver
5. **`public/llms.txt`** — Criar arquivo novo
6. **`src/components/landing/HeroSection.tsx`** + outros componentes — Auditar ALTs e H1 duplicados
7. **`src/pages/ContentPage.tsx`** — Verificar que structured data WebPage tem campos válidos

### Estimativa: ~3-4 créditos

Foca nos erros críticos (dados estruturados, hreflang, H1) que impactam diretamente a indexação.

