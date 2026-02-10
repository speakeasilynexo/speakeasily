

## Redirecionar CTA do card Premium para /subscribe

Mudanca unica e pontual: no arquivo `src/components/landing/Pricing.tsx`, trocar o link do botao "Elegir Premium" (card de 9 euros) de WhatsApp para `/subscribe`.

### O que muda

- **Arquivo**: `src/components/landing/Pricing.tsx`
- Importar `Link` de `react-router-dom`
- No card Premium (o que tem `plan.highlight === true`), trocar `<a href={WHATSAPP_LINK}>` por `<Link to="/subscribe">`
- O card "Prueba Gratis" continua apontando para WhatsApp normalmente
- Nenhum outro arquivo e alterado

### Detalhes tecnicos

- Adicionar condicional no render: se `plan.highlight` usar `Link to="/subscribe"`, senao manter `<a href={WHATSAPP_LINK}>`
- Manter `Button` com `asChild` (padrao existente)
- Zero dependencias novas, zero mudancas de cor/layout

