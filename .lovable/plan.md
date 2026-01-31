

# Correção da Configuração do Webhook

## Problema Identificado

O arquivo `supabase/config.toml` está incompleto - contém apenas o `project_id` mas falta a configuração `verify_jwt = false` para as edge functions. Isso faz com que o Supabase rejeite todas as requisições do Meta (webhooks) porque elas não incluem um token JWT válido.

## Solução

Atualizar o `supabase/config.toml` para desabilitar a verificação JWT nas funções que precisam receber webhooks externos.

## Alterações Necessárias

### 1. Atualizar supabase/config.toml

Adicionar a configuração correta para as edge functions:

```toml
project_id = "njaylytxqksoibyiijms"

[functions.whatsapp-webhook]
verify_jwt = false

[functions.wa-test]
verify_jwt = false
```

## Por que isso é necessário?

- **Webhooks do Meta não enviam JWT**: Quando o WhatsApp envia uma mensagem para seu webhook, não inclui um token de autenticação do Supabase
- **verify_jwt = true (padrão)**: Bloqueia requisições sem JWT válido - é por isso que os webhooks não chegam
- **verify_jwt = false**: Permite que requisições externas (como do Meta) acessem a função

## Resultado Esperado

Após esta alteração:
1. Os webhooks do Meta serão aceitos pela função `whatsapp-webhook`
2. Você verá logs de processamento quando enviar mensagens no WhatsApp
3. O bot responderá às mensagens usando o novo token

## Segurança

A função `whatsapp-webhook` já implementa sua própria validação:
- Verifica o `WHATSAPP_VERIFY_TOKEN` para validação do webhook
- A função `wa-test` usa `TEST_ENDPOINT_TOKEN` para proteção

