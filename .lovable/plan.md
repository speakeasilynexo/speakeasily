
# Correção de 3 Vulnerabilidades de Segurança

## Problemas Identificados

| Severidade | Problema | Descrição |
|------------|----------|-----------|
| CRITICAL | `wa-test` sem autenticação | Endpoint de teste permite que qualquer pessoa envie mensagens WhatsApp pela sua conta |
| ERROR | `wa_users` exposta | Tabela com nomes e telefones acessível publicamente na internet |
| ERROR | `wa_state` exposta | Tabela com progresso e dados de atividade do usuario exposta publicamente |

## Solucao Proposta

### 1. Proteger o endpoint `wa-test` com autenticacao

**Arquivo:** `supabase/functions/wa-test/index.ts`

Adicionar verificacao de token secreto no header Authorization:

```typescript
const authHeader = req.headers.get('Authorization');
const expectedToken = Deno.env.get('TEST_ENDPOINT_TOKEN');

if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }), 
    { status: 401, headers: corsHeaders }
  );
}
```

Sera necessario adicionar um novo secret `TEST_ENDPOINT_TOKEN` para autenticar as chamadas de teste.

### 2. Corrigir politicas RLS das tabelas

As tabelas `wa_users`, `wa_state` e `wa_events` atualmente tem politicas que permitem acesso total via service role, mas nao bloqueiam acesso anonimo adequadamente.

**Migracao SQL necessaria:**

```sql
-- Remover politicas existentes que usam USING (true)
DROP POLICY IF EXISTS "Service role can manage wa_users" ON public.wa_users;
DROP POLICY IF EXISTS "Service role can manage wa_state" ON public.wa_state;
DROP POLICY IF EXISTS "Service role can manage wa_events" ON public.wa_events;

-- Criar politicas que bloqueiam acesso anonimo (anon key)
-- Somente service_role pode acessar estas tabelas

CREATE POLICY "Only service role can select wa_users"
  ON public.wa_users FOR SELECT
  TO authenticated, anon
  USING (false);

CREATE POLICY "Only service role can insert wa_users"
  ON public.wa_users FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "Only service role can update wa_users"
  ON public.wa_users FOR UPDATE
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Only service role can delete wa_users"
  ON public.wa_users FOR DELETE
  TO authenticated, anon
  USING (false);

-- Repetir para wa_state e wa_events...
```

**Nota:** O service_role automaticamente ignora RLS, entao as edge functions continuarao funcionando normalmente.

### 3. Limpar codigo de debug do webhook

**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts`

- Remover logs que expoem dados sensiveis (telefones, mensagens)
- Mascarar wa_id nos logs (ex: `3467****3062`)
- Remover mensagem de teste `"Teste direto do webhook..."`

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/wa-test/index.ts` | Adicionar autenticacao por token |
| `supabase/functions/whatsapp-webhook/index.ts` | Sanitizar logs sensiveis |
| Migracao SQL | Corrigir politicas RLS |

## Sequencia de Implementacao

1. Solicitar criacao do secret `TEST_ENDPOINT_TOKEN`
2. Atualizar `wa-test` com autenticacao
3. Sanitizar logs no `whatsapp-webhook`
4. Aplicar migracao SQL para corrigir RLS

## Resultado Esperado

Apos as correcoes:
- Endpoint `wa-test` so aceita chamadas com token valido
- Tabelas nao podem ser lidas com a anon key (protegidas)
- Edge functions continuam funcionando (usam service_role)
- Logs nao expoem mais dados sensiveis
