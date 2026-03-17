

## Plano: Favicon full-bleed nítido para SpeakEasily

### O que muda

**1. Criar `public/favicon.svg`** — SVG vetorial de um balão de chat verde (#22C55E) full-bleed (sem padding), com símbolo branco dentro (três pontos ou ondas sonoras), opacidade 100%, bordas nítidas. O viewBox ocupa 100% do quadrado.

**2. Criar PNGs derivados do SVG** — Como não temos ferramentas de conversão de imagem no ambiente, criaremos o SVG inline e os PNGs serão gerados a partir de um canvas no build ou fornecidos como SVG referências. Na prática, criaremos:
- `favicon.svg` (vetorial principal)
- Manter `favicon.png` e `apple-touch-icon.png` existentes mas atualizá-los referenciando o novo design

> **Limitação**: Não é possível gerar `.ico` multi-size nem PNGs em múltiplas resoluções programaticamente neste ambiente. O que faremos é criar o **SVG perfeito** (que browsers modernos priorizam) e atualizar as referências HTML. Para `.ico` e PNGs em múltiplos tamanhos, será necessário usar uma ferramenta externa (ex: realfavicongenerator.net) com o SVG gerado.

**3. Atualizar `index.html`** — Substituir os links de favicon atuais por:
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```
Remover o link antigo `<link rel="icon" type="image/png" href="/favicon.png" />`.

**4. Atualizar `public/manifest.json`** — Trocar ícones para `android-chrome-192x192.png` e `android-chrome-512x512.png`, manter `theme_color` e `background_color` como `#22C55E`.

### Design do SVG

Balão de chat arredondado ocupando ~95% do viewBox, preenchido com `#22C55E`, com três pontos brancos centralizados (estilo "digitando"). Sem padding, sem transparência.

### O que NÃO muda
- Nenhum componente React
- Nenhum layout/UI
- Nenhuma dependência nova

### Nota importante
Os arquivos PNG em múltiplos tamanhos (16, 32, 48, 64, 192, 512) e o `.ico` precisam ser gerados externamente a partir do SVG. Posso criar o SVG e atualizar todo o HTML/manifest, e depois indicar como gerar os PNGs restantes.

