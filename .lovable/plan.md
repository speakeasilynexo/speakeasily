
# Atualização do Favicon e Meta Tags - SpeakEasily

## Arquivo Recebido
- **Imagem:** `user-uploads://favicon_512_x_512_px.png`
- **Dimensões:** 512x512px (ideal para PWA e favicon)
- **Formato:** PNG com fundo branco

## Alterações Planejadas

### 1. Copiar a imagem para o projeto

Copiar o arquivo de logo para a pasta `public/`:
- `public/favicon.png` - favicon principal
- `public/apple-touch-icon.png` - ícone para iOS
- `public/icon-192.png` / `public/icon-512.png` - ícones PWA (usar o mesmo arquivo 512px)

### 2. Atualizar index.html

| Elemento | Antes | Depois |
|----------|-------|--------|
| `<title>` | "Lovable App" | "SpeakEasily - Aprende inglés por WhatsApp" |
| `<meta description>` | "Lovable Generated Project" | "Aprende inglés de forma natural conversando por WhatsApp" |
| `<link rel="icon">` | (não existe) | `/favicon.png` |
| `<link rel="apple-touch-icon">` | (não existe) | `/apple-touch-icon.png` |
| `og:title` | "Lovable App" | "SpeakEasily" |
| `og:description` | genérico | descrição do app |
| `og:image` | lovable.dev | `/og-image.png` (logo) |

### 3. Criar manifest.json para PWA (opcional mas recomendado)

```json
{
  "name": "SpeakEasily",
  "short_name": "SpeakEasily",
  "icons": [
    { "src": "/favicon.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#22C55E",
  "background_color": "#ffffff",
  "display": "standalone"
}
```

## Sequência de Implementação

1. Copiar `user-uploads://favicon_512_x_512_px.png` para `public/favicon.png`
2. Copiar mesmo arquivo para `public/apple-touch-icon.png`
3. Atualizar `index.html` com novos metadados e links de favicon
4. Criar `public/manifest.json` para suporte PWA
5. Remover `public/favicon.ico` antigo (opcional)

## Resultado Esperado

- Favicon do SpeakEasily visível na aba do navegador
- Ícone correto ao salvar como atalho no celular
- Meta tags de compartilhamento atualizadas com branding SpeakEasily
- Preparado para instalação como PWA
