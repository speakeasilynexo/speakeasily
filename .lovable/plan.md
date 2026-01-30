

# Diagnóstico: Webhook Processa Mensagens mas Bot Não Responde

## Situação Atual

| Componente | Status |
|------------|--------|
| Webhook recebendo POSTs | ✅ Funcionando |
| Processamento da lógica | ✅ Funcionando |
| Atualização do banco de dados | ✅ Funcionando |
| Envio de resposta via WhatsApp API | ⚠️ Sem logs de sucesso/erro |
| Usuário recebe resposta | ❌ Não está funcionando |

## Evidências do Diagnóstico

1. **Estado do usuário foi atualizado corretamente:**
   - Antes: `step: question_1`
   - Depois do teste com "B": `step: question_2`, `answers: [B]`, `score: 1`
   - Isso prova que a lógica está funcionando

2. **Nenhum log de erro de envio:**
   - Não há logs `[WhatsApp] Error:` nos registros
   - Isso indica que a chamada à API do WhatsApp não está gerando erros capturáveis

3. **O código envia mensagem mas não loga o resultado:**
   - A função `sendWhatsAppText` só loga em caso de erro
   - Não há log de sucesso para confirmar que a mensagem foi enviada

## Possíveis Causas

1. **WHATSAPP_PHONE_NUMBER_ID incorreto**
   - O token pode estar correto, mas o Phone Number ID pode estar errado
   - Sintoma: chamada retorna 200 mas não envia de fato

2. **Número do destinatário não autorizado**
   - O número 34672953062 precisa estar na lista de "test recipients" do Facebook
   - Modo de desenvolvimento só permite enviar para números verificados

3. **Token com permissões incompletas**
   - O token pode ter `whatsapp_business_management` mas faltar `whatsapp_business_messaging`

4. **Formato do número incorreto**
   - O número pode precisar de formatação diferente (com ou sem código do país)

## Plano de Correção

### Etapa 1: Adicionar Logs Detalhados ao Envio de Mensagens

Modificar a função `sendWhatsAppText` para logar:
- O número de destino
- A resposta completa da API (sucesso ou erro)
- O status code exato

```
Arquivo: supabase/functions/whatsapp-webhook/index.ts
Linhas: 409-444 (função sendWhatsAppText)
```

Adicionar logs antes do fetch e após a resposta, incluindo log de sucesso.

### Etapa 2: Verificar Configurações no Facebook Developer Console

O usuário deve verificar:

1. **Phone Number ID**: Confirmar que o valor em `WHATSAPP_PHONE_NUMBER_ID` corresponde ao ID mostrado em "WhatsApp > API Setup"

2. **Test Recipients**: Verificar que o número +34672953062 está na lista de destinatários de teste em "WhatsApp > API Setup > To"

3. **App Mode**: Se o app está em modo "Development", só pode enviar para números verificados

### Etapa 3: Testar com Logs Aprimorados

Após adicionar os logs, enviar uma nova mensagem de teste e verificar os logs para identificar o problema exato.

## Detalhes Técnicos da Modificação

A função `sendWhatsAppText` será modificada para:

```javascript
async function sendWhatsAppText(to: string, body: string): Promise<boolean> {
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  console.log("[WhatsApp] Attempting to send message to:", to.slice(0,4) + "****");
  console.log("[WhatsApp] Using phone_number_id:", phoneNumberId?.slice(0,4) + "****");

  // ... restante do código com logs adicionais ...

  if (response.ok) {
    console.log("[WhatsApp] Message sent successfully, response:", JSON.stringify(result));
    return true;
  } else {
    console.error("[WhatsApp] Error:", JSON.stringify(result));
    return false;
  }
}
```

## Verificações Requeridas pelo Usuário

Antes de implementar as mudanças, confirme no Facebook Developer Console:

- [ ] O Phone Number ID em `WHATSAPP_PHONE_NUMBER_ID` está correto
- [ ] O número +34672953062 está listado como "Test Recipient" 
- [ ] O aplicativo tem permissão `whatsapp_business_messaging`

## Próximos Passos

1. Aprovar este plano para implementar os logs detalhados
2. Testar novamente enviando uma mensagem do WhatsApp
3. Analisar os logs para identificar o problema exato
4. Ajustar as configurações conforme necessário

