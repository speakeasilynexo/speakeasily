

## Plano: Expandir Conteúdo SEO Indexável + Corrigir Sitemap

### Diagnóstico

Comparando os screenshots:
- **BeConfident**: 2 páginas indexadas com títulos claros e focados ("Habla inglés con inteligencia artificial", "Sé seguro | Habla a tu manera con IA")
- **SpeakEasily**: 4 páginas indexadas, mas a página "Suscríbete" aparece no Google apesar de estar no `robots.txt` (Google pode ignorar Disallow se houver links internos)

Problemas identificados no código:

1. **Sitemap incompleto** — As 6 páginas de conteúdo NÃO têm `alternateLanguages` no sitemap, só a `/` tem. Google não sabe que existem versões EN/PT.
2. **Página /subscribe indexada** — Falta `noindex` meta tag na página Subscribe (robots.txt não é garantia).
3. **Faltam páginas para keywords de alto volume** — A memória do projeto menciona 9 rotas adicionais (como-funciona, metodologia, pronunciacion, etc.) que ainda não existem no `contentPages.ts`.
4. **Meta titles pouco diferenciados** — Todos seguem o padrão "X con WhatsApp e IA | SpeakEasily", pouca variedade para o Google.

### O que fazer (por ordem de impacto vs créditos)

#### 1. Corrigir o sitemap (ambos: edge function + static)
Adicionar `alternateLanguages: ["es", "en", "pt"]` a TODAS as rotas de conteúdo no sitemap, não só à `/`.

#### 2. Adicionar noindex ao /subscribe e /success
Usar o hook `useSEO` com `noindex: true` nestas páginas transacionais.

#### 3. Criar 6 novas páginas de conteúdo SEO
Novas páginas focadas em keywords complementares de alto volume:

| Slug | Keyword alvo (ES) | Volume estimado |
|------|-------------------|-----------------|
| `/como-funciona` | "aprender inglés con inteligencia artificial" | Alto |
| `/metodologia` | "método para aprender inglés online" | Médio |
| `/pronunciacion` | "mejorar pronunciación en inglés" | Alto |
| `/correccion-en-tiempo-real` | "corrección de inglés en tiempo real" | Médio |
| `/preguntas-frecuentes` | FAQ hub (long-tail capture) | Médio |
| `/ingles-para-principiantes` | "inglés para principiantes gratis" | Alto |

Cada página terá conteúdo único em ES/EN/PT (seguindo o padrão existente em `contentPages.ts`).

#### 4. Atualizar ContentNav com as novas páginas
A barra de navegação horizontal incluirá as novas páginas.

### Ficheiros alterados
- `src/data/contentPages.ts` — 6 novas páginas (ES/EN/PT)
- `src/lib/contentI18n.ts` — labels de nav para as novas páginas
- `supabase/functions/sitemap/index.ts` — hreflang em todas as rotas + novas rotas
- `public/sitemap.xml` — mesmo update (fallback estático)
- `src/pages/Subscribe.tsx` — adicionar `useSEO({ noindex: true })`
- `src/pages/Success.tsx` — adicionar `useSEO({ noindex: true })`

### Estimativa de créditos
Isto é um trabalho grande (~6-8 créditos para o conteúdo + sitemap). Com 13 créditos, é viável mas ajustado. Posso priorizar:
- **Opção A**: Fazer tudo (6 páginas novas + fixes) — usa ~8-10 créditos
- **Opção B**: Só os fixes (sitemap + noindex) + 3 páginas novas — usa ~5-6 créditos

