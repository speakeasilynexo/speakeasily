

## Plano: Proteger TODAS as etapas contra `state.data` indefinido

### Problema

O fix anterior só cobriu `placement_q1/2/3`. Mas `handlePlacementWritten`, `handlePlacementAudio` e `handlePlacementResult` também fazem `state.data.placement!` sem verificação — crash silencioso quando admin salta para esses steps.

O mesmo pode acontecer em `select_goal` (usa `progress!`) e potencialmente outros handlers.

### Solução

Modificar **1 ficheiro**: `supabase/functions/whatsapp-webhook/index.ts`

#### 1. Expandir o `/admin step` para inicializar placement em TODOS os steps de placement (não só `placement_q*`)

Linha ~2290: mudar `targetStep.startsWith("placement_q")` para `targetStep.startsWith("placement")`:

```typescript
if (targetStep.startsWith("placement")) {
  const qIndex = targetStep === "placement_q1" ? 0 
               : targetStep === "placement_q2" ? 1 
               : targetStep === "placement_q3" ? 2 :