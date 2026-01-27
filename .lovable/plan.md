
## Auditoria e Correção do Webhook WhatsApp

### Diagnóstico Encontrado

Após análise detalhada, identifiquei o seguinte cenário:

1. **A Edge Function ESTÁ recebendo os POSTs** - o teste com JSON inválido gerou erro que aparece nos logs
2. **Quando o JSON é válido, os logs NÃO aparecem** - isso indica um problema específico no fluxo de sucesso
3. **O stack trace mostra linha 875**, mas o código fonte tem 1150 linhas - isso sugere que o código é compilado/bundled antes do deploy

### Causa Raiz Provável

Analisando o código atual (linhas 1089-1146), há um problema de **race condition** e **logging assíncrono**:

```typescript
// Linha 1092-1093 - Log antes do parse
const raw = await req.text();
console.log("[WEBHOOK] POST received");  // Este log deveria aparecer SEMPRE
```

O fato de este log não aparecer quando o JSON é válido, mas o erro do catch aparecer quando é inválido, indica que:

1. Os logs podem estar sendo buffered e não flushed corretamente
2. O processamento está crashando silenciosamente após o parse
3. Há um problema com as operações assíncronas subsequentes (Supabase, WhatsApp API)

### Correções Necessárias

**1. Adicionar log SÍNCRONO no início absoluto do handler**
```typescript
serve(async (req: Request) => {
  console.log(`[WEBHOOK] ${req.method} ${req.url}`);  // Log imediato
```

**2. Envolver TODO o código em try-catch robusto com logs granulares**
```typescript
if (req.method === "POST") {
  console.log("[WEBHOOK] POST handler started");
  
  let raw: string;
  try {
    raw = await req.text();
    console.log("[WEBHOOK] Body read, length:", raw.length);
  } catch (e) {
    console.error("[WEBHOOK] Failed to read body:", e);
    return new Response("OK", { status: 200 });
  }
  
  let body: WhatsAppWebhookPayload;
  try {
    body = JSON.parse(raw);
    console.log("[WEBHOOK] JSON parsed, object:", body?.object);
  } catch (e) {
    console.error("[WEBHOOK] JSON parse failed:", e);
    return new Response("OK", { status: 200 });
  }
  // ... resto do código
}
```

**3. Responder 200 IMEDIATAMENTE e processar em background**
```typescript
// Retornar 200 para a Meta imediatamente
const responsePromise = new Response("OK", { status: 200, headers: corsHeaders });

// Processar mensagem em background (sem bloquear)
EdgeRuntime.waitUntil(processWebhookAsync(body, supabase));

return responsePromise;
```

**4. Adicionar função auxiliar para teste de "Olá 👋"**
Garantir que a resposta simples funcione antes de processar a lógica completa.

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/whatsapp-webhook/index.ts` | Correção do handler POST com logs granulares |

### O que NÃO será alterado (conforme solicitado)

- Arquitetura geral do projeto
- Lógica de processamento de mensagens (processMessage)
- Sistema de trial/onboarding
- Configurações de CORS
- Verificação GET (webhook verification)

### Resultado Esperado

Após a correção:
1. Você verá logs detalhados para CADA requisição POST
2. A Meta receberá 200 rapidamente (evitando retries)
3. Se uma mensagem de texto chegar, você receberá "Olá 👋" como resposta
4. Qualquer erro será logado com contexto suficiente para debug

### Validação

Após implementar, farei:
1. Deploy automático da edge function
2. Teste POST com payload válido
3. Verificação dos logs
4. Teste de envio de mensagem WhatsApp (se as credenciais permitirem)
