

## Plano: Corrigir o Crash no Fluxo de Placement (Chat não responde)

### Problema Identificado

Quando o bot está no step `placement_q1`, `placement_q2` ou `placement_q3`, se `state.data.placement` não existe (por exemplo, após um `/admin reset` ou `/admin step`), a função `handlePlacementQuestion` faz `state.data.placement!.question_index` e crasheia com TypeError. O erro é engolido silenciosamente pelo try/catch do processamento em background, e o utilizador não recebe resposta.

Isto também acontece quando o utilizador chega organicamente ao placement sem que o objeto `placement` tenha sido inicializado corretamente.

### Solução

Modificar **1 ficheiro**: `supabase/functions/whatsapp-webhook/index.ts`

#### Alteração 1: Proteção no `handlePlacementQuestion` (linhas ~4048-4055)
Adicionar verificação de `state.data.placement` no início da função. Se não existir, inicializar com valores padrão e sincronizar o `question_index` com o step atual:

```
if (!state.data.placement) {
  const stepIndex = state.step === "placement_q1" ? 0 
                  : state.step === "placement_q2" ? 1 
                  : 2;
  state.data.placement = {
    part: 1,
    question_index: stepIndex,
    mcq_answers: [],
    mcq_score: 0,
  };
  await updateState(supabase, waId, state.step, state.data);
}
```

#### Alteração 2: Proteção no switch case para placement (linhas ~5623-5628)
Adicionar inicialização automática do placement quando o step é `placement_q*` mas não há dados de placement:

```
case "placement_q1":
case "placement_q2":
case "placement_q3": {
  // Auto-init placement if missing (e.g. after /admin step)
  if (!state.data.placement) {
    const stepIndex = state.step === "placement_q1" ? 0 
                    : state.step === "placement_q2" ? 1 : 2;
    state.data.placement = {
      part: 1, question_index: stepIndex,
      mcq_answers: [], mcq_score: 0,
    };
  }
  // Sync question_index with step
  const expectedIndex = state.step === "placement_q1" ? 0 
                      : state.step === "placement_q2" ? 1 : 2;
  state.data.placement.question_index = expectedIndex;
  
  await handlePlacementQuestion(supabase, waId, messageText, state, lang, audioData, isAdmin);
  break;
}
```

#### Alteração 3: Proteção no `/admin step` (linha ~2289)
Quando o admin pula para um step de placement, inicializar automaticamente os dados necessários:

```
if (targetStep.startsWith("placement_q")) {
  const qIndex = targetStep === "placement_q1" ? 0 
               : targetStep === "placement_q2" ? 1 : 2;
  state.data.placement = state.data.placement || {
    part: 1, question_index: qIndex,
    mcq_answers: [], mcq_score: 0,
  };
  state.data.placement.question_index = qIndex;
}
```

### Resultado Esperado

- Ao enviar "Hola" no step `placement_q2`, o bot responderá: "Responda com A, B, C ou D"
- Ao enviar "B", o bot avaliará a resposta e avançará normalmente
- O `/admin step placement_q1` funcionará sem crashar

### Ficheiros alterados: 1
- `supabase/functions/whatsapp-webhook/index.ts` — 3 blocos de proteção contra `placement` undefined

