

## Diagnóstico e Plano SEO

### Problema identificado
- `/success` é página pós-pagamento sem valor SEO — deve ser removida do sitemap e marcada com `noindex`
- `/subscribe` é transacional (depende de `wa_id`) — pode dar 404 se o proxy não servir `index.html` para rotas SPA. Remover do sitemap também, pois não tem conteúdo orgânico relevante
- Apenas `/` (landing page) tem conteúdo indexável real
- O conteúdo atual está 100% em espanhol hardcoded, sem palavras-chave otimizadas
- Falta uma secção FAQ (excelente para SEO e featured snippets do Google)

### Palavras-chave alvo
- ES: "aprender inglés por WhatsApp", "clases de inglés online", "aprender inglés gratis", "curso de inglés WhatsApp"
- PT: "aprender inglês pelo WhatsApp", "aulas de inglês online", "curso de inglês WhatsApp"
- EN: "learn English on WhatsApp", "English lessons WhatsApp", "learn English online free"

### Alterações

**1. Atualizar `public/sitemap.xml`**
- Manter apenas `/` (a landing page)
- Remover `/subscribe` e `/success`

**2. Atualizar `public/robots.txt`**
- Adicionar `Disallow: /u/` para bloquear páginas de alunos
- Adicionar `Disallow: /success` para bloquear página pós-pagamento

**3. Adicionar meta noindex nas páginas privadas**
- Em `Success.tsx`: adicionar `<meta name="robots" content="noindex, nofollow">` via `useSEO` ou efeito
- Em `StudentProgress.tsx`: idem

**4. Criar componente `FAQ.tsx`** (nova secção na landing)
- 6-8 perguntas/respostas ricas em palavras-chave
- Exemplos: "¿Cómo funciona aprender inglés por WhatsApp?", "¿Necesito descargar alguna app?", "¿Cuánto tiempo necesito al día para aprender inglés?"
- Schema markup `FAQPage` em JSON-LD para featured snippets

**5. Melhorar SEO on-page da landing**
- Adicionar keywords mais fortes no `h1` e `h2` dos componentes existentes
- Enriquecer `meta description` no `index.html` com palavras-chave
- Adicionar `alt` text semântico onde faltar

**6. Atualizar JSON-LD em `index.html`**
- Adicionar schema `FAQPage` com as perguntas

### Não será alterado
- Nenhum refactoring de componentes existentes
- Sem `any` types
- Sem novas dependências
- Alterações mínimas e pontuais nos textos existentes

