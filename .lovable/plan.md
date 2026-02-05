# SpeakEasily - MVP Implementation Plan

## Overview
Bot de inglés via WhatsApp com placement test profissional e sistema de aprendizado guiado.

## MVP1 - Placement Test Profissional ✅

### Fluxo em 3 partes:

1. **Parte 1/3 - Diagnóstico Rápido**
   - 3 questões múltipla escolha (A/B/C/D)
   - Q1: Tempo verbal em contexto
   - Q2: Preposição/collocation
   - Q3: Estrutura de frase
   - Microfeedback imediato após cada resposta

2. **Parte 2/3 - Produção Escrita**
   - Escrever 2 frases sobre si mesmo
   - Avaliação com heurística + LLM opcional
   - Score de 1-5

3. **Parte 3/3 - Áudio Opcional**
   - Script: "Hi, I'm ___. I'm from ___. I want to learn English because ___."
   - SKIP disponível

4. **Resultado Final**
   - Nível CEFR (A1/A2/B1/B2/C1)
   - 2 pontos fortes + 2 pontos a melhorar
   - Recomendação: Plan 7 días
   - CTA: "Escribe NEXT para empezar"

### Eventos de telemetria:
- `placement_started`
- `placement_question_answered` (metadata: q_id, answer, correct, feedback)
- `placement_written_submitted` (metadata: text, score, notes)
- `placement_audio_received` (metadata: media_id, duration, transcript, score)
- `placement_completed` (metadata: level, strengths[], weaknesses[], recommended_plan)

## MVP2 - Sistema de Aprendizado ✅

### Plan 7 días
Cada dia contém:
- 4 exercícios interativos
- 1 tarefa de produção final (texto ou áudio)
- Checkpoint (precisa 70% para passar)

### Tipos de exercícios:
- `choose_correct` - Múltipla escolha
- `fill_in_blank` - Completar lacunas
- `reorder_words` - Ordenar palavras
- `correct_the_mistake` - Corrigir erro

### Sistema de Review
- `mistake_tags` rastreados por usuário
- Comando REVIEW puxa 3 exercícios baseados nos erros
- Contagem de erros reduz quando acerta no review

### Comandos disponíveis:
- `NEXT` - Avança no plano
- `PROGRESO` - Mostra progresso + link da página
- `REVIEW` - Inicia repaso de erros
- `RESTART` - Reinicia (com confirmação)
- `HELP` - Lista comandos

### Página de progresso web
- Rota: `/u/{wa_id}`
- Mostra: nível, dia atual, lições completadas, erros frequentes, eventos recentes
- Sem autenticação (MVP)
- CTA: "Volver al WhatsApp"

## Estrutura de Dados

### wa_users
- wa_id, name, level, subscription_status, created_at, updated_at

### wa_state
- wa_id, step, data (JSON com progress, placement, etc.)

### wa_events
- wa_id, event_type, metadata (JSON), created_at

## Regras de UX
- Idioma do coach: ESPAÑOL
- Conteúdo de inglês: INGLÊS
- Respostas curtas, humanas, com emojis sutis
- Mensagens não robotizadas
