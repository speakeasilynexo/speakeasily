

## Correcoes: Audio de Boas-Vindas + Botao de Traducao

### Problema 1: Audio com conteudo errado

O arquivo `phrases/AUDIO_PHRASE_HELLO.ogg` armazenado no bucket contem uma mensagem sobre "apertar botao para traduzir" em vez de uma saudacao. O codigo esta correto — o problema e o conteudo do arquivo de audio.

**Solucao:** Trocar o asset usado no welcome para `AUDIO_PHRASE_NICE_TO_MEET_YOU` (que existe no bucket e provavelmente contem uma saudacao adequada como "Hello! Nice to meet you!"). Se o conteudo desse arquivo tambem nao for ideal, voce precisara regravar/substituir o arquivo `.ogg` no storage.

**Mudancas no codigo:**
- Arquivo: `supabase/functions/whatsapp-webhook/index.ts`
- Substituir `"AUDIO_PHRASE_HELLO"` por `"AUDIO_PHRASE_NICE_TO_MEET_YOU"` nos 3 pontos onde o audio de welcome e enviado:
  1. Primeira deteccao de idioma (~linha 4926)
  2. Handler do language_picker (~linha 4953)
  3. Case "welcome" no switch (~linha 5128)

### Problema 2: Botao de traducao

O botao interativo "Ver Traducao" esta implementado corretamente no codigo e so aparece apos exercicios (nao no welcome, o que e esperado). Se ele nao esta aparecendo durante exercicios, pode ser que:
- O `sendInteractiveButton` esta falhando e caindo no fallback de texto
- O fallback de texto ("Digite TRADUCAO") tambem pode nao estar visivel

**Verificacao:** Apos corrigir o audio, testar fazendo o fluxo completo ate chegar a um exercicio para confirmar que o botao aparece. Se nao aparecer, verificar os logs da edge function buscando por erros no envio da mensagem interativa.

### Resumo

| Mudanca | Descricao |
|---------|-----------|
| Trocar asset de welcome | `AUDIO_PHRASE_HELLO` → `AUDIO_PHRASE_NICE_TO_MEET_YOU` em 3 pontos |
| Testar botao de traducao | Verificar nos logs se `sendInteractiveButton` esta retornando sucesso nos exercicios |

### Resultado esperado

- O usuario ouve "Hello! Nice to meet you!" (ou similar) logo no primeiro contato
- O botao "Ver Traducao" aparece clicavel apos cada exercicio

