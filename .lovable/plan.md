

# Diagnóstico: WhatsApp Webhooks Não Chegam

## Situação Atual

| Item | Status |
|------|--------|
| Número +34 657 10 01 00 | Conectado no WhatsApp Manager ✅ |
| Secret WHATSAPP_PHONE_NUMBER_ID | Atualizado para `972394899295556` ✅ |
| Edge function `whatsapp-webhook` | Ativa e responde a verificações ✅ |
| Webhooks recebidos | ❌ Nenhum POST chegando |

## Diagnóstico

O problema está **no lado do Meta** - a verificação do webhook foi feita, mas Meta não está entregando os eventos. Possíveis causas:

1. **Subscrição de webhook não está ativa** para o campo `messages` na conta WABA
2. **O número precisa ser re-associado** ao webhook após registro
3. **Permissões do App** podem estar incompletas

## Plano de Ação

### Passo 1: Testar Envio de Mensagem (Saída)
Primeiro precisamos confirmar que as credenciais do número real funcionam para **enviar** mensagens. Isso valida:
- Access Token está correto
- Phone Number ID está correto
- Número está realmente ativo na Cloud API

Você precisará me fornecer seu **número pessoal** (para onde enviar a mensagem de teste).

### Passo 2: Verificar Subscrições do Webhook
No Meta Developer Console:
1. Vá em **WhatsApp → Configuración**
2. Na seção **Webhook**, clique em **Administrar**
3. Confirme que **messages** tem ✅ (checkbox marcado)
4. Se não tiver, marque e salve

### Passo 3: Verificar App Webhooks (Nível Geral)
1. No Meta Developer Console, vá em **Configuración del app → Webhooks**
2. Procure por **WhatsApp Business Account**
3. Confirme que a URL está subscrita e ativa

### Passo 4: Re-verificar o Webhook
1. Vá em **WhatsApp → Configuración**
2. Clique em **Editar** no webhook
3. Mantenha a mesma URL e Token
4. Clique em **Verificar y guardar** novamente

### Passo 5: Localizar API Logs no Meta
Para encontrar logs de webhook no Meta:
1. Vá em **developers.facebook.com**
2. Selecione seu App
3. No menu lateral, procure **Herramientas** ou **Tools**
4. Clique em **API Log** ou **Webhook Logs**

Se não encontrar, tente:
- **App Dashboard → Activity Log**
- **WhatsApp → Herramientas → API Log**

## Detalhes Técnicos

A edge function está pronta e funcional:

```text
POST /functions/v1/whatsapp-webhook
├── Lê body como texto
├── Parse JSON
├── Valida payload (object === "whatsapp_business_account")
├── Processa em background com EdgeRuntime.waitUntil()
└── Retorna 200 OK imediatamente
```

A verificação GET também funciona:
- Verificamos anteriormente que a função responde corretamente ao challenge do Meta

## Próximos Passos

1. **Informe seu número pessoal** para teste de envio
2. **Confirme subscrição do campo "messages"** no webhook
3. **Procure API Logs** no Meta para ver se há tentativas de entrega

