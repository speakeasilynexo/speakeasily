

# Plano: Atualizar Configuração para Número WhatsApp Real

## Situação Atual
O número real **+34 657 10 01 00** foi registrado com sucesso na API do Meta (status: `Conectado`). 

O novo **Phone Number ID** é: `972394899295556`

## O Que Precisa Ser Feito

### Passo 1: Atualizar o Secret WHATSAPP_PHONE_NUMBER_ID
Vou solicitar que você atualize o valor do secret para o novo ID.

**Novo valor:** `972394899295556`

### Passo 2: Verificar Webhook no Meta Developer Console
Você precisará verificar se o webhook está configurado para o número correto:

1. Acesse **developers.facebook.com** → seu App → **WhatsApp** → **Configuração**
2. Na seção **Webhook**, verifique:
   - **URL do Webhook**: `https://njaylytxqksoibyiijms.supabase.co/functions/v1/whatsapp-webhook`
   - **Verify Token**: `SPEAKEASILY_VERIFY`
3. **IMPORTANTE**: Na caixa de seleção de número (onde aparecia o número de teste), agora deve aparecer o número real **+34 657 10 01 00**. Selecione-o.
4. Em **Campos do Webhook**, certifique-se que **messages** está inscrito para o número real.

### Passo 3: Testar
Após as atualizações:
1. Envie "restart" para **+34 657 10 01 00**
2. Verificarei os logs para confirmar recebimento

## Alterações Técnicas
- Nenhuma alteração de código necessária
- Apenas atualização do secret `WHATSAPP_PHONE_NUMBER_ID`

## Resumo das Ações
| Ação | Responsável |
|------|-------------|
| Atualizar secret WHATSAPP_PHONE_NUMBER_ID para `972394899295556` | Você (via prompt que vou mostrar) |
| Selecionar número real no dropdown do webhook | Você (Meta Developer Console) |
| Inscrever campo "messages" para o número real | Você (Meta Developer Console) |
| Verificar logs após teste | Eu |

