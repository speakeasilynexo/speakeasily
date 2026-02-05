
# Plano: Corrigir Links WhatsApp (CTA)

## Diagnóstico

Os botões CTA (Call to Action) do site estão com links incorretos para o WhatsApp, causando o problema de exibir lista de contatos ao invés de abrir diretamente a conversa com o bot.

### Arquivos afetados:

| Arquivo | Problema | Linha |
|---------|----------|-------|
| `src/pages/Index.tsx` | Placeholder `TU_NUMERO` não substituído | 19 |
| `src/pages/StudentProgress.tsx` | Formato correto, mas sem `?text=` | 182, 196, 396 |

## Solução

### 1. Atualizar `Index.tsx`

**Antes:**
```typescript
const whatsappLink = "https://wa.me/TU_NUMERO?text=Hello";
```

**Depois:**
```typescript
const whatsappLink = "https://wa.me/34657100100?text=Hello";
```

O número `34657100100` corresponde a:
- `34` = código país Espanha
- `657100100` = número do bot (657 10 01 00)

### 2. Atualizar `StudentProgress.tsx`

**Antes:**
```typescript
const whatsappLink = `https://wa.me/34657100100`;
```

**Depois:**
```typescript
const whatsappLink = "https://wa.me/34657100100?text=NEXT";
```

Adicionamos `?text=NEXT` para que o usuário já tenha a mensagem pré-preenchida ao voltar para continuar as lições.

## Comportamento Esperado Após Correção

1. Usuário clica em qualquer CTA do site
2. WhatsApp abre diretamente na tela de conversa com o número +34 657 10 01 00
3. Campo de texto já vem preenchido com "Hello" (landing page) ou "NEXT" (página de progresso)
4. Usuário só precisa clicar em enviar

## Arquivos a Modificar

```text
src/pages/Index.tsx        → linha 19
src/pages/StudentProgress.tsx → linhas 182, 196, 396
```

## Detalhes Técnicos

O formato do link `wa.me` deve seguir estas regras:
- Usar apenas dígitos (sem `+`, espaços ou hífens)
- Incluir código do país
- Parâmetro `text` é opcional mas melhora UX
- URL deve ser codificada se o texto tiver caracteres especiais

Exemplo completo:
```
https://wa.me/34657100100?text=Hello
```
