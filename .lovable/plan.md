

## Plano: Botao Interativo de Traducao + Audio de Boas-Vindas

### Problema atual

1. **Traducao**: O usuario precisa digitar "TRADUCAO" manualmente. Nao existe botao clicavel. Para um publico que nao sabe ingles, isso e uma barreira.
2. **Audio no primeiro contato**: O bot so envia texto na boas-vindas. Nenhum audio e enviado para causar impacto imediato.

---

### O que sera implementado

#### 1. Botao interativo de traducao (WhatsApp Interactive Message)

A API do WhatsApp suporta mensagens do tipo `interactive` com botoes clicaveis (maximo 3 botoes). Em vez de enviar texto pedindo para digitar "TRADUCAO", o bot enviara uma mensagem interativa com um botao que, ao ser clicado, revela a traducao.

**Como funciona:**
- Apos cada exercicio/frase-alvo, o bot envia uma mensagem interativa com o botao "Ver Traducao"
- O usuario clica no botao (sem digitar nada)
- O webhook recebe o click como um `interactive.button_reply` com um `id` especifico (ex: `btn_translate`)
- O bot responde com a traducao completa (igual ao fluxo atual do comando TRADUCAO)

**Mudancas tecnicas:**
- Arquivo: `supabase/functions/whatsapp-webhook/index.ts`
- Nova funcao `sendInteractiveTranslation(waId, bodyText, lang)` que usa o endpoint de mensagens interativas do WhatsApp
- Formato da mensagem: `type: "interactive"`, `interactive.type: "button"`, com botao "Ver Traducao" / "Ver Traduccion"
- Novo handler no fluxo principal para detectar `interactive.button_reply` com `id === "btn_translate"` e executar a mesma logica do comando TRADUCAO
- Substituir as CTAs de texto `"Digite TRADUCAO..."` por chamadas a `sendInteractiveTranslation` nos pontos onde a traducao e oferecida (feedback de exercicios, correcoes)

#### 2. Audio de boas-vindas no primeiro contato

Enviar o audio `AUDIO_PHRASE_HELLO` (ou outro asset de saudacao) logo no step `welcome`, antes ou depois da mensagem de texto de boas-vindas. Isso causa impacto imediato e mostra o diferencial do produto.

**Mudancas tecnicas:**
- Arquivo: `supabase/functions/whatsapp-webhook/index.ts`
- No case `"welcome"` (linha ~5010), adicionar chamada `sendBotAudio(waId, "AUDIO_PHRASE_HELLO")` antes de enviar a mensagem de texto
- Tambem adicionar no handler de `language_picker` (quando o idioma e definido e o bot move para welcome), para que o audio toque logo apos a selecao de idioma
- Fallback silencioso: se o audio falhar (404), o fluxo continua normalmente so com texto

---

### Resumo das mudancas

| Mudanca | Arquivo | Descricao |
|---------|---------|-----------|
| Nova funcao `sendInteractiveButton` | whatsapp-webhook/index.ts | Envia mensagem interativa do WhatsApp com botoes |
| Handler de `button_reply` | whatsapp-webhook/index.ts | Detecta cliques em botoes interativos no webhook |
| Substituir CTAs de texto por botoes | whatsapp-webhook/index.ts | Trocar "Digite TRADUCAO..." por botao clicavel |
| Audio no welcome | whatsapp-webhook/index.ts | Enviar `AUDIO_PHRASE_HELLO` no primeiro contato |

### Resultado esperado

- Usuario recebe um audio de saudacao logo no primeiro contato (impacto imediato)
- Apos cada exercicio, aparece um botao clicavel "Ver Traducao" em vez de texto pedindo para digitar
- O usuario clica e ve a traducao instantaneamente
- Zero barreiras para quem nao sabe ingles

