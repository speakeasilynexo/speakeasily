

# Atualização do WHATSAPP_ACCESS_TOKEN

## Objetivo

Atualizar o secret `WHATSAPP_ACCESS_TOKEN` com o novo token permanente fornecido pelo usuário para restaurar a funcionalidade de envio de mensagens do bot.

## Contexto

O token anterior expirou em 30-Jan-26, causando erro 401 nas tentativas de envio de mensagens. O novo token foi gerado pelo usuário no Meta Business Settings.

## Passos de Implementação

### 1. Atualizar o Secret

Atualizar o valor do secret `WHATSAPP_ACCESS_TOKEN` no Lovable Cloud com o novo token:
- Token: `EAAYgmYUSHkcBQg6bZCgEJIRRJAJZC7TOmyvSis55pqVZB9ixgpv2xTeowRMibEYhZAZCQKFv3yjxb71F9KB0TehCocmwOHcua0o0hR0l8I8kW7ignCB3ehFM52BKPDjDqFe9wyTRJOKDlXg0wu6N4P5ONm6LaZCQkV4RZBYIqxXt55qBRalv61PZCvKZCf0M2a3SCEqjTmciHZC0MBCEqD0Dws8MDXUlZCLJFvlLjZAY`

### 2. Testar a Conexão

Após atualizar o secret, testar o envio de mensagem usando o endpoint `wa-test` para confirmar que o token está funcionando.

### 3. Verificar Logs

Verificar os logs do edge function para confirmar que não há mais erros de autenticação (401) ou permissão (erro 10).

## Resultado Esperado

Após a atualização:
1. O bot voltará a responder mensagens no WhatsApp
2. Os logs mostrarão status 200 nas chamadas para a API do Meta
3. Você poderá testar o fluxo do quiz enviando "restart"

## Detalhes Técnicos

| Item | Valor |
|------|-------|
| Secret a atualizar | `WHATSAPP_ACCESS_TOKEN` |
| Tamanho do token | 213 caracteres |
| Edge functions afetadas | `whatsapp-webhook`, `wa-test` |

