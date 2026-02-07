

# Plano: Fluxo de Áudio Profissional com Rate Limiting

## Contexto

O bot atual responde com "Não consegui entender o áudio (muito baixo ou com ruído)" quando a API do OpenAI falha por falta de quota. Isso é enganoso e parece fake. Precisamos de um fluxo honesto e profissional.

## Visão Geral das Mudanças

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE ÁUDIO ATUAL                         │
├─────────────────────────────────────────────────────────────────┤
│  Audio → Transcrição → Falha API → "Áudio baixo/ruído" ❌      │
│                                    (mensagem errada)            │
└─────────────────────────────────────────────────────────────────┘

                            ↓

┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE ÁUDIO NOVO                          │
├─────────────────────────────────────────────────────────────────┤
│  Audio → Check Rate Limit → Transcrição → Sucesso:             │
│                   ↓                         • "Eu ouvi: ..."    │
│              Se limite:                     • Correção EN       │
│              "Limite beta"                  • Frase para repetir│
│                   ↓                                             │
│              Se falha API:                                      │
│              "Modo beta indisponível, envie texto"              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Criar Tabelas no Banco de Dados

### Tabela: `audio_transcription_errors`
Registra falhas de transcrição para análise.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| wa_id | text | Telefone do usuário |
| error_code | text | quota_exceeded, rate_limit, auth_error, etc |
| raw_error | text | Resposta completa da API |
| request_id | text | ID único da requisição |
| created_at | timestamptz | Timestamp |

### Tabela: `audio_usage`
Controla rate limit por usuário e global.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| wa_id | text | Telefone (ou 'global' para contagem global) |
| date | date | Data do uso |
| count | integer | Quantidade de áudios no dia |
| created_at | timestamptz | Timestamp |

**Índice único**: `(wa_id, date)` para upsert eficiente.

---

## 2. Modificar Função `transcribeAudio`

**Arquivo**: `supabase/functions/whatsapp-webhook/index.ts`  
**Linhas**: ~2250-2280

### Mudança: Diferenciar tipos de erro 429

```text
Atual:
  if (response.status === 429) → error: "rate_limit"

Novo:
  if (response.status === 429) {
    if (errorText contém "insufficient_quota") → error: "quota_exceeded"
    senão → error: "rate_limit"
  }
  if (response.status === 401) → error: "auth_error"
  if (response.status === 403) → error: "auth_error"
```

---

## 3. Adicionar Funções de Rate Limiting

**Arquivo**: `supabase/functions/whatsapp-webhook/index.ts`  
**Local**: Após a função `processAudioMessage` (~linha 2376)

### Novas funções:

```text
checkAudioRateLimit(supabase, waId):
  - Buscar contagem do usuário hoje (limite: 2/dia)
  - Buscar contagem global hoje (limite: 20/dia)
  - Retornar { allowed: boolean, reason?: "user_limit" | "global_limit" }

incrementAudioUsage(supabase, waId):
  - Upsert em audio_usage para usuário
  - Upsert em audio_usage para "global"

logTranscriptionError(supabase, waId, errorCode, rawError, requestId):
  - Insert em audio_transcription_errors
```

---

## 4. Adicionar Novas Strings I18N

**Arquivo**: `supabase/functions/whatsapp-webhook/index.ts`  
**Local**: Dicionário I18N (~linha 540)

```text
audio_beta_unavailable_pt:
  "⚠️ O modo de áudio está em beta e temporariamente indisponível.
   Por favor, envie a mesma frase por texto."

audio_beta_unavailable_es:
  "⚠️ El modo de audio está en beta y temporalmente no disponible.
   Por favor, envía la misma frase por texto."

audio_beta_limit_reached_pt:
  "⚠️ Limite do modo beta atingido hoje.
   Por favor, envie sua resposta por texto."

audio_beta_limit_reached_es:
  "⚠️ Límite del modo beta alcanzado hoy.
   Por favor, envía tu respuesta por texto."
```

---

## 5. Modificar `handleConversationalAudio`

**Arquivo**: `supabase/functions/whatsapp-webhook/index.ts`  
**Linhas**: ~2674-2741

### Novo fluxo:

```text
1. ANTES de transcrever, verificar rate limit:
   - Se limite excedido → enviar mensagem "limite beta" → return true

2. Chamar transcrição

3. Se falhou:
   - Logar erro em audio_transcription_errors
   - Se error = quota_exceeded | auth_error | rate_limit | whisper_error_*:
     → enviar mensagem "beta indisponível, envie texto"
   - Se error = download_failed | fetch_url_failed:
     → manter mensagem atual (problema de áudio real)

4. Se sucesso:
   - Incrementar contagem de uso
   - Enviar "Eu ouvi: ..." primeiro
   - Depois correção + frase para repetir
```

---

## 6. Atualizar Outros Handlers de Áudio

Os mesmos princípios devem ser aplicados em:
- Handler de áudio no placement test (~linha 3400+)
- Handler de áudio em exercícios (~linha 3600+)

Verificar se usam `processAudioMessage` e aplicar mesma lógica de erro.

---

## Resumo das Mudanças

| Local | Tipo | Descrição |
|-------|------|-----------|
| Banco de dados | Migração | Criar tabelas `audio_transcription_errors` e `audio_usage` |
| Linha ~2257 | Código | Diferenciar `quota_exceeded` de `rate_limit` |
| Linha ~2376 | Código | Adicionar 3 novas funções helper |
| Linha ~540 | I18N | Adicionar 4 novas strings de erro |
| Linha ~2674 | Código | Modificar `handleConversationalAudio` para novo fluxo |

---

## Constantes de Rate Limit

```text
const AUDIO_LIMIT_PER_USER_DAY = 2;   // 2 áudios/usuário/dia
const AUDIO_LIMIT_GLOBAL_DAY = 20;    // 20 áudios/dia total
```

Estes valores são conservadores para o beta. Podem ser ajustados depois.

---

## Resultado Esperado

| Cenário | Mensagem Atual | Mensagem Nova |
|---------|---------------|---------------|
| Quota excedida | "Áudio baixo/ruído" ❌ | "Modo beta indisponível, envie texto" ✅ |
| Rate limit API | "Áudio baixo/ruído" ❌ | "Modo beta indisponível, envie texto" ✅ |
| Limite diário usuário | N/A | "Limite beta atingido, envie texto" ✅ |
| Áudio realmente ruim | "Áudio baixo/ruído" | "Áudio baixo/ruído" (mantém) |
| Transcrição OK | Feedback genérico | "Eu ouvi: ..." + correção + frase |

