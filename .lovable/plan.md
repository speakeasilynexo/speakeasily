
# Plano: Correção de Responsividade para Android Antigo (320px-360px)

## Resumo
Ajustes mínimos de CSS/Tailwind para garantir que a página funcione perfeitamente em telas pequenas sem cortar botões, causar scroll horizontal ou desalinhar elementos.

---

## Arquivos a Modificar

| Arquivo | Tipo de Mudança |
|---------|-----------------|
| `src/index.css` | Adicionar regras globais anti-overflow |
| `src/pages/Index.tsx` | Ajustar classes Tailwind pontuais |

---

## Mudanças Detalhadas

### 1. src/index.css - Anti-overflow Global

Adicionar no `@layer base` regras para prevenir scroll horizontal:

```css
html, body, #root {
  overflow-x: hidden;
  max-width: 100vw;
}
```

---

### 2. src/pages/Index.tsx - Ajustes por Seção

#### Header (linhas 24-48)
- Reduzir padding do header em mobile
- Botão "Empieza Ahora": texto menor e padding reduzido em telas pequenas

**Mudanças:**
- Container: `px-4` para `px-3`
- Botão: adicionar `text-xs sm:text-sm px-3 sm:px-4`

#### Hero Title (linha 61)
- Reduzir tamanho da fonte para telas muito pequenas
- Adicionar quebra de palavra segura

**Mudanças:**
- De `text-4xl md:text-5xl lg:text-6xl` para `text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl`

#### Hero CTA Button (linhas 73-78)
- Garantir que o botão não corte em 320px
- Adicionar `w-full` em mobile e permitir quebra de texto

**Mudanças:**
- Adicionar `w-full sm:w-auto` e `whitespace-normal text-center`
- Reduzir padding: `px-4 sm:px-8`

#### Phone Mockup (linhas 87-117)
- Esconder blur decorativo em telas pequenas (causa overflow)

**Mudanças:**
- De `blur-3xl` para `blur-3xl hidden sm:block`

#### Final CTA Button (linhas 295-301)
- Mesmo tratamento do Hero CTA

**Mudanças:**
- Adicionar `w-full sm:w-auto whitespace-normal text-center`
- Reduzir padding: `px-4 sm:px-8`

---

## Resumo Visual das Mudanças

```text
+--------------------------------------------------+
|  HEADER                                          |
|  - px-3 (mobile) / px-4 (desktop)               |
|  - Botão menor em mobile                        |
+--------------------------------------------------+
|  HERO                                           |
|  - Título: text-2xl (320px) -> text-6xl (lg)   |
|  - CTA: w-full em mobile                       |
|  - Blur: hidden em mobile                      |
+--------------------------------------------------+
|  SECTIONS                                       |
|  - Mantidas (já responsivas)                   |
+--------------------------------------------------+
|  FINAL CTA                                      |
|  - Botão: w-full + padding menor em mobile     |
+--------------------------------------------------+
```

---

## Checklist de Teste

Após implementação, testar em:

- [ ] **320px** - iPhone SE 1ª geração / Android antigo
- [ ] **360px** - Android comum (Galaxy J, Moto G antigo)
- [ ] **390px** - iPhone 12/13/14
- [ ] **Chrome DevTools** - Emulação Android
- [ ] **Verificar**: Sem scroll horizontal em nenhuma tela
- [ ] **Verificar**: Todos os botões clicáveis (min 44px touch)
- [ ] **Verificar**: Textos não cortados

---

## Seção Tecnica

### Classes Tailwind Adicionadas

| Elemento | Classes Novas |
|----------|---------------|
| html/body | `overflow-x: hidden; max-width: 100vw;` (CSS) |
| Header container | `px-3 sm:px-4` |
| Header button | `text-xs sm:text-sm px-3 sm:px-4` |
| Hero h1 | `text-2xl sm:text-4xl` (breakpoint ajustado) |
| Hero CTA | `w-full sm:w-auto px-4 sm:px-8 whitespace-normal` |
| Mockup blur | `hidden sm:block` |
| Final CTA | `w-full sm:w-auto px-4 sm:px-8 whitespace-normal` |

### Estimativa
- **2 arquivos** modificados
- **~15 linhas** de mudanças pontuais
- **Zero refactor estrutural**
