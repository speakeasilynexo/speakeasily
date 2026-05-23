## Situação

O `curl` em produção confirma que `/aprender-ingles-por-whatsapp` ainda devolve o `index.html` antigo, com `canonical` e `og:url` apontando para `/`. O código no `main` (commit `557c267`) e o `scripts/prerender-seo.mjs` já estão corretos no repositório — o problema é exclusivamente de **deploy**: a build com o prerender plugin nunca chegou ao hosting do `speakeasily.nexo-digital.app`.

## O que precisa ser feito

1. **Você clica em Publish → Update** no editor do Lovable (canto superior direito). Isso é o único gatilho que executa `vite build` no ambiente do Lovable, e é nesse build que o `prerenderSEOPlugin` em `vite.config.ts` roda o `scripts/prerender-seo.mjs` no `closeBundle`, gerando os 13 `index.html` por rota dentro de `dist/`.

2. **Após o publish concluir**, eu rodo de novo:
   ```bash
   curl -sL "https://speakeasily.nexo-digital.app/aprender-ingles-por-whatsapp" | grep -E "canonical|og:url"
   ```
   Esperado:
   - `<link rel="canonical" href="https://speakeasily.nexo-digital.app/aprender-ingles-por-whatsapp" />`
   - `<meta property="og:url" content="https://speakeasily.nexo-digital.app/aprender-ingles-por-whatsapp" />`

3. **Se ainda falhar** após o publish, eu investigo:
   - se o build do Lovable está usando o `vite.config.ts` correto (plugin aplicado em `mode !== "development"`);
   - se o hosting está servindo `dist/aprender-ingles-por-whatsapp/index.html` em vez do fallback SPA `dist/index.html`;
   - se existe cache de CDN segurando a versão antiga (nesse caso peço para você forçar um novo Publish).

## Observação importante

Sobre o ponto 3 do seu pedido original ("rota `/es` retorne `og:url` e `canonical` para a própria rota"): o projeto **não usa prefixo de idioma** (`/es`, `/pt`, `/en`). O idioma vem por querystring (`?lang=pt`, `?lang=en`) e o espanhol é o default sem parâmetro. Por isso o `prerender-seo.mjs` gera 13 rotas em espanhol como base, e o `useSEO.ts` ajusta `canonical`/`hreflang` no client conforme o `?lang=`. Se você realmente quer rotas físicas `/es/...`, `/pt/...`, `/en/...`, isso é uma mudança maior (refator de router + i18n + sitemap + prerender) — me confirma se quer que eu planeje isso separadamente.

## Próximo passo imediato

Clica em **Publish → Update** e me avisa quando concluir. Eu rodo o `curl` na hora e devolvo `CORRETO` ou `INCORRETO` com a saída.
