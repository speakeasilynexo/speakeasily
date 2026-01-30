
# Diagnóstico: Webhook WhatsApp não processa mensagens

## Problema Identificado

Após testar a edge function diretamente, os logs mostram claramente o problema:

```
ERROR [WhatsApp] Error: {"error":{"message":"(#10) Application does not have permission for this action"
```

**Tradução:** O Access Token do WhatsApp Cloud API não tem permissões suficientes para enviar mensagens.

## Estado Atual

| Componente | Status |
|------------|--------|
| Edge Function `whatsapp-webhook` | ✅ Funcionando |
| Webhook URL configurada no Meta | ⚠️ Possivelmente incorreta |
| Recebimento do payload | ✅ OK (testei manualmente) |
| Processamento da mensagem | ✅ OK |
| Envio de resposta ao usuário | ❌ Falha - Permissões do token |

## Análise do Fluxo

```text
[Meta/WhatsApp] ────POST────> [Edge Function] ────> [Processa] ────> [Tenta Responder] ────X [ERRO: Token sem permissão]
```

## Causa Raiz

O `WHATSAPP_ACCESS_TOKEN` configurado nos secrets tem um dos seguintes problemas:

1. **Token temporário expirado** - Os tokens de teste do Facebook expiram em 24 horas
2. **Permissões faltando** - O token não tem a permissão `whatsapp_business_messaging`
3. **Token de tipo incorreto** - Pode ser um token de usuário em vez de um token de sistema

## Por que os webhooks do Meta não apareciam nos logs?

Se o Meta estava enviando webhooks e nada aparecia nos logs, isso indica que:
- O webhook pode estar apontando para uma URL incorreta
- Ou a verificação do webhook falhou (o verify token não coincide)

---

## Plano de Correção (3 etapas)

### Etapa 1: Verificar/Atualizar o Access Token

**No Facebook Developer Console:**

1. Acesse **WhatsApp > API Setup**
2. Gere um novo **Temporary Access Token** (válido por 24h para testes)
3. Para produção, crie um **System User Access Token**:
   - Vá em Business Settings > System Users
   - Crie um System User com papel Admin
   - Gere um token com permissão `whatsapp_business_messaging`
4. Atualize o secret `WHATSAPP_ACCESS_TOKEN` no Lovable Cloud

### Etapa 2: Verificar Configuração do Webhook no Meta

**URL correta do webhook:**
```
https://njaylytxqksoibyiijms.supabase.co/functions/v1/whatsapp-webhook
```

**No Facebook Developer Console:**

1. Vá em **WhatsApp > Configuration > Webhook**
2. Clique em **Edit**
3. Confirme que a URL está exatamente como acima
4. O Verify Token deve ser igual ao secret `WHATSAPP_VERIFY_TOKEN`
5. Clique em **Verify and Save**

### Etapa 3: Testar Fluxo Completo

Após atualizar o token:

1. Envie uma mensagem do WhatsApp para o número de teste
2. Verifique os logs da edge function
3. Confirme que a resposta foi enviada

---

## Implementação Técnica

Não há alterações de código necessárias. O problema é de **configuração** no Facebook Developer Console.

### Ação Requerida do Usuário

1. Acessar o Facebook Developer Console
2. Gerar um novo Access Token com as permissões corretas
3. Atualizar o secret `WHATSAPP_ACCESS_TOKEN` nos Cloud Secrets
4. Verificar a URL do webhook está correta no Meta
5. Testar enviando uma mensagem

### Permissões Necessárias no Token

O token de acesso deve ter:
- `whatsapp_business_management`
- `whatsapp_business_messaging`

### Checklist Final

- [ ] Novo Access Token gerado
- [ ] Token atualizado no Cloud Secrets
- [ ] URL do webhook verificada no Meta
- [ ] Webhook subscrito ao evento `messages`
- [ ] Teste de envio de mensagem funcionando
