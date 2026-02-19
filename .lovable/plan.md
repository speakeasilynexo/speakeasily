
## Diagnóstico: Audio antigo sendo tocado após substituição dos arquivos

### Causa raiz identificada

O código do webhook esta **correto e sem alteracoes necessarias**. Os mappings no `AUDIO_ASSETS` ja apontam para os paths certos:

```
COACH_CORRECTION_01: "coach/correction_01.ogg"   (linha 243)
COACH_TRY_AGAIN_01:  "coach/try_again_01.ogg"    (linha 242)
```

E os pontos de uso tambem estao corretos:
- Linha 4675: `sendBotAudio(waId, "COACH_CORRECTION_01")` — tocado quando a resposta esta errada
- Linha 3882: `sendBotAudio(waId, "COACH_TRY_AGAIN_01")` — tocado no shadowing apos falha de pronuncia

### Por que o audio antigo ainda foi tocado?

As Edge Functions ficam em memoria por um tempo apos o ultimo deploy. Quando voce substituiu os arquivos `.ogg` no Storage, a funcao em execucao nao reiniciou automaticamente. O arquivo novo ja esta no Storage, mas a instancia antiga pode ter feito cache da URL assinada do arquivo anterior.

### O que sera feito

**Apenas um redeploy da funcao `whatsapp-webhook`** — sem nenhuma alteracao de codigo.

O redeploy forca:
1. Encerramento de todas as instancias em execucao (confirmado pelos logs de `shutdown` que aparecem nos logs recentes)
2. Boot de nova instancia com o codigo atual
3. Nas proximas chamadas ao Storage, o arquivo novo `correction_01.ogg` e `try_again_01.ogg` serao buscados frescos sem cache

### Confirmacao dos paths corretos (auditoria)

| Asset key | Path no Storage | Usado em |
|---|---|---|
| `COACH_CORRECTION_01` | `coach/correction_01.ogg` | Erro em exercicio de texto (linha 4675) |
| `COACH_TRY_AGAIN_01` | `coach/try_again_01.ogg` | Shadowing com pronuncia incorreta (linha 3882) |
| `COACH_GREAT_JOB_01` | `coach/great_job_01.ogg` | Shadowing com pronuncia correta (linha 3861) |
| `COACH_WELCOME_01` | `coach/welcome_01.ogg` | Primeiro contato (linhas 5315, 5346, 5526) |
| `COACH_YOUR_TURN_01` | `coach/your_turn_01.ogg` | Exercicios subsequentes (linha 4455) |
| `COACH_REPEAT_AFTER_ME_01` | `coach/repeat_after_me_01.ogg` | Primeiro exercicio do dia (linha 4442) |
| `COACH_AUDIO_NOT_CLEAR_01` | `coach/audio_not_clear_01.ogg` | Falha de transcricao de audio (linhas 3847, 4539) |

### Nenhum arquivo de codigo sera alterado

Somente o redeploy da funcao `whatsapp-webhook` sera executado.
