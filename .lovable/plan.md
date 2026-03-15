

## Fix: Servir `sitemap.xml` via Edge Function

O problema é que o hosting SPA redireciona todas as rotas para `index.html`, incluindo `/sitemap.xml`. A solução é criar uma edge function que sirva o sitemap com o content-type correto, e fazer o mesmo para `robots.txt`.

### Alterações

**1. Criar `supabase/functions/sitemap/index.ts`**
- Retorna o conteúdo XML do sitemap com `Content-Type: application/xml`
- CORS headers incluídos
- `verify_jwt = false` no config.toml

**2. Criar `supabase/functions/robots/index.ts`**
- Retorna o `robots.txt` com `Content-Type: text/plain`
- Aponta o Sitemap para a URL da edge function do sitemap
- `verify_jwt = false` no config.toml

**3. Atualizar `index.html`**
- Apontar a referência do sitemap para a URL da edge function

**4. Atualizar `src/hooks/useSEO.ts`**
- Se houver referência ao sitemap, apontar para a edge function

### Resultado
O Google vai conseguir aceder `https://njaylytxqksoibyiijms.supabase.co/functions/v1/sitemap` e indexar correctamente. No Google Search Console, submete-se esta URL como sitemap.

