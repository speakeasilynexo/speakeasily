
# Plano: Corrigir Deep Link do WhatsApp

## Diagnóstico

O problema ocorre porque os links do WhatsApp estão com `target="_blank"`, que em dispositivos iOS/Safari mobile faz o sistema interpretar como "compartilhamento" ao invés de deep link direto.

## Solução

Remover `target="_blank"` e `rel="noopener noreferrer"` de todos os links WhatsApp para que o iOS reconheça corretamente como deep link.

### Arquivos a modificar:

| Arquivo | Linhas | Mudança |
|---------|--------|---------|
| `src/pages/Index.tsx` | 44, 74, 258, 296 | Remover `target="_blank" rel="noopener noreferrer"` |
| `src/pages/StudentProgress.tsx` | Verificar CTAs | Mesma correção se aplicável |

### Exemplo da mudança:

**Antes:**
```tsx
<a href={whatsappLink} target="_blank" rel="noopener noreferrer">
```

**Depois:**
```tsx
<a href={whatsappLink}>
```

## Comportamento Esperado

1. Usuário clica no botão CTA
2. iOS detecta o link `wa.me` como deep link
3. WhatsApp abre diretamente na conversa com +34 657 10 01 00
4. Mensagem "Hello" ou "NEXT" já aparece pré-preenchida

## Detalhes Técnicos

- Links `wa.me` são Universal Links no iOS
- Quando abertos sem `target="_blank"`, o iOS os intercepta e abre diretamente no app
- Com `target="_blank"`, o Safari tenta abrir nova aba, o que pode confundir o sistema de deep links
