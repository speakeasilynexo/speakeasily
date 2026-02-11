

## Comando Admin `/admin test_audio`

Adicionar um novo subcomando admin que chama `sendBotAudio` diretamente, sem depender do fluxo de exercícios. Isso permite testar qualquer asset de audio de forma isolada.

### O que muda

Um unico bloco novo dentro da funcao `handleAdminCommand` no arquivo `supabase/functions/whatsapp-webhook/index.ts`.

### Comportamento

- **Comando**: `/admin test_audio [asset_key]`
  - Exemplo: `/admin test_audio AUDIO_COACH_REPEAT_AFTER_ME`
- Se nenhum asset_key for fornecido, lista todos os assets disponiveis no mapa `AUDIO_ASSETS`
- Chama `sendBotAudio(waId, assetKey)` diretamente
- Mostra o resultado estruturado (`BotAudioResult`) com bucket, path, reason, etc.
- Se o audio for enviado com sucesso, o usuario recebe o audio no WhatsApp
- Se der 404, mostra a mensagem de fallback + diagnostico admin

### Detalhes tecnicos

- Arquivo modificado: `supabase/functions/whatsapp-webhook/index.ts`
- Adicionar um bloco `if (subcommand === "test_audio")` dentro de `handleAdminCommand`, antes do bloco default de status
- Validar que o `arg` e uma chave valida de `AUDIO_ASSETS` usando `Object.keys(AUDIO_ASSETS)`
- Sem asset key: enviar lista formatada dos assets disponiveis
- Com asset key valida: chamar `sendBotAudio` e enviar o resultado como mensagem admin
- Sem novos arquivos, sem refactor, sem mudanca de arquitetura
- Adicionar string de template `admin_test_audio_result` nas traducoes existentes

